/**
 * 归属计算服务
 *
 * 支持动态归属计划配置：
 * - vestingYear: 归属年限（1-5年）
 * - cliffPeriod: 悬崖期月数（0/6/12/18/24）
 * - vestingFrequency: 归属频率（MONTHLY / YEARLY）
 */

export interface VestingEvent {
  date: Date
  quantity: number
  cumulativeQuantity: number
  isCliff: boolean
}

export interface VestingSchedule {
  type: string
  totalQuantity: number
  vestingStartDate: Date
  events: VestingEvent[]
}

/**
 * 计算归属计划
 *
 * @param totalQuantity 总授予数量
 * @param vestingStartDate 归属开始日期
 * @param vestingYear 归属年限（年）
 * @param cliffPeriod 悬崖期月数（0/6/12/18/24）
 * @param vestingFrequency 归属频率（MONTHLY / YEARLY）
 */
export function calculateVestingSchedule(
  totalQuantity: number,
  vestingStartDate: Date,
  vestingYear: number,
  cliffPeriod: number,
  vestingFrequency: string
): VestingSchedule {
  const events: VestingEvent[] = []
  const totalMonths = vestingYear * 12

  if (cliffPeriod > 0) {
    // 有悬崖期的情况
    // cliff 部分数量 = 总数量 * cliff月数 / 总月数
    const cliffQuantity = Math.floor(totalQuantity * cliffPeriod / totalMonths)
    const remainingQuantity = totalQuantity - cliffQuantity
    const remainingMonths = totalMonths - cliffPeriod

    // cliff 事件
    const cliffDate = addMonths(vestingStartDate, cliffPeriod)
    events.push({
      date: cliffDate,
      quantity: cliffQuantity,
      cumulativeQuantity: cliffQuantity,
      isCliff: true,
    })

    // 剩余部分按频率分配
    if (vestingFrequency === 'MONTHLY') {
      // 按月分配
      const monthlyQuantity = Math.floor(remainingQuantity / remainingMonths)
      const remainder = remainingQuantity - monthlyQuantity * remainingMonths

      let cumulative = cliffQuantity
      for (let month = 1; month <= remainingMonths; month++) {
        const vestDate = addMonths(cliffDate, month)
        const qty = month === remainingMonths ? monthlyQuantity + remainder : monthlyQuantity
        cumulative += qty
        events.push({
          date: vestDate,
          quantity: qty,
          cumulativeQuantity: cumulative,
          isCliff: false,
        })
      }
    } else if (vestingFrequency === 'YEARLY') {
      // 按年分配
      const remainingYears = Math.floor(remainingMonths / 12)
      const yearlyQuantity = Math.floor(remainingQuantity / remainingYears)
      const remainder = remainingQuantity - yearlyQuantity * remainingYears

      let cumulative = cliffQuantity
      for (let year = 1; year <= remainingYears; year++) {
        const vestDate = addMonths(cliffDate, year * 12)
        const qty = year === remainingYears ? yearlyQuantity + remainder : yearlyQuantity
        cumulative += qty
        events.push({
          date: vestDate,
          quantity: qty,
          cumulativeQuantity: cumulative,
          isCliff: false,
        })
      }
    }
  } else {
    // 无悬崖期的情况
    if (vestingFrequency === 'MONTHLY') {
      // 按月分配
      const monthlyQuantity = Math.floor(totalQuantity / totalMonths)
      const remainder = totalQuantity - monthlyQuantity * totalMonths

      let cumulative = 0
      for (let month = 1; month <= totalMonths; month++) {
        const vestDate = addMonths(vestingStartDate, month)
        const qty = month === totalMonths ? monthlyQuantity + remainder : monthlyQuantity
        cumulative += qty
        events.push({
          date: vestDate,
          quantity: qty,
          cumulativeQuantity: cumulative,
          isCliff: false,
        })
      }
    } else if (vestingFrequency === 'YEARLY') {
      // 按年分配
      const yearlyQuantity = Math.floor(totalQuantity / vestingYear)
      const remainder = totalQuantity - yearlyQuantity * vestingYear

      let cumulative = 0
      for (let year = 1; year <= vestingYear; year++) {
        const vestDate = addMonths(vestingStartDate, year * 12)
        const qty = year === vestingYear ? yearlyQuantity + remainder : yearlyQuantity
        cumulative += qty
        events.push({
          date: vestDate,
          quantity: qty,
          cumulativeQuantity: cumulative,
          isCliff: false,
        })
      }
    }
  }

  return {
    type: `${vestingYear}年${cliffPeriod > 0 ? `+${cliffPeriod}月悬崖` : '无悬崖'}-${vestingFrequency === 'MONTHLY' ? '按月' : '按年'}`,
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
function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}
