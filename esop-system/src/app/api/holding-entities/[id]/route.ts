import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const entity = await prisma.holdingEntity.update({
      where: { id },
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
    console.error('Failed to update holding entity:', error)
    return NextResponse.json({ error: 'Failed to update holding entity' }, { status: 500 })
  }
}