import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Failed to fetch plans:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      type,
      applicableJurisdiction,
      settlementMethod,
      poolSize,
      effectiveDate,
      boardApprovalId,
    } = body

    if (!title || !type || !applicableJurisdiction || !settlementMethod || !poolSize || !effectiveDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const plan = await prisma.plan.create({
      data: {
        title,
        type,
        applicableJurisdiction,
        settlementMethod,
        poolSize,
        effectiveDate: new Date(effectiveDate),
        boardApprovalId: boardApprovalId || undefined,
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Failed to create plan:', error)
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}