import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { ApplicationStatus } from '@prisma/client'

/**
 * GET /api/admin/applications
 * 管理员查看所有申请（支持筛选）
 *
 * Query params:
 * - status: PENDING | APPROVED | REJECTED | CANCELLED
 * - type: EXERCISE | TRANSFER | DIVIDEND | REDEEM
 * - employeeId: 筛选特定员工
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ApplicationStatus | null
    const type = searchParams.get('type')
    const employeeId = searchParams.get('employeeId')

    const where: any = {}

    if (status && Object.values(ApplicationStatus).includes(status)) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (employeeId) {
      where.employeeId = employeeId
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        grant: {
          include: {
            plan: {
              select: {
                title: true,
                type: true,
              },
            },
            employee: {
              select: {
                name: true,
                employeeId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
