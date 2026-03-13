import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  try {
    const taxEvents = await prisma.taxEvent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        grant: {
          include: {
            employee: true,
          },
        },
      },
    })
    return NextResponse.json(taxEvents)
  } catch (error) {
    console.error('Failed to fetch tax events:', error)
    return NextResponse.json({ error: 'Failed to fetch tax events' }, { status: 500 })
  }
}