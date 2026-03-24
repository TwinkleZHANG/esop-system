import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const grant = await prisma.grant.findUnique({
      where: { id },
      include: {
        plan: true,
        employee: true,
        vestingEvents: {
          orderBy: { vestDate: 'asc' },
        },
        taxEvents: {
          orderBy: { triggerDate: 'asc' },
        },
      },
    })
    if (!grant) {
      return NextResponse.json({ error: 'Grant not found' }, { status: 404 })
    }
    return NextResponse.json(grant)
  } catch (error) {
    console.error('Failed to fetch grant:', error)
    return NextResponse.json({ error: 'Failed to fetch grant' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const grant = await prisma.grant.update({
      where: { id },
      data: {
        quantity: body.quantity,
        strikePrice: body.strikePrice,
        grantDate: body.grantDate ? new Date(body.grantDate) : undefined,
        vestingStartDate: body.vestingStartDate ? new Date(body.vestingStartDate) : undefined,
        vestingEndDate: body.vestingEndDate ? new Date(body.vestingEndDate) : null,
        status: body.status,
      },
      include: {
        plan: true,
        employee: true,
      },
    })
    return NextResponse.json(grant)
  } catch (error) {
    console.error('Failed to update grant:', error)
    return NextResponse.json({ error: 'Failed to update grant' }, { status: 500 })
  }
}
