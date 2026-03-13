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