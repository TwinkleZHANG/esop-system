import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { GrantStatus } from '@prisma/client'

interface TransitionResult {
  grantId: string
  from: GrantStatus
  to: GrantStatus
  success: boolean
  error?: string
}

/**
 * 获取今天的日期（去掉时间部分，精确到日）
 */
function getToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * 查找并更新所有需要从 GRANTED → VESTING 的授予
 */
async function processGrantedToVesting(today: Date): Promise<TransitionResult[]> {
  const results: TransitionResult[] = []

  const grants = await prisma.grant.findMany({
    where: {
      status: 'GRANTED',
      vestingStartDate: {
        lte: today,
      },
    },
    include: {
      plan: true,
    },
  })

  for (const grant of grants) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.grant.update({
          where: { id: grant.id },
          data: { status: 'VESTING' },
        })

        await tx.auditLog.create({
          data: {
            entityType: 'Grant',
            entityId: grant.id,
            action: 'AUTO_STATUS_CHANGE',
            oldValue: { status: 'GRANTED' },
            newValue: { status: 'VESTING', reason: 'Vesting start date reached' },
            operatorId: 'system',
            operatorRole: 'SYSTEM',
          },
        })
      })

      results.push({
        grantId: grant.id,
        from: 'GRANTED',
        to: 'VESTING',
        success: true,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        grantId: grant.id,
        from: 'GRANTED',
        to: 'VESTING',
        success: false,
        error: errorMessage,
      })
    }
  }

  return results
}

/**
 * 查找并更新所有需要从 VESTING → VESTED 的授予
 * 基于 vestingEvent 表中的事件来处理
 */
async function processVestingToVested(today: Date): Promise<TransitionResult[]> {
  const results: TransitionResult[] = []

  const pendingEvents = await prisma.vestingEvent.findMany({
    where: {
      status: 'PENDING',
      vestDate: { lte: today },
    },
    include: {
      grant: {
        include: { employee: true, plan: true }
      }
    }
  })

  const eventsByGrant = pendingEvents.reduce((acc, event) => {
    if (!acc[event.grantId]) acc[event.grantId] = []
    acc[event.grantId].push(event)
    return acc
  }, {} as Record<string, typeof pendingEvents>)

  for (const [grantId, events] of Object.entries(eventsByGrant)) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.vestingEvent.updateMany({
          where: { id: { in: events.map(e => e.id) } },
          data: { status: 'VESTED' }
        })

        // 1. 查找或创建 AssetPosition
        const employeeId = events[0].grant.employeeId
        const grant = events[0].grant

        let position = await tx.assetPosition.findFirst({
          where: {
            employeeId,
          }
        })

        if (!position) {
          // 如果还没有持仓账户，自动创建
          const accountId = `ACC-${Date.now()}`
          position = await tx.assetPosition.create({
            data: {
              accountId,
              employeeId,
              assetType: 'COMMON_SHARE',
              quantity: 0,
              currency: 'CNY',
              status: 'ACTIVE',
            }
          })
        }

        // 2. 计算总归属数量并更新 AssetPosition
        const totalQuantity = events.reduce((sum, e) => sum + Number(e.quantity), 0)
        const currentQty = Number(position.quantity)
        const newQty = currentQty + totalQuantity

        await tx.assetPosition.update({
          where: { id: position.id },
          data: { quantity: newQty }
        })

        // 3. 获取最新 FMV
        const latestValuation = await tx.valuation.findFirst({
          orderBy: { date: 'desc' }
        })

        // 4. 生成 Transaction ID 并写入 AssetTransaction
        const todayDate = new Date()
        const dateStr = todayDate.toISOString().slice(0, 10).replace(/-/g, '')
        const count = await tx.assetTransaction.count({
          where: { trxId: { startsWith: `TRX-${dateStr}` } }
        })
        const trxId = `TRX-${dateStr}-${String(count + 1).padStart(3, '0')}`

        await tx.assetTransaction.create({
          data: {
            trxId,
            positionId: position.id,
            changeType: 'SETTLEMENT',
            quantity: totalQuantity,
            costBasis: latestValuation ? Number(latestValuation.fmv) : null,
            balanceAfter: newQty,
            tradeDate: todayDate,
            relatedGrantId: grant.id,
          }
        })

        // 5. RSU 归属时自动触发税务事件 (VESTING_TAX)
        if (grant.type === 'RSU') {
          const fmv = latestValuation ? Number(latestValuation.fmv) : 0
          const taxableAmount = totalQuantity * fmv

          await tx.taxEvent.create({
            data: {
              grantId: grant.id,
              eventType: 'VESTING_TAX',
              triggerDate: today,
              quantity: totalQuantity,
              taxableAmount,
              status: 'PENDING',
            }
          })
        }

        const allEvents = await tx.vestingEvent.findMany({ where: { grantId } })
        const allVested = allEvents.every(e =>
          e.status === 'VESTED' || events.find(pe => pe.id === e.id)
        )

        if (allVested) {
          await tx.grant.update({
            where: { id: grantId },
            data: { status: 'VESTED' }
          })
          await tx.auditLog.create({
            data: {
              entityType: 'Grant',
              entityId: grantId,
              action: 'AUTO_STATUS_CHANGE',
              oldValue: { status: 'VESTING' },
              newValue: { status: 'VESTED', reason: 'All vesting events completed' },
              operatorId: 'system',
              operatorRole: 'SYSTEM',
            }
          })
        }
      })
      results.push({ grantId, from: 'VESTING', to: 'VESTED', success: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({ grantId, from: 'VESTING', to: 'VESTED', success: false, error: errorMessage })
    }
  }

  return results
}

/**
 * GET /api/cron/vesting
 *
 * 执行归属状态自动变更任务
 * 可以配置到 Vercel Cron 或外部调度器
 *
 * 安全配置建议（可选）：
 * - 添加 CRON_SECRET 环境变量验证
 * - 或限制仅允许特定 IP 访问
 */
export async function GET(request: Request) {
  const startTime = new Date()

  // 支持 testDate 参数用于测试
  const { searchParams } = new URL(request.url)
  const testDate = searchParams.get('testDate')
  const today = testDate ? new Date(testDate) : getToday()

  try {
    // 可选：验证 cron secret
    // const { searchParams } = new URL(request.url)
    // const secret = searchParams.get('secret')
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // 处理 GRANTED → VESTING
    const grantedResults = await processGrantedToVesting(today)

    // 处理 VESTING → VESTED
    const vestedResults = await processVestingToVested(today)

    const allResults = [...grantedResults, ...vestedResults]
    const successCount = allResults.filter((r) => r.success).length
    const failCount = allResults.filter((r) => !r.success).length
    const endTime = new Date()

    return NextResponse.json({
      success: failCount === 0,
      timestamp: startTime.toISOString(),
      duration: endTime.getTime() - startTime.getTime(),
      referenceDate: today.toISOString().split('T')[0],
      isTestMode: !!testDate,
      summary: {
        total: allResults.length,
        success: successCount,
        failed: failCount,
      },
      transitions: {
        grantedToVesting: {
          count: grantedResults.filter((r) => r.success).length,
          details: grantedResults,
        },
        vestingToVested: {
          count: vestedResults.filter((r) => r.success).length,
          details: vestedResults,
        },
      },
    })
  } catch (error) {
    console.error('Vesting cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Vesting cron job failed',
        timestamp: startTime.toISOString(),
      },
      { status: 500 }
    )
  }
}
