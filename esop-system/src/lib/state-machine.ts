/**
 * 授予状态机
 * 
 * 定义 RSU 和 Option 的状态流转规则
 */

import { GrantStatus, PlanType } from '@prisma/client'

export interface StateTransition {
  from: GrantStatus
  to: GrantStatus
  action: string
  allowedRoles: string[]
  requiresApproval?: boolean
  triggers?: {
    taxEvent?: boolean
    vestingStart?: boolean
  }
}

// RSU 状态流转
export const RSU_TRANSITIONS: StateTransition[] = [
  {
    from: 'GRANTED',
    to: 'VESTING',
    action: '开始归属',
    allowedRoles: ['HR', 'ADMIN'],
    triggers: { vestingStart: true },
  },
  {
    from: 'VESTING',
    to: 'VESTED',
    action: '归属完成',
    allowedRoles: ['SYSTEM'],
    triggers: { taxEvent: true },
  },
  {
    from: 'VESTED',
    to: 'SETTLED',
    action: '交割完成',
    allowedRoles: ['FINANCE', 'ADMIN'],
    triggers: { taxEvent: false },
  },
  {
    from: 'GRANTED',
    to: 'CANCELLED',
    action: '取消授予',
    allowedRoles: ['HR', 'ADMIN', 'LEGAL'],
    requiresApproval: true,
  },
  {
    from: 'VESTING',
    to: 'FORFEITED',
    action: '离职失效',
    allowedRoles: ['HR', 'ADMIN'],
  },
  {
    from: 'VESTED',
    to: 'FORFEITED',
    action: '未行权失效',
    allowedRoles: ['HR', 'ADMIN'],
  },
]

// Option 状态流转
export const OPTION_TRANSITIONS: StateTransition[] = [
  {
    from: 'GRANTED',
    to: 'VESTING',
    action: '开始归属',
    allowedRoles: ['HR', 'ADMIN'],
    triggers: { vestingStart: true },
  },
  {
    from: 'VESTING',
    to: 'VESTED',
    action: '归属完成',
    allowedRoles: ['SYSTEM'],
    triggers: { taxEvent: false }, // Option 行权时才触发税务
  },
  {
    from: 'VESTED',
    to: 'EXERCISED',
    action: '行权',
    allowedRoles: ['EMPLOYEE', 'HR'],
    triggers: { taxEvent: true }, // 行权触发税务
  },
  {
    from: 'EXERCISED',
    to: 'SETTLED',
    action: '交割完成',
    allowedRoles: ['FINANCE', 'ADMIN'],
  },
  {
    from: 'GRANTED',
    to: 'CANCELLED',
    action: '取消授予',
    allowedRoles: ['HR', 'ADMIN', 'LEGAL'],
    requiresApproval: true,
  },
  {
    from: 'VESTING',
    to: 'FORFEITED',
    action: '离职失效',
    allowedRoles: ['HR', 'ADMIN'],
  },
  {
    from: 'VESTED',
    to: 'FORFEITED',
    action: '过期失效',
    allowedRoles: ['SYSTEM', 'HR', 'ADMIN'],
  },
]

/**
 * 获取允许的状态转换
 */
export function getAllowedTransitions(
  currentStatus: GrantStatus,
  type: PlanType,
  userRole: string
): StateTransition[] {
  const transitions = type === 'OPTION' ? OPTION_TRANSITIONS : RSU_TRANSITIONS
  
  return transitions.filter(
    t => t.from === currentStatus && t.allowedRoles.includes(userRole)
  )
}

/**
 * 检查状态转换是否有效
 */
export function isValidTransition(
  from: GrantStatus,
  to: GrantStatus,
  type: PlanType,
  userRole: string
): boolean {
  const transitions = type === 'OPTION' ? OPTION_TRANSITIONS : RSU_TRANSITIONS
  
  return transitions.some(
    t => t.from === from && t.to === to && t.allowedRoles.includes(userRole)
  )
}

/**
 * 获取状态显示信息
 */
export const STATUS_INFO: Record<GrantStatus, { label: string; color: string; description: string }> = {
  GRANTED: {
    label: '已授予',
    color: 'blue',
    description: '授予已创建，等待归属开始',
  },
  VESTING: {
    label: '归属中',
    color: 'orange',
    description: '正在按计划归属',
  },
  VESTED: {
    label: '已归属',
    color: 'green',
    description: '已完全归属，等待行权/交割',
  },
  EXERCISED: {
    label: '已行权',
    color: 'purple',
    description: '期权已行权，等待交割',
  },
  SETTLED: {
    label: '已交割',
    color: 'gray',
    description: '股票/份额已交割给员工',
  },
  CANCELLED: {
    label: '已取消',
    color: 'red',
    description: '授予已取消',
  },
  FORFEITED: {
    label: '已失效',
    color: 'red',
    description: '授予已失效',
  },
}