import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const valuation = await prisma.valuation.findUnique({
      where: { id },
    })

    if (!valuation) {
      return NextResponse.json(
        { error: 'Valuation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(valuation)
  } catch (error) {
    console.error('Failed to fetch valuation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch valuation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { date, fmv, source, description } = body

    const valuation = await prisma.valuation.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        fmv: fmv !== undefined ? parseFloat(fmv) : undefined,
        source,
        description,
      },
    })

    return NextResponse.json(valuation)
  } catch (error) {
    console.error('Failed to update valuation:', error)
    return NextResponse.json(
      { error: 'Failed to update valuation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.valuation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete valuation:', error)
    return NextResponse.json(
      { error: 'Failed to delete valuation' },
      { status: 500 }
    )
  }
}
