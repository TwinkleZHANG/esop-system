import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { calculateVestingSchedule } from '@/lib/vesting'

export async function GET() {
  try {
    const grants = await prisma.grant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        plan: true, 
        employee: true,
      },
    })
    return NextResponse.json(grants)
  } catch (error) {
    console.error('Failed to fetch grants:', error)
    return NextResponse.json({ error: 'Failed to fetch grants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      grantId,
      planId,
      employeeId,
      quantity,
      strikePrice,
      grantDate,
      vestingStartDate,
      vestingYear,
      cliffPeriod,
      vestingFrequency,
      type,
      status,
    } = body

    if (!planId || !employeeId || !quantity || !grantDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate plan exists and get its type
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Validate strikePrice for OPTION type
    if (plan.type === 'OPTION' && (strikePrice === undefined || strikePrice === null)) {
      return NextResponse.json(
        { error: 'Strike price is required for OPTION grants' },
        { status: 400 }
      )
    }

    const vestingStart = new Date(vestingStartDate || grantDate)
    const parsedVestingYear = vestingYear ? parseInt(vestingYear) : null
    const vestingEndDate = parsedVestingYear
      ? new Date(new Date(vestingStart).setFullYear(vestingStart.getFullYear() + parsedVestingYear))
      : undefined

    const grant = await prisma.grant.create({
      data: {
        planId,
        employeeId,
        quantity,
        strikePrice: plan.type === 'OPTION' ? strikePrice : null,
        grantDate: new Date(grantDate),
        vestingStartDate: vestingStart,
        vestingEndDate,
        vestingYear: parsedVestingYear,
        cliffPeriod: cliffPeriod ? parseInt(cliffPeriod) : 0,
        vestingFrequency: vestingFrequency || null,
        type: type || plan.type,
        status: status || 'DRAFT',
      },
    })

    // 草稿阶段不生成归属事件，等状态变为"已授予"时再生成

    return NextResponse.json(grant, { status: 201 })
  } catch (error) {
    console.error('Failed to create grant:', error)
    return NextResponse.json({ error: 'Failed to create grant' }, { status: 500 })
  }
}