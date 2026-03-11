/**
 * 税务计算服务
 * 
 * 支持不同法域的税务计算规则：
 * - 中国内地：根据个税法计算
 * - 香港：根据薪俸税计算
 * - 海外：根据当地税法计算
 */

export type TaxJurisdiction = 'CN' | 'HK' | 'OVERSEAS'

export interface TaxCalculation {
  taxableAmount: number      // 应税金额
  taxAmount: number          // 应缴税额
  taxRate: number            // 有效税率
  breakdown: TaxBreakdown[]  // 税率分段明细
}

export interface TaxBreakdown {
  bracket: string            // 税率档位描述
  amount: number             // 该档位金额
  rate: number               // 该档位税率
  tax: number                // 该档位税额
}

/**
 * 计算中国内地个人所得税
 * 适用：工资薪金、股权激励收入
 */
export function calculateCNTax(
  taxableIncome: number,
  monthsWorked: number = 12
): TaxCalculation {
  // 中国个税税率表（综合所得）
  const brackets = [
    { min: 0, max: 36000, rate: 0.03 },
    { min: 36000, max: 144000, rate: 0.10 },
    { min: 144000, max: 300000, rate: 0.20 },
    { min: 300000, max: 420000, rate: 0.25 },
    { min: 420000, max: 660000, rate: 0.30 },
    { min: 660000, max: 960000, rate: 0.35 },
    { min: 960000, max: Infinity, rate: 0.45 },
  ]
  
  // 股权激励单独计税，不并入综合所得
  // 使用年终奖计税方式（除以12找税率）
  const monthlyAvg = taxableIncome / 12
  let applicableRate = 0.03
  let quickDeduction = 0
  
  if (monthlyAvg <= 3000) {
    applicableRate = 0.03
    quickDeduction = 0
  } else if (monthlyAvg <= 12000) {
    applicableRate = 0.10
    quickDeduction = 210
  } else if (monthlyAvg <= 25000) {
    applicableRate = 0.20
    quickDeduction = 1410
  } else if (monthlyAvg <= 35000) {
    applicableRate = 0.25
    quickDeduction = 2660
  } else if (monthlyAvg <= 55000) {
    applicableRate = 0.30
    quickDeduction = 4410
  } else if (monthlyAvg <= 80000) {
    applicableRate = 0.35
    quickDeduction = 7160
  } else {
    applicableRate = 0.45
    quickDeduction = 15160
  }
  
  const taxAmount = taxableIncome * applicableRate - quickDeduction
  const effectiveRate = taxAmount / taxableIncome
  
  return {
    taxableAmount: taxableIncome,
    taxAmount: Math.max(0, Math.round(taxAmount * 100) / 100),
    taxRate: Math.round(effectiveRate * 10000) / 10000,
    breakdown: [
      {
        bracket: `股权激励收入 × ${applicableRate * 100}% - 速算扣除数`,
        amount: taxableIncome,
        rate: applicableRate,
        tax: taxAmount,
      },
      {
        bracket: '速算扣除数',
        amount: quickDeduction,
        rate: 0,
        tax: -quickDeduction,
      },
    ],
  }
}

/**
 * 计算香港薪俸税
 * 适用：香港税务居民
 */
export function calculateHKTax(
  taxableIncome: number,
  taxYear: 'current' | 'previous' = 'current'
): TaxCalculation {
  // 香港薪俸税率（累进税率）
  // 2024/25 年度
  const brackets = [
    { min: 0, max: 50000, rate: 0.02 },
    { min: 50000, max: 100000, rate: 0.06 },
    { min: 100000, max: 150000, rate: 0.10 },
    { min: 150000, max: 200000, rate: 0.14 },
    { min: 200000, max: Infinity, rate: 0.17 },
  ]
  
  // 基本免税额
  const basicAllowance = 132000
  
  // 应课税入息
  const netIncome = Math.max(0, taxableIncome - basicAllowance)
  
  // 计算累进税
  let totalTax = 0
  let remainingIncome = netIncome
  const breakdown: TaxBreakdown[] = []
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break
    
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min)
    const taxInBracket = taxableInBracket * bracket.rate
    totalTax += taxInBracket
    remainingIncome -= taxableInBracket
    
    if (taxableInBracket > 0) {
      breakdown.push({
        bracket: `港币 ${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? '以上' : bracket.max.toLocaleString()}`,
        amount: taxableInBracket,
        rate: bracket.rate,
        tax: taxInBracket,
      })
    }
  }
  
  // 标准税率方案（总入息的15%）
  const standardTax = taxableIncome * 0.15
  const finalTax = Math.min(totalTax, standardTax)
  
  return {
    taxableAmount: taxableIncome,
    taxAmount: Math.round(finalTax * 100) / 100,
    taxRate: Math.round((finalTax / taxableIncome) * 10000) / 10000,
    breakdown,
  }
}

/**
 * 计算税务（通用接口）
 */
export function calculateTax(
  taxableIncome: number,
  jurisdiction: TaxJurisdiction,
  options?: {
    monthsWorked?: number
    taxYear?: 'current' | 'previous'
  }
): TaxCalculation {
  switch (jurisdiction) {
    case 'CN':
      return calculateCNTax(taxableIncome, options?.monthsWorked || 12)
    case 'HK':
      return calculateHKTax(taxableIncome, options?.taxYear || 'current')
    case 'OVERSEAS':
      // 海外需要具体国家/地区，这里返回占位
      return {
        taxableAmount: taxableIncome,
        taxAmount: 0,
        taxRate: 0,
        breakdown: [{
          bracket: '海外税务',
          amount: taxableIncome,
          rate: 0,
          tax: 0,
        }],
      }
    default:
      throw new Error(`Unknown jurisdiction: ${jurisdiction}`)
  }
}

/**
 * 计算归属事件应税金额
 * RSU: 应税金额 = 归属数量 × 归属日公允价值
 * Option: 应税金额 = 归属数量 × (公允价值 - 行权价)
 */
export function calculateTaxableAmount(
  quantity: number,
  fmv: number,           // 公允价值
  strikePrice: number = 0, // 行权价（RSU 为 0）
  type: 'RSU' | 'OPTION'
): number {
  if (type === 'RSU') {
    return quantity * fmv
  } else {
    return quantity * Math.max(0, fmv - strikePrice)
  }
}