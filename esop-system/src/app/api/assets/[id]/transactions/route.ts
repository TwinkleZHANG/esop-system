import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { AssetTxType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { changeType, quantity, costBasis, tradeDate } = body

    // Validate required fields
    if (!changeType || quantity === undefined || !tradeDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate changeType
    if (!Object.values(AssetTxType).includes(changeType)) {
      return NextResponse.json(
        { error: 'Invalid change type' },
        { status: 400 }
      )
    }

    // Get current position with transactions to calculate balance
    const position = await prisma.assetPosition.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    })

    if (!position) {
      return NextResponse.json(
        { error: 'Asset position not found' },
        { status: 404 }
      )
    }

    // Calculate current balance
    const currentBalance = position.transactions.reduce(
      (sum, t) => sum + Number(t.quantity),
      0
    )

    // Calculate balance after this transaction
    const balanceAfter = currentBalance + Number(quantity)

    // Generate trxId: TRX-{YYYYMMDD}-{3位序号}
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

    // Get count of transactions today for this position
    const todayStart = new Date(today.toDateString())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const todayCount = await prisma.assetTransaction.count({
      where: {
        positionId: id,
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    })

    const seqNum = String(todayCount + 1).padStart(3, '0')
    const trxId = `TRX-${dateStr}-${seqNum}`

    // Create transaction
    const transaction = await prisma.assetTransaction.create({
      data: {
        trxId,
        positionId: id,
        changeType,
        quantity: String(quantity),
        costBasis: costBasis ? String(costBasis) : null,
        balanceAfter: String(balanceAfter),
        tradeDate: new Date(tradeDate),
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
