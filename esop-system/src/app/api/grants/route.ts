import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

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
      planId,
      employeeId,
      quantity,
      strikePrice,
      grantDate,
      vestingStartDate,
      vestingEndDate,
      type,
    } = body

    if (!planId || !employeeId || !quantity || !grantDate || !vestingStartDate) {
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

    const grant = await prisma.grant.create({
      data: {
        planId,
        employeeId,
        quantity,
        strikePrice: strikePrice || undefined,
        grantDate: new Date(grantDate),
        vestingStartDate: new Date(vestingStartDate),
        vestingEndDate: vestingEndDate ? new Date(vestingEndDate) : undefined,
        type: type || plan.type,
      },
    })

    return NextResponse.json(grant, { status: 201 })
  } catch (error) {
    console.error('Failed to create grant:', error)
    return NextResponse.json({ error: 'Failed to create grant' }, { status: 500 })
  }
}