import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const taxEvent = await prisma.taxEvent.findUnique({
      where: { id },
      include: {
        grant: {
          include: {
            employee: true,
            plan: true,
          },
        },
      },
    })
    if (!taxEvent) {
      return NextResponse.json({ error: 'Tax event not found' }, { status: 404 })
    }
    return NextResponse.json(taxEvent)
  } catch (error) {
    console.error('Failed to fetch tax event:', error)
    return NextResponse.json({ error: 'Failed to fetch tax event' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const taxEvent = await prisma.taxEvent.update({
      where: { id },
      data: {
        taxableAmount: body.taxableAmount,
        taxAmount: body.taxAmount,
        status: body.status,
        exportFileUrl: body.exportFileUrl,
        importFileUrl: body.importFileUrl,
      },
      include: {
        grant: {
          include: {
            employee: true,
            plan: true,
          },
        },
      },
    })
    return NextResponse.json(taxEvent)
  } catch (error) {
    console.error('Failed to update tax event:', error)
    return NextResponse.json({ error: 'Failed to update tax event' }, { status: 500 })
  }
}
