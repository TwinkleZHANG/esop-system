import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [position, latestValuation] = await Promise.all([
      prisma.assetPosition.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              name: true,
              employeeId: true,
            },
          },
          holdingEntity: {
            select: {
              name: true,
            },
          },
          transactions: {
            orderBy: { tradeDate: 'desc' },
          },
        },
      }),
      prisma.valuation.findFirst({
        orderBy: { date: 'desc' },
      }),
    ])

    if (!position) {
      return NextResponse.json(
        { error: 'Asset position not found' },
        { status: 404 }
      )
    }

    const fmv = latestValuation ? Number(latestValuation.fmv) : 0
    const valuationDate = latestValuation
      ? latestValuation.date.toISOString().split('T')[0]
      : null

    const quantity = Number(position.quantity)
    const currentValue = quantity * fmv

    // 计算平均成本（仅正数流水加权平均）
    const positiveTx = position.transactions.filter(
      (t) => Number(t.quantity) > 0
    )
    const avgCost =
      positiveTx.length > 0
        ? positiveTx.reduce(
            (sum, t) => sum + Number(t.quantity) * Number(t.costBasis || 0),
            0
          ) /
          positiveTx.reduce((sum, t) => sum + Number(t.quantity), 0)
        : 0

    return NextResponse.json({
      ...position,
      currentValue,
      latestFmv: fmv,
      valuationDate,
      avgCost,
    })
  } catch (error) {
    console.error('Failed to fetch asset position:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset position' },
      { status: 500 }
    )
  }
}
