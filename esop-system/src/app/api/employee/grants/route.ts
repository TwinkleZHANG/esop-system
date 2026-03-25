import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

/**
 * GET /api/employee/grants?employeeId=xxx
 * 获取员工的授予记录
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

    // 获取授予记录
    const grants = await prisma.grant.findMany({
      where: { employeeId: employee.id },
      include: {
        plan: {
          select: {
            title: true,
            type: true,
          },
        },
        vestingEvents: {
          orderBy: { vestDate: 'asc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(grants)
  } catch (error) {
    console.error('Failed to fetch grants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grants' },
      { status: 500 }
    )
  }
}
