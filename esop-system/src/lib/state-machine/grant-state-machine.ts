import { PlanType, GrantStatus } from '@prisma/client'

// 状态流转规则定义
export const stateTransitions: Record<PlanType, Record<GrantStatus, GrantStatus[]>> = {
  RSU: {
    DRAFT: ['GRANTED', 'CANCELLED'],
    GRANTED: ['VESTING', 'CANCELLED', 'FORFEITED'],
    VESTING: ['VESTED', 'CANCELLED', 'FORFEITED'],
    VESTED: ['SETTLED', 'CANCELLED', 'FORFEITED'],
    SETTLED: [],
    EXERCISED: [],
    CANCELLED: [],
    FORFEITED: [],
  },
  OPTION: {
    DRAFT: ['GRANTED', 'CANCELLED'],
    GRANTED: ['VESTING', 'CANCELLED', 'FORFEITED'],
    VESTING: ['VESTED', 'CANCELLED', 'FORFEITED'],
    VESTED: ['EXERCISED', 'CANCELLED', 'FORFEITED'],
    EXERCISED: ['SETTLED', 'CANCELLED'],
    SETTLED: [],
    CANCELLED: [],
    FORFEITED: [],
  },
  LP_SHARE: {
    DRAFT: ['GRANTED', 'CANCELLED'],
    GRANTED: ['VESTING', 'CANCELLED', 'FORFEITED'],
    VESTING: ['VESTED', 'CANCELLED', 'FORFEITED'],
    VESTED: ['CANCELLED', 'FORFEITED'],
    SETTLED: [],
    EXERCISED: [],
    CANCELLED: [],
    FORFEITED: [],
  },
  VIRTUAL_SHARE: {
    DRAFT: ['GRANTED', 'CANCELLED'],
    GRANTED: ['VESTING', 'CANCELLED', 'FORFEITED'],
    VESTING: ['VESTED', 'CANCELLED', 'FORFEITED'],
    VESTED: ['CANCELLED', 'FORFEITED'],
    SETTLED: [],
    EXERCISED: [],
    CANCELLED: [],
    FORFEITED: [],
  },
}

// 状态标签
export const statusLabels: Record<GrantStatus, string> = {
  DRAFT: '草稿',
  GRANTED: '已授予',
  VESTING: '归属中',
  VESTED: '已归属',
  EXERCISED: '已行权',
  SETTLED: '已交割',
  CANCELLED: '已取消',
  FORFEITED: '已失效',
}

// 状态颜色
export const statusColors: Record<GrantStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  GRANTED: 'bg-blue-100 text-blue-800',
  VESTING: 'bg-yellow-100 text-yellow-800',
  VESTED: 'bg-green-100 text-green-800',
  EXERCISED: 'bg-purple-100 text-purple-800',
  SETTLED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FORFEITED: 'bg-red-100 text-red-800',
}

// 验证状态变更是否合法
export function canTransition(
  planType: PlanType,
  currentStatus: GrantStatus,
  targetStatus: GrantStatus
): boolean {
  const allowedTransitions = stateTransitions[planType][currentStatus]
  return allowedTransitions.includes(targetStatus)
}

// 获取当前状态允许的目标状态
export function getAllowedTransitions(
  planType: PlanType,
  currentStatus: GrantStatus
): GrantStatus[] {
  return stateTransitions[planType][currentStatus]
}

// 获取状态描述
export function getStatusDescription(status: GrantStatus): string {
  const descriptions: Record<GrantStatus, string> = {
    DRAFT: '授予草稿状态，等待协议签署',
    GRANTED: '协议已签署，授予生效',
    VESTING: '归属进行中',
    VESTED: '已全部归属',
    EXERCISED: '已行权（仅期权）',
    SETTLED: '资产已交割',
    CANCELLED: '已取消',
    FORFEITED: '已失效（离职回购/过期作废）',
  }
  return descriptions[status]
}
