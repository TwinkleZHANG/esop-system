import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { calculateVestingSchedule } from '@/lib/vesting'

/**
 * POST /api/grants/:id/vesting
 * 重新生成归属计划（用于修复缺失归属事件的授予）
 * 仅允许 GRANTED / VESTING 状态且有完整归属参数的授予
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const grant = await prisma.grant.findUnique({
      where: { id },
      include: { vestingEvents: true },
    })

    if (!grant) {
      return NextResponse.json(
        { error: 'Grant not found' },
        { status: 404 }
      )
    }

    // 仅允许 GRANTED / VESTING 状态
    if (grant.status !== 'GRANTED' && grant.status !== 'VESTING') {
      return NextResponse.json(
        { error: `当前状态 ${grant.status} 不允许重新生成归属计划` },
        { status: 400 }
      )
    }

    // 检查归属参数是否完整
    if (!grant.vestingYear || !grant.vestingFrequency) {
      return NextResponse.json(
        { error: '缺少归属参数（vestingYear 或 vestingFrequency），请先编辑授予信息' },
        { status: 400 }
      )
    }

    const schedule = calculateVestingSchedule(
      Number(grant.quantity),
      new Date(grant.vestingStartDate),
      grant.vestingYear,
      grant.cliffPeriod ?? 0,
      grant.vestingFrequency
    )

    // 在事务中删除旧事件并创建新事件
    await prisma.$transaction(async (tx) => {
      await tx.vestingEvent.deleteMany({ where: { grantId: id } })

      await tx.vestingEvent.createMany({
        data: schedule.events.map((event) => ({
          grantId: id,
          vestDate: event.date,
          quantity: event.quantity,
          cumulativeQty: event.cumulativeQuantity,
          status: event.date <= new Date() ? 'VESTED' : 'PENDING',
        })),
      })

      await tx.auditLog.create({
        data: {
          entityType: 'Grant',
          entityId: id,
          action: 'REGENERATE_VESTING',
          oldValue: { eventCount: grant.vestingEvents.length },
          newValue: { eventCount: schedule.events.length },
          operatorId: 'admin',
          operatorRole: 'ADMIN',
        },
      })
    })

    return NextResponse.json({
      success: true,
      eventsGenerated: schedule.events.length,
    })
  } catch (error) {
    console.error('Failed to regenerate vesting schedule:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate vesting schedule' },
      { status: 500 }
    )
  }
}
