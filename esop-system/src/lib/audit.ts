/**
 * 审计日志服务
 * 
 * 记录所有关键操作，支持 IPO 尽调和审计导出
 */

import prisma from '@/lib/db/prisma'

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'

export interface AuditLogInput {
  entityType: 'Plan' | 'Employee' | 'Grant' | 'VestingEvent' | 'TaxEvent' | 'Asset'
  entityId: string
  action: AuditAction
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  operatorId?: string
  operatorRole?: string
  description?: string
}

/**
 * 记录审计日志
 */
export async function logAudit(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      oldValue: input.oldValue ? JSON.parse(JSON.stringify(input.oldValue)) : undefined,
      newValue: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : undefined,
      operatorId: input.operatorId,
      operatorRole: input.operatorRole,
    },
  })
}

/**
 * 查询审计日志
 */
export async function getAuditLogs(params: {
  entityType?: string
  entityId?: string
  operatorId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: {
    entityType?: string
    entityId?: string
    operatorId?: string
    action?: string
    createdAt?: { gte?: Date; lte?: Date }
  } = {}

  if (params.entityType) where.entityType = params.entityType
  if (params.entityId) where.entityId = params.entityId
  if (params.operatorId) where.operatorId = params.operatorId
  if (params.action) where.action = params.action
  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ])
  
  return { logs, total }
}

/**
 * 导出审计日志（用于 IPO 尽调）
 */
export async function exportAuditLogs(params: {
  startDate?: Date
  endDate?: Date
  entityTypes?: string[]
}) {
  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
      entityType: params.entityTypes ? { in: params.entityTypes } : undefined,
    },
    orderBy: { createdAt: 'asc' },
  })
  
  // 转换为 CSV 格式
  const headers = [
    'ID',
    '实体类型',
    '实体ID',
    '操作',
    '旧值',
    '新值',
    '操作人ID',
    '操作人角色',
    '时间',
  ]
  
  const rows = logs.map(log => [
    log.id,
    log.entityType,
    log.entityId,
    log.action,
    log.oldValue ? JSON.stringify(log.oldValue) : '',
    log.newValue ? JSON.stringify(log.newValue) : '',
    log.operatorId || '',
    log.operatorRole || '',
    log.createdAt.toISOString(),
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  
  return {
    csv,
    count: logs.length,
    exportedAt: new Date().toISOString(),
  }
}