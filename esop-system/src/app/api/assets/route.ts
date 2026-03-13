import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  try {
    const assets = await prisma.assetPosition.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        employee: true,
        holdingEntity: true,
      },
    })
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}