import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const valuations = await prisma.valuation.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(valuations)
  } catch (error) {
    console.error('Failed to fetch valuations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch valuations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, fmv, source, description } = body

    const valuation = await prisma.valuation.create({
      data: {
        date: new Date(date),
        fmv: parseFloat(fmv),
        source,
        description,
      },
    })

    return NextResponse.json(valuation)
  } catch (error) {
    console.error('Failed to create valuation:', error)
    return NextResponse.json(
      { error: 'Failed to create valuation' },
      { status: 500 }
    )
  }
}
