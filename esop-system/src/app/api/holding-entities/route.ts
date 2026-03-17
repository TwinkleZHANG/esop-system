import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  try {
    const entities = await prisma.holdingEntity.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(entities)
  } catch (error) {
    console.error('Failed to fetch holding entities:', error)
    return NextResponse.json({ error: 'Failed to fetch holding entities' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const entity = await prisma.holdingEntity.create({
      data: {
        heId: body.heId,
        name: body.name,
        lpAccountId: body.lpAccountId,
        lpUnits: body.lpUnits ? parseFloat(body.lpUnits) : null,
        economicRights: body.economicRights || [],
        type: body.type,
        jurisdiction: body.jurisdiction,
        description: body.description,
      },
    })
    return NextResponse.json(entity)
  } catch (error) {
    console.error('Failed to create holding entity:', error)
    return NextResponse.json({ error: 'Failed to create holding entity' }, { status: 500 })
  }
}