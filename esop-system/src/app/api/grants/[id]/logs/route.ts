import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Grant',
        entityId: id,
        action: 'STATUS_CHANGE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedLogs = logs.map((log) => {
      const oldValue = log.oldValue as { status: string }
      const newValue = log.newValue as { status: string; document?: string }

      return {
        id: log.id,
        preStatus: oldValue?.status || '',
        postStatus: newValue?.status || '',
        timestamp: log.createdAt,
        operator: log.operatorId,
        operatorRole: log.operatorRole,
        document: newValue?.document,
      }
    })

    return NextResponse.json(formattedLogs)
  } catch (error) {
    console.error('Failed to fetch grant status logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grant status logs' },
      { status: 500 }
    )
  }
}
