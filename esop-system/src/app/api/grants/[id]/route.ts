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

    // Auto-calculate vestingEndDate from vestingStartDate + vestingYear
    let vestingEndDate: Date | null | undefined = undefined
    if (body.vestingYear !== undefined) {
      const existing = await prisma.grant.findUnique({ where: { id }, select: { vestingStartDate: true, grantDate: true } })
      const startDate = body.vestingStartDate ? new Date(body.vestingStartDate) : existing?.vestingStartDate || existing?.grantDate
      if (startDate && body.vestingYear) {
        const endDate = new Date(startDate)
        endDate.setFullYear(endDate.getFullYear() + body.vestingYear)
        vestingEndDate = endDate
      } else {
        vestingEndDate = null
      }
    }

    const grant = await prisma.grant.update({
      where: { id },
      data: {
        quantity: body.quantity,
        strikePrice: body.strikePrice,
        grantDate: body.grantDate ? new Date(body.grantDate) : undefined,
        vestingStartDate: body.vestingStartDate ? new Date(body.vestingStartDate) : undefined,
        vestingEndDate,
        vestingYear: body.vestingYear !== undefined ? body.vestingYear : undefined,
        cliffPeriod: body.cliffPeriod !== undefined ? body.cliffPeriod : undefined,
        vestingFrequency: body.vestingFrequency !== undefined ? body.vestingFrequency : undefined,
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
