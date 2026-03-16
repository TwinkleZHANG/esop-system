import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await prisma.plan.update({
      where: { id },
      data: { status: 'APPROVED' },
    })
    return NextResponse.json(plan)
  } catch (error) {
    console.error('Failed to approve plan:', error)
    return NextResponse.json({ error: 'Failed to approve plan' }, { status: 500 })
  }
}