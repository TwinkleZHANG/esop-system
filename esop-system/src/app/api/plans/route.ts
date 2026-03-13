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