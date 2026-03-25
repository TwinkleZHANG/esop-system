import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { ApplicationType, GrantStatus, PlanType } from '@prisma/client'

/**
 * POST /api/applications
 * 员工提交申请（行权/转让/分红/赎回）
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { grantId, employeeId, type, quantity, price, remark } = body

    // 验证必填字段
    if (!grantId || !employeeId || !type || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 验证申请类型
    if (!Object.values(ApplicationType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid application type' },
        { status: 400 }
      )
    }

    // 查询授予信息
    const grant = await prisma.grant.findUnique({
      where: { id: grantId },
      include: { plan: true },
    })

    if (!grant) {
      return NextResponse.json(
        { error: 'Grant not found' },
        { status: 404 }
      )
    }

    // 验证授予属于该员工
    if (grant.employeeId !== employeeId) {
      return NextResponse.json(
        { error: 'Grant does not belong to this employee' },
        { status: 403 }
      )
    }

    // 验证申请类型与授予类型匹配
    const validTransitions: Record<PlanType, { status: GrantStatus; types: ApplicationType[] }> = {
      OPTION: { status: 'VESTED', types: ['EXERCISE'] },
      RSU: { status: 'VESTED', types: ['TRANSFER', 'DIVIDEND'] },
      LP_SHARE: { status: 'VESTED', types: ['TRANSFER', 'DIVIDEND', 'REDEEM'] },
      VIRTUAL_SHARE: { status: 'VESTED', types: ['TRANSFER', 'DIVIDEND', 'REDEEM'] },
    }

    const transitionRule = validTransitions[grant.plan.type]

    if (!transitionRule.types.includes(type)) {
      return NextResponse.json(
        { error: `Application type ${type} is not valid for ${grant.plan.type}` },
        { status: 400 }
      )
    }

    // 验证授予状态
    if (grant.status !== transitionRule.status) {
      return NextResponse.json(
        { error: `Grant status must be ${transitionRule.status} to submit this application` },
        { status: 400 }
      )
    }

    // 验证申请数量（基于剩余数量）
    const requestedQty = parseFloat(quantity)
    const totalQty = parseFloat(grant.quantity.toString())
    const processedQty = grant.processedQty ? parseFloat(grant.processedQty.toString()) : 0
    const remainingQty = totalQty - processedQty

    if (requestedQty <= 0 || requestedQty > remainingQty) {
      return NextResponse.json(
        { error: `Invalid quantity. Available: ${remainingQty}, Requested: ${requestedQty}` },
        { status: 400 }
      )
    }

    // 验证行权价（期权行权时需要）
    if (type === 'EXERCISE' && grant.plan.type === 'OPTION') {
      if (!price && !grant.strikePrice) {
        return NextResponse.json(
          { error: 'Exercise price is required for option exercise' },
          { status: 400 }
        )
      }
    }

    // 检查是否已有待审批的申请
    const existingPending = await prisma.application.findFirst({
      where: {
        grantId,
        employeeId,
        status: 'PENDING',
      },
    })

    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending application for this grant' },
        { status: 400 }
      )
    }

    // 创建申请
    const application = await prisma.application.create({
      data: {
        grantId,
        employeeId,
        type,
        quantity: parseFloat(quantity),
        price: price ? parseFloat(price) : grant.strikePrice,
        remark,
        status: 'PENDING',
      },
      include: {
        grant: {
          include: {
            plan: true,
          },
        },
      },
    })

    // 记录审计日志
    await prisma.auditLog.create({
      data: {
        entityType: 'Application',
        entityId: application.id,
        action: 'CREATE',
        newValue: {
          type,
          quantity: parseFloat(quantity),
          status: 'PENDING',
        },
        operatorId: employeeId,
        operatorRole: 'EMPLOYEE',
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Failed to create application:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}
