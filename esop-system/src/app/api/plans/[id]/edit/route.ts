import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // 只能编辑审批中的计划
    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    })
    
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    
    if (existingPlan.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: '只能编辑审批中的计划' }, { status: 400 })
    }
    
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type,
        applicableJurisdiction: body.applicableJurisdiction,
        settlementMethod: body.settlementMethod || [],
        poolSize: body.poolSize,
        effectiveDate: new Date(body.effectiveDate),
        boardApprovalId: body.boardApprovalId,
      },
    })
    return NextResponse.json(plan)
  } catch (error) {
    console.error('Failed to update plan:', error)
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}