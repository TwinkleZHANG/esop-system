import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: params.id },
    })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
    return NextResponse.json(plan)
  } catch (error) {
    console.error('Failed to fetch plan:', error)
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}