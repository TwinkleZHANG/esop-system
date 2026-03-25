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

    // 先查找员工（通过 employeeId 如 EMP003）
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // 使用员工的 UUID (employee.id) 查询申请
    const applications = await prisma.application.findMany({
      where: {
        employeeId: employee.id,
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
