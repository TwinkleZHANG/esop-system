/**
 * 归属计算服务
 * 
 * 支持的归属计划类型：
 * - 4_YEAR_1_YEAR_CLIFF: 4年归属 + 1年悬崖（满1年25%，之后每月1/36）
 * - 4_YEAR_MONTHLY: 4年月归属（无悬崖，每月1/48）
 * - 3_YEAR_1_YEAR_CLIFF: 3年归属 + 1年悬崖
 * - IMMEDIATE: 一次性归属
 */

export type VestingScheduleType = 
  | '4_YEAR_1_YEAR_CLIFF'
  | '4_YEAR_MONTHLY'
  | '3_YEAR_1_YEAR_CLIFF'
  | 'IMMEDIATE'

export interface VestingEvent {
  date: Date
  quantity: number
  cumulativeQuantity: number
  isCliff: boolean
}

export interface VestingSchedule {
  type: VestingScheduleType
  totalQuantity: number
  vestingStartDate: Date
  events: VestingEvent[]
}

/**
 * 计算归属计划
 */
export function calculateVestingSchedule(
  totalQuantity: number,
  vestingStartDate: Date,
  scheduleType: VestingScheduleType
): VestingSchedule {
  const events: VestingEvent[] = []
  
  switch (scheduleType) {
    case '4_YEAR_1_YEAR_CLIFF':
      // 1年悬崖：满1年归属25%，之后每月归属剩余的1/36
      const cliffQuantity = Math.floor(totalQuantity * 0.25)
      const monthlyQuantity = Math.floor((totalQuantity - cliffQuantity) / 36)
      const remainder = totalQuantity - cliffQuantity - monthlyQuantity * 36
      
      // 悬崖事件（1年后）
      const cliffDate = addYears(vestingStartDate, 1)
      events.push({
        date: cliffDate,
        quantity: cliffQuantity,
        cumulativeQuantity: cliffQuantity,
        isCliff: true,
      })
      
      // 之后每月归属
      let cumulative = cliffQuantity
      for (let month = 1; month <= 36; month++) {
        const vestDate = addMonths(cliffDate, month)
        const qty = month === 36 ? monthlyQuantity + remainder : monthlyQuantity
        cumulative += qty
        events.push({
          date: vestDate,
          quantity: qty,
          cumulativeQuantity: cumulative,
          isCliff: false,
        })
      }
      break
      
    case '4_YEAR_MONTHLY':
      // 无悬崖，每月归属 1/48
      const monthlyQty = Math.floor(totalQuantity / 48)
      const rem = totalQuantity - monthlyQty * 48
      
      let cum = 0
      for (let month = 1; month <= 48; month++) {
        const vestDate = addMonths(vestingStartDate, month)
        const qty = month === 48 ? monthlyQty + rem : monthlyQty
        cum += qty
        events.push({
          date: vestDate,
          quantity: qty,
          cumulativeQuantity: cum,
          isCliff: false,
        })
      }
      break
      
    case '3_YEAR_1_YEAR_CLIFF':
      // 3年归属 + 1年悬崖
      const cliffQty3 = Math.floor(totalQuantity * 0.33)
      const monthlyQty3 = Math.floor((totalQuantity - cliffQty3) / 24)
      const rem3 = totalQuantity - cliffQty3 - monthlyQty3 * 24
      
      const cliffDate3 = addYears(vestingStartDate, 1)
      events.push({
        date: cliffDate3,
        quantity: cliffQty3,
        cumulativeQuantity: cliffQty3,
        isCliff: true,
      })
      
      let cum3 = cliffQty3
      for (let month = 1; month <= 24; month++) {
        const vestDate = addMonths(cliffDate3, month)
        const qty = month === 24 ? monthlyQty3 + rem3 : monthlyQty3
        cum3 += qty
        events.push({
          date: vestDate,
          quantity: qty,
          cumulativeQuantity: cum3,
          isCliff: false,
        })
      }
      break
      
    case 'IMMEDIATE':
      // 一次性归属
      events.push({
        date: vestingStartDate,
        quantity: totalQuantity,
        cumulativeQuantity: totalQuantity,
        isCliff: true,
      })
      break
  }
  
  return {
    type: scheduleType,
    totalQuantity,
    vestingStartDate,
    events,
  }
}

/**
 * 获取当前已归属数量
 */
export function getVestedQuantity(schedule: VestingSchedule, asOfDate: Date = new Date()): number {
  let vested = 0
  for (const event of schedule.events) {
    if (event.date <= asOfDate) {
      vested = event.cumulativeQuantity
    } else {
      break
    }
  }
  return vested
}

/**
 * 获取下一个归属事件
 */
export function getNextVestingEvent(schedule: VestingSchedule, asOfDate: Date = new Date()): VestingEvent | null {
  for (const event of schedule.events) {
    if (event.date > asOfDate) {
      return event
    }
  }
  return null
}

/**
 * 获取剩余未归属数量
 */
export function getUnvestedQuantity(schedule: VestingSchedule, asOfDate: Date = new Date()): number {
  const vested = getVestedQuantity(schedule, asOfDate)
  return schedule.totalQuantity - vested
}

// 辅助函数
function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}