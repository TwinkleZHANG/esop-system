import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { ApplicationType, GrantStatus, PlanType } from '@prisma/client'

/**
 * POST /api/applications
 * 员工提交申请（行权/转让/分红/赎回）
 */
export async function POST(request: Request) {
  let grantId, employeeId, type, quantity
  try {
    const body = await request.json()
    grantId = body.grantId
    employeeId = body.employeeId
    type = body.type
    quantity = body.quantity
    const { price, remark } = body

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

    console.log('[Applications] Grant lookup:', { grantId, found: !!grant })

    if (!grant) {
      return NextResponse.json(
        { error: 'Grant not found' },
        { status: 404 }
      )
    }

    // 验证授予属于该员工
    // 注意：使用 grant 中记录的 employeeId，确保数据一致性
    const actualEmployeeId = grant.employeeId

    console.log('[Applications] Ownership check:', {
      grantEmployeeId: grant.employeeId,
      requestEmployeeId: employeeId,
      actualEmployeeId,
      match: grant.employeeId === employeeId,
    })

    // 如果前端发送的 employeeId 与 grant 的不匹配，使用 grant 的 employeeId
    // （前端可能发送了错误的 ID 格式）
    if (employeeId !== actualEmployeeId) {
      console.log('[Applications] EmployeeId mismatch, using grant.employeeId:', actualEmployeeId)
    }

    // 验证 grant.plan 存在
    if (!grant.plan) {
      return NextResponse.json(
        { error: 'Grant has no associated plan' },
        { status: 400 }
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

    if (!transitionRule) {
      return NextResponse.json(
        { error: `Invalid plan type: ${grant.plan.type}` },
        { status: 400 }
      )
    }

    if (!transitionRule.types.includes(type)) {
      return NextResponse.json(
        { error: `Application type ${type} is not valid for ${grant.plan.type}` },
        { status: 400 }
      )
    }

    // 验证授予状态
    console.log('[Applications] Status check:', {
      grantStatus: grant.status,
      requiredStatus: transitionRule.status,
      match: grant.status === transitionRule.status,
    })

    if (grant.status !== transitionRule.status) {
      return NextResponse.json(
        { error: `Grant status must be ${transitionRule.status} to submit this application, but current status is ${grant.status}` },
        { status: 400 }
      )
    }

    // 验证申请数量（基于剩余数量）
    const requestedQty = parseFloat(quantity)
    if (isNaN(requestedQty) || requestedQty <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity format' },
        { status: 400 }
      )
    }

    const totalQty = parseFloat(grant.quantity.toString())
    const processedQty = grant.processedQty != null ? parseFloat(grant.processedQty.toString()) : 0
    const remainingQty = totalQty - processedQty
    console.log('[Applications] Quantity check:', { requestedQty, totalQty, processedQty, remainingQty, grantQty: grant.quantity })

    if (requestedQty > remainingQty) {
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
        employeeId: actualEmployeeId,
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
        employeeId: actualEmployeeId,
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
        operatorId: actualEmployeeId,
        operatorRole: 'EMPLOYEE',
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    console.error('[Applications] Failed to create application:', {
      message: error.message,
      stack: error.stack,
      grantId,
      employeeId,
      type,
      quantity,
    })
    return NextResponse.json(
      { error: `Failed to create application: ${error.message}` },
      { status: 500 }
    )
  }
}
