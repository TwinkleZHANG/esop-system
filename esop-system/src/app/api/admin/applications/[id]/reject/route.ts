import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

/**
 * POST /api/admin/applications/[id]/reject
 * 管理员审批拒绝申请
 *
 * Body:
 * - reviewerId: 审批人ID
 * - reviewRemark: 拒绝原因（必填）
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

    if (!reviewRemark) {
      return NextResponse.json(
        { error: 'Review remark is required for rejection' },
        { status: 400 }
      )
    }

    // 查询申请
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        grant: true,
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

    // 更新申请状态
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewerId,
        reviewRemark,
        reviewedAt: new Date(),
      },
    })

    // 记录审计日志
    await prisma.auditLog.create({
      data: {
        entityType: 'Application',
        entityId: id,
        action: 'REJECT',
        oldValue: { status: 'PENDING' },
        newValue: {
          status: 'REJECTED',
          reviewRemark,
        },
        operatorId: reviewerId,
        operatorRole: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Application rejected',
      application: updatedApplication,
    })
  } catch (error) {
    console.error('Failed to reject application:', error)
    return NextResponse.json(
      { error: 'Failed to reject application' },
      { status: 500 }
    )
  }
}
