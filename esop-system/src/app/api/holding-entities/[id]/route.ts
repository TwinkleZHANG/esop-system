import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entity = await prisma.holdingEntity.findUnique({
      where: { id },
    })
    if (!entity) {
      return NextResponse.json({ error: 'Holding entity not found' }, { status: 404 })
    }
    return NextResponse.json(entity)
  } catch (error) {
    console.error('Failed to fetch holding entity:', error)
    return NextResponse.json({ error: 'Failed to fetch holding entity' }, { status: 500 })
  }
}