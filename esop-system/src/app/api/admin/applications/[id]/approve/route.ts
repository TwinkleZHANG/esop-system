import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { ApplicationType, GrantStatus, AssetType, AssetTxType, PlanType } from '@prisma/client'

/**
 * 根据申请类型和计划类型，获取全部处理完毕后的目标状态
 * LP/虚拟股权：转让/分红/赎回不改变状态（保持 VESTED，可多次操作）
 * RSU：交割后 SETTLED
 * Option：行权后 EXERCISED，交割后 SETTLED
 */
function getTargetStatus(appType: ApplicationType, planType: PlanType): GrantStatus | null {
  if (planType === 'LP_SHARE' || planType === 'VIRTUAL_SHARE') {
    // LP/虚拟股权在 VESTED 后可多次转让/分红/赎回，不改变 grant 状态
    return null
  }
  const statusMap: Record<ApplicationType, GrantStatus> = {
    EXERCISE: 'EXERCISED',
    TRANSFER: 'SETTLED',
    DIVIDEND: 'SETTLED',
    REDEEM: 'SETTLED',
  }
  return statusMap[appType]
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
 * 判断该审批是否需要触发税务事件
 *
 * 规则：
 * - RSU：税务在 cron 归属时已自动触发，审批时不再创建
 * - Option：行权(EXERCISE)审批时触发 EXERCISE_TAX
 * - LP/虚拟股权：转让/分红/赎回审批时触发 VESTING_TAX
 */
function shouldCreateTaxEvent(planType: PlanType, appType: ApplicationType): { create: boolean; eventType?: 'EXERCISE_TAX' | 'VESTING_TAX' } {
  switch (planType) {
    case 'RSU':
      // RSU 税务已在归属时由 cron 创建
      return { create: false }
    case 'OPTION':
      if (appType === 'EXERCISE') {
        return { create: true, eventType: 'EXERCISE_TAX' }
      }
      return { create: false }
    case 'LP_SHARE':
    case 'VIRTUAL_SHARE':
      // 转让/分红/赎回都触发税务事件
      return { create: true, eventType: 'VESTING_TAX' }
    default:
      return { create: false }
  }
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

    const oldStatus = application.grant.status
    const { grant, employeeId, type, quantity, price } = application
    const planType = grant.plan.type

    // 计算新的已处理数量
    const processedQty = grant.processedQty ? parseFloat(grant.processedQty.toString()) : 0
    const requestedQty = parseFloat(quantity.toString())
    const newProcessedQty = processedQty + requestedQty
    const totalQty = parseFloat(grant.quantity.toString())

    // 确定是否全部处理完毕以及目标状态
    const isFullyProcessed = newProcessedQty >= totalQty
    const targetStatus = getTargetStatus(type, planType)
    // 仅在全部处理完毕且有目标状态时变更（LP/虚拟股权不变更）
    const newStatus = (isFullyProcessed && targetStatus) ? targetStatus : grant.status

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

      // 4. 按规则创建税务事件（RSU 不创建，已在归属时触发）
      const taxRule = shouldCreateTaxEvent(planType, type)
      let taxEvent = null
      if (taxRule.create && taxRule.eventType) {
        // 获取最新 FMV 用于计算应税金额
        const latestValuation = await tx.valuation.findFirst({
          orderBy: { date: 'desc' },
        })
        const fmv = latestValuation ? Number(latestValuation.fmv) : 0
        const strikePrice = grant.strikePrice ? Number(grant.strikePrice) : 0
        // Option 行权：应税金额 = 数量 * (FMV - 行权价)
        // LP/虚拟股权：应税金额 = 数量 * FMV
        const taxableAmount = taxRule.eventType === 'EXERCISE_TAX'
          ? requestedQty * (fmv - strikePrice)
          : requestedQty * fmv

        taxEvent = await tx.taxEvent.create({
          data: {
            grantId: grant.id,
            eventType: taxRule.eventType,
            triggerDate: new Date(),
            quantity,
            taxableAmount: taxableAmount > 0 ? taxableAmount : 0,
            status: 'PENDING',
          },
        })
      }

      // 5. 查找或创建资产持仓
      let assetPosition = await tx.assetPosition.findFirst({
        where: {
          employeeId: grant.employeeId,
          assetType: getAssetType(grant.plan.type),
        },
      })

      // 确定交易类型
      const assetTxType: AssetTxType = 'SETTLEMENT'

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
            accountId: `ACC-${Date.now()}`,
            employeeId: grant.employeeId,
            assetType: getAssetType(grant.plan.type),
            quantity,
          },
        })
      }

      // 6. 创建资产流水
      const trxId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`
      const currentBalance = parseFloat(assetPosition.quantity.toString())
      await tx.assetTransaction.create({
        data: {
          trxId,
          positionId: assetPosition.id,
          changeType: assetTxType,
          quantity,
          costBasis: price || grant.strikePrice,
          balanceAfter: currentBalance,
          tradeDate: new Date(),
          relatedGrantId: grant.id,
          relatedTaxEventId: taxEvent?.id || null,
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
