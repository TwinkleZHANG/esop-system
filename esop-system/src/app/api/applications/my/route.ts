import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

/**
 * GET /api/applications/my?employeeId=xxx
 * 员工查看自己的申请列表
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    const applications = await prisma.application.findMany({
      where: {
        employeeId,
      },
      include: {
        grant: {
          include: {
            plan: {
              select: {
                title: true,
                type: true,
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
