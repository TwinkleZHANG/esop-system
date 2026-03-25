import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { canTransition } from '@/lib/state-machine/grant-state-machine'
import { GrantStatus } from '@prisma/client'

// 状态变更
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { status: newStatus, document, operator } = body

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Missing target status' },
        { status: 400 }
      )
    }

    // 获取当前授予信息
    const grant = await prisma.grant.findUnique({
      where: { id },
      include: { plan: true },
    })

    if (!grant) {
      return NextResponse.json(
        { error: 'Grant not found' },
        { status: 404 }
      )
    }

    const currentStatus = grant.status
    const planType = grant.plan.type

    // 验证状态流转是否合法
    if (!canTransition(planType, currentStatus, newStatus as GrantStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${newStatus} for ${planType}`,
        },
        { status: 400 }
      )
    }

    // 更新授予状态
    const updatedGrant = await prisma.grant.update({
      where: { id },
      data: {
        status: newStatus as GrantStatus,
      },
    })

    // 记录状态变更日志
    await prisma.auditLog.create({
      data: {
        entityType: 'Grant',
        entityId: id,
        action: 'STATUS_CHANGE',
        oldValue: { status: currentStatus },
        newValue: { status: newStatus, document },
        operatorId: operator || 'system',
        operatorRole: 'ADMIN',
      },
    })

    return NextResponse.json(updatedGrant)
  } catch (error) {
    console.error('Failed to update grant status:', error)
    return NextResponse.json(
      { error: 'Failed to update grant status' },
      { status: 500 }
    )
  }
}

// 获取允许的状态流转
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const grant = await prisma.grant.findUnique({
      where: { id },
      include: { plan: true },
    })

    if (!grant) {
      return NextResponse.json(
        { error: 'Grant not found' },
        { status: 404 }
      )
    }

    const { getAllowedTransitions, statusLabels } = await import(
      '@/lib/state-machine/grant-state-machine'
    )

    const allowedStatuses = getAllowedTransitions(grant.plan.type, grant.status)

    return NextResponse.json({
      currentStatus: grant.status,
      currentStatusLabel: statusLabels[grant.status],
      allowedTransitions: allowedStatuses.map((s) => ({
        value: s,
        label: statusLabels[s],
      })),
    })
  } catch (error) {
    console.error('Failed to get allowed transitions:', error)
    return NextResponse.json(
      { error: 'Failed to get allowed transitions' },
      { status: 500 }
    )
  }
}
