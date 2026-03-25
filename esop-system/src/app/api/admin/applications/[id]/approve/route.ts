import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { ApplicationType, GrantStatus, AssetType, AssetTxType } from '@prisma/client'

/**
 * 根据申请类型获取目标状态
 */
function getTargetStatus(type: ApplicationType): GrantStatus | null {
  const statusMap: Record<ApplicationType, GrantStatus | null> = {
    EXERCISE: 'EXERCISED',
    TRANSFER: 'SETTLED',
    DIVIDEND: 'SETTLED',
    REDEEM: 'SETTLED',
  }
  return statusMap[type]
}

/**
 * 根据计划类型获取资产类型
 */
function getAssetType(planType: string): AssetType {
  const typeMap: Record<string, AssetType> = {
    RSU: 'COMMON_SHARE',
    OPTION: 'COMMON_SHARE',
    LP_SHARE: 'LP_SHARE',
    VIRTUAL_SHARE: 'VIRTUAL_SHARE',
  }
  return typeMap[planType] || 'COMMON_SHARE'
}

/**
 * POST /api/admin/applications/[id]/approve
 * 管理员审批通过申请
 *
 * Body:
 * - reviewerId: 审批人ID
 * - reviewRemark: 审批备注（可选）
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { reviewerId, reviewRemark } = body

    if (!reviewerId) {
      return NextResponse.json(
        { error: 'Reviewer ID is required' },
        { status: 400 }
      )
    }

    // 查询申请
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        grant: {
          include: {
            plan: true,
            employee: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // 验证申请状态
    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Application is already ${application.status}` },
        { status: 400 }
      )
    }

    const targetStatus = getTargetStatus(application.type)
    if (!targetStatus) {
      return NextResponse.json(
        { error: 'Invalid application type' },
        { status: 400 }
      )
    }

    const oldStatus = application.grant.status
    const { grant, employeeId, type, quantity, price } = application

    // 计算新的已处理数量
    const processedQty = grant.processedQty ? parseFloat(grant.processedQty.toString()) : 0
    const requestedQty = parseFloat(quantity.toString())
    const newProcessedQty = processedQty + requestedQty
    const totalQty = parseFloat(grant.quantity.toString())

    // 确定是否全部处理完毕
    const isFullyProcessed = newProcessedQty >= totalQty
    const newStatus = isFullyProcessed ? targetStatus : grant.status

    // 使用事务执行所有操作
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新申请状态
      const updatedApplication = await tx.application.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewerId,
          reviewRemark,
          reviewedAt: new Date(),
        },
      })

      // 2. 更新授予状态和处理数量
      const updatedGrant = await tx.grant.update({
        where: { id: grant.id },
        data: {
          status: newStatus,
          processedQty: newProcessedQty,
        },
      })

      // 3. 记录状态变更日志
      await tx.auditLog.create({
        data: {
          entityType: 'Grant',
          entityId: grant.id,
          action: 'STATUS_CHANGE',
          oldValue: { status: oldStatus, processedQty: processedQty },
          newValue: {
            status: newStatus,
            processedQty: newProcessedQty,
            requestedQty: requestedQty,
            triggeredBy: 'APPLICATION_APPROVED',
            applicationId: id,
          },
          operatorId: reviewerId,
          operatorRole: 'ADMIN',
        },
      })

      // 4. 创建税务事件
      const taxEvent = await tx.taxEvent.create({
        data: {
          grantId: grant.id,
          eventType: type === 'EXERCISE' ? 'EXERCISE_TAX' : 'VESTING_TAX',
          triggerDate: new Date(),
          quantity,
          status: 'TRIGGERED',
        },
      })

      // 5. 查找或创建资产持仓
      let assetPosition = await tx.assetPosition.findFirst({
        where: {
          employeeId: grant.employeeId,
          assetType: getAssetType(grant.plan.type),
        },
      })

      const assetTxType = type === 'EXERCISE' ? 'ISSUANCE' : 'SETTLEMENT'

      if (assetPosition) {
        // 更新现有持仓
        const newQuantity = parseFloat(assetPosition.quantity.toString()) + parseFloat(quantity.toString())
        assetPosition = await tx.assetPosition.update({
          where: { id: assetPosition.id },
          data: {
            quantity: newQuantity,
          },
        })
      } else {
        // 创建新持仓
        assetPosition = await tx.assetPosition.create({
          data: {
            employeeId: grant.employeeId,
            assetType: getAssetType(grant.plan.type),
            quantity,
            costBasis: price || grant.strikePrice || null,
          },
        })
      }

      // 6. 创建资产流水
      await tx.assetTransaction.create({
        data: {
          positionId: assetPosition.id,
          txType: assetTxType,
          quantity,
          price: price || grant.strikePrice,
          relatedGrantId: grant.id,
          relatedTaxEventId: taxEvent.id,
          txDate: new Date(),
        },
      })

      return { updatedApplication, updatedGrant, taxEvent }
    })

    return NextResponse.json({
      success: true,
      message: isFullyProcessed
        ? 'Application approved successfully - Grant fully processed'
        : 'Application approved successfully - Partial processing',
      application: result.updatedApplication,
      grant: result.updatedGrant,
      isFullyProcessed,
      remainingQty: totalQty - newProcessedQty,
    })
  } catch (error) {
    console.error('Failed to approve application:', error)
    return NextResponse.json(
      { error: 'Failed to approve application' },
      { status: 500 }
    )
  }
}
