/**
 * 授予状态自动变更定时任务
 *
 * 自动流转规则：
 * 1. GRANTED → VESTING: 当前日期 >= 归属开始日期 (vestingStartDate)
 * 2. VESTING → VESTED: 当前日期 >= 归属结束日期 (vestingEndDate)
 *
 * 运行方式：
 * - 开发环境: npx ts-node src/scripts/vesting-cron.ts
 * - 生产环境: 配置到系统的 crontab 或使用 Vercel Cron
 */

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

  // 查询所有状态为 GRANTED 且归属开始日期 <= 今天的授予
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

  console.log(`[${new Date().toISOString()}] Found ${grants.length} grants to transition from GRANTED to VESTING`)

  for (const grant of grants) {
    try {
      await prisma.$transaction(async (tx) => {
        // 更新授予状态
        await tx.grant.update({
          where: { id: grant.id },
          data: { status: 'VESTING' },
        })

        // 记录状态变更日志
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

      console.log(`[✓] Grant ${grant.id}: GRANTED → VESTING`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        grantId: grant.id,
        from: 'GRANTED',
        to: 'VESTING',
        success: false,
        error: errorMessage,
      })
      console.error(`[✗] Grant ${grant.id}: Failed to transition GRANTED → VESTING - ${errorMessage}`)
    }
  }

  return results
}

/**
 * 查找并更新所有需要从 VESTING → VESTED 的授予
 */
async function processVestingToVested(today: Date): Promise<TransitionResult[]> {
  const results: TransitionResult[] = []

  // 查询所有状态为 VESTING 且归属结束日期 <= 今天的授予
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

  console.log(`[${new Date().toISOString()}] Found ${grants.length} grants to transition from VESTING to VESTED`)

  for (const grant of grants) {
    try {
      await prisma.$transaction(async (tx) => {
        // 更新授予状态
        await tx.grant.update({
          where: { id: grant.id },
          data: { status: 'VESTED' },
        })

        // 记录状态变更日志
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

        // 创建归属事件记录
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

      console.log(`[✓] Grant ${grant.id}: VESTING → VESTED`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        grantId: grant.id,
        from: 'VESTING',
        to: 'VESTED',
        success: false,
        error: errorMessage,
      })
      console.error(`[✗] Grant ${grant.id}: Failed to transition VESTING → VESTED - ${errorMessage}`)
    }
  }

  return results
}

/**
 * 主函数
 */
async function main() {
  const startTime = new Date()
  console.log(`\n[${startTime.toISOString()}] Starting vesting cron job...`)
  console.log('=' .repeat(60))

  const today = getToday()
  console.log(`Reference date: ${today.toISOString().split('T')[0]}\n`)

  try {
    // 处理 GRANTED → VESTING
    const grantedResults = await processGrantedToVesting(today)

    // 处理 VESTING → VESTED
    const vestedResults = await processVestingToVested(today)

    // 汇总结果
    const allResults = [...grantedResults, ...vestedResults]
    const successCount = allResults.filter((r) => r.success).length
    const failCount = allResults.filter((r) => !r.success).length

    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()

    console.log('\n' + '='.repeat(60))
    console.log(`[${endTime.toISOString()}] Vesting cron job completed`)
    console.log(`Duration: ${duration}ms`)
    console.log(`Total processed: ${allResults.length}`)
    console.log(`Success: ${successCount}`)
    console.log(`Failed: ${failCount}`)
    console.log('='.repeat(60) + '\n')

    // 如果有失败的，以非零退出码退出
    if (failCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal error during vesting cron job:`, error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行主函数
main()
