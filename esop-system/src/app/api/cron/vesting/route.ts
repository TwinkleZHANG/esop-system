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
 */
async function processVestingToVested(today: Date): Promise<TransitionResult[]> {
  const results: TransitionResult[] = []

  const grants = await prisma.grant.findMany({
    where: {
      status: 'VESTING',
      vestingEndDate: {
        not: null,
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
          data: { status: 'VESTED' },
        })

        await tx.auditLog.create({
          data: {
            entityType: 'Grant',
            entityId: grant.id,
            action: 'AUTO_STATUS_CHANGE',
            oldValue: { status: 'VESTING' },
            newValue: { status: 'VESTED', reason: 'Vesting end date reached' },
            operatorId: 'system',
            operatorRole: 'SYSTEM',
          },
        })

        await tx.vestingEvent.create({
          data: {
            grantId: grant.id,
            vestDate: today,
            quantity: grant.quantity,
            cumulativeQty: grant.quantity,
            status: 'VESTED',
          },
        })
      })

      results.push({
        grantId: grant.id,
        from: 'VESTING',
        to: 'VESTED',
        success: true,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        grantId: grant.id,
        from: 'VESTING',
        to: 'VESTED',
        success: false,
        error: errorMessage,
      })
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
  const today = getToday()

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
