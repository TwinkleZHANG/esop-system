import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

/**
 * GET /api/employee/tax-events?employeeId=xxx
 * 获取员工的税务事件
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

    // 先查找员工
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // 获取员工的所有授予
    const grants = await prisma.grant.findMany({
      where: { employeeId: employee.id },
      select: { id: true },
    })

    const grantIds = grants.map((g) => g.id)

    // 获取相关税务事件
    const taxEvents = await prisma.taxEvent.findMany({
      where: {
        grantId: {
          in: grantIds,
        },
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

    return NextResponse.json(taxEvents)
  } catch (error) {
    console.error('Failed to fetch tax events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax events' },
      { status: 500 }
    )
  }
}
