import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  try {
    const [positions, latestValuation] = await Promise.all([
      prisma.assetPosition.findMany({
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
          transactions: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.valuation.findFirst({
        orderBy: { date: 'desc' },
      }),
    ])

    const fmv = latestValuation ? Number(latestValuation.fmv) : 0
    const valuationDate = latestValuation
      ? latestValuation.date.toISOString().split('T')[0]
      : null

    const assetsWithCalculatedFields = positions.map((p) => {
      const quantity = Number(p.quantity)
      const currentValue = quantity * fmv

      // 计算平均成本（仅正数流水加权平均）
      const positiveTx = p.transactions.filter((t) => Number(t.quantity) > 0)
      const avgCost =
        positiveTx.length > 0
          ? positiveTx.reduce(
              (sum, t) => sum + Number(t.quantity) * Number(t.costBasis || 0),
              0
            ) /
            positiveTx.reduce((sum, t) => sum + Number(t.quantity), 0)
          : 0

      return {
        ...p,
        currentValue,
        latestFmv: fmv,
        valuationDate,
        avgCost,
      }
    })

    return NextResponse.json(assetsWithCalculatedFields)
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}
