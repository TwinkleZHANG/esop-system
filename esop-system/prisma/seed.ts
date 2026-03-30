import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 开始填充示例数据...')

  // 清理现有数据
  await prisma.assetTransaction.deleteMany()
  await prisma.assetPosition.deleteMany()
  await prisma.vestingEvent.deleteMany()
  await prisma.taxEvent.deleteMany()
  await prisma.grant.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.valuation.deleteMany()
  await prisma.holdingEntity.deleteMany()
  await prisma.employmentEntity.deleteMany()

  // 创建示例激励计划
  const plan1 = await prisma.plan.create({
    data: {
      title: '2024年 RSU 激励计划',
      type: 'RSU',
      applicableJurisdiction: 'HK',
      settlementMethod: ['LP份额'],
      poolSize: 1000000,
      effectiveDate: new Date('2024-01-01'),
      boardApprovalId: 'BR-2024-001',
      status: 'APPROVED',
    },
  })
  console.log('✅ 创建计划:', plan1.title)

  const plan2 = await prisma.plan.create({
    data: {
      title: '2024年 Option 激励计划',
      type: 'OPTION',
      applicableJurisdiction: 'CN',
      settlementMethod: ['实股'],
      poolSize: 500000,
      effectiveDate: new Date('2024-01-01'),
      boardApprovalId: 'BR-2024-002',
      status: 'APPROVED',
    },
  })
  console.log('✅ 创建计划:', plan2.title)

  // 创建示例用工主体
  const entities = await Promise.all([
    prisma.employmentEntity.create({
      data: {
        name: '北京科技有限公司',
        description: '总部',
        isActive: true,
      },
    }),
    prisma.employmentEntity.create({
      data: {
        name: 'Hong Kong Tech Ltd',
        description: '香港子公司',
        isActive: true,
      },
    }),
    prisma.employmentEntity.create({
      data: {
        name: '上海分公司',
        description: '上海分支机构',
        isActive: true,
      },
    }),
  ])
  console.log('✅ 创建用工主体:', entities.length, '个')

  // 创建示例员工
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        employeeId: 'EMP001',
        name: '张三',
        department: '技术部',
        legalIdentity: 'CN_RESIDENT',
        employmentEntity: ['北京科技有限公司'],
        taxJurisdiction: 'CN',
        bankAccountType: 'DOMESTIC',
        employmentStatus: 'ACTIVE',
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: 'EMP002',
        name: '李四',
        department: '财务部',
        legalIdentity: 'HK_RESIDENT',
        employmentEntity: ['Hong Kong Tech Ltd'],
        taxJurisdiction: 'HK',
        bankAccountType: 'OVERSEAS',
        employmentStatus: 'ACTIVE',
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: 'EMP003',
        name: '王五',
        department: '法务部',
        legalIdentity: 'CN_RESIDENT',
        employmentEntity: ['北京科技有限公司', '上海分公司'],
        taxJurisdiction: 'CN',
        bankAccountType: 'DOMESTIC',
        employmentStatus: 'ACTIVE',
      },
    }),
  ])
  console.log('✅ 创建员工:', employees.length, '人')

  // 创建示例估值
  const valuation = await prisma.valuation.create({
    data: {
      date: new Date('2024-01-01'),
      fmv: 10.50,
      source: '第三方估值机构',
      description: '2024年度公允价值评估',
    },
  })
  console.log('✅ 创建估值:', valuation.fmv.toString())

  // 创建示例持股实体
  const holdingEntity = await prisma.holdingEntity.create({
    data: {
      heId: 'HE-2024-001',
      name: '员工持股平台合伙企业（有限合伙）',
      type: 'LP份额',
      jurisdiction: 'CN',
      economicRights: ['分红', '转让收益'],
      description: '用于员工股权激励的持股平台',
    },
  })
  console.log('✅ 创建持股实体:', holdingEntity.name)

  // 创建示例授予记录 - 展示不同状态
  // Grant 1: DRAFT - 草稿状态
  const grant1 = await prisma.grant.create({
    data: {
      planId: plan1.id,
      employeeId: employees[0].id,
      quantity: 10000,
      grantDate: new Date('2024-06-01'),
      vestingStartDate: new Date('2024-06-01'),
      type: 'RSU',
      status: 'DRAFT',
    },
  })
  console.log('✅ 创建授予 (DRAFT):', grant1.id.slice(-6))

  // Grant 2: VESTING - 归属中
  const grant2 = await prisma.grant.create({
    data: {
      planId: plan1.id,
      employeeId: employees[1].id,
      quantity: 20000,
      grantDate: new Date('2024-01-01'),
      vestingStartDate: new Date('2024-01-01'),
      type: 'RSU',
      status: 'VESTING',
    },
  })
  // 为 VESTING 状态创建归属事件
  await prisma.vestingEvent.create({
    data: {
      grantId: grant2.id,
      vestDate: new Date('2025-01-01'),
      quantity: 5000,
      cumulativeQty: 5000,
      status: 'VESTED',
    },
  })
  await prisma.vestingEvent.create({
    data: {
      grantId: grant2.id,
      vestDate: new Date('2026-01-01'),
      quantity: 5000,
      cumulativeQty: 10000,
      status: 'PENDING',
    },
  })
  console.log('✅ 创建授予 (VESTING):', grant2.id.slice(-6))

  // Grant 3: VESTED - 已归属（等待交割）
  const grant3 = await prisma.grant.create({
    data: {
      planId: plan2.id,
      employeeId: employees[2].id,
      quantity: 15000,
      strikePrice: 5.00,
      grantDate: new Date('2023-01-01'),
      vestingStartDate: new Date('2023-01-01'),
      type: 'OPTION',
      status: 'VESTED',
    },
  })
  await prisma.vestingEvent.create({
    data: {
      grantId: grant3.id,
      vestDate: new Date('2024-01-01'),
      quantity: 15000,
      cumulativeQty: 15000,
      status: 'VESTED',
    },
  })
  // 已归属触发税务事件
  await prisma.taxEvent.create({
    data: {
      grantId: grant3.id,
      eventType: 'EXERCISE_TAX',
      triggerDate: new Date('2024-06-01'),
      quantity: 15000,
      taxableAmount: 82500, // 15000 * (10.5 - 5.0)
      taxAmount: 20625,
      status: 'TRIGGERED',
    },
  })
  console.log('✅ 创建授予 (VESTED):', grant3.id.slice(-6))

  // Grant 4: SETTLED - 已交割
  const grant4 = await prisma.grant.create({
    data: {
      planId: plan1.id,
      employeeId: employees[0].id,
      quantity: 8000,
      grantDate: new Date('2022-01-01'),
      vestingStartDate: new Date('2022-01-01'),
      type: 'RSU',
      status: 'SETTLED',
    },
  })
  await prisma.vestingEvent.create({
    data: {
      grantId: grant4.id,
      vestDate: new Date('2023-01-01'),
      quantity: 8000,
      cumulativeQty: 8000,
      status: 'VESTED',
    },
  })
  await prisma.taxEvent.create({
    data: {
      grantId: grant4.id,
      eventType: 'VESTING_TAX',
      triggerDate: new Date('2023-01-01'),
      quantity: 8000,
      taxableAmount: 84000,
      taxAmount: 16800,
      status: 'TAX_PAID',
    },
  })
  console.log('✅ 创建授予 (SETTLED):', grant4.id.slice(-6))

  // 资产持仓示例数据
  const assetPosition1 = await prisma.assetPosition.create({
    data: {
      accountId: 'ACC-001',
      employeeId: employees[0].id,  // 张三
      holdingEntityId: holdingEntity.id,
      assetType: 'COMMON_SHARE',
      quantity: 8000,  // 持有8000股
      currency: 'CNY',
      status: 'ACTIVE',
    }
  })
  await prisma.assetTransaction.create({
    data: {
      trxId: 'TRX-20230101-001',
      positionId: assetPosition1.id,
      changeType: 'SETTLEMENT',
      quantity: 8000,      // +8000股
      costBasis: 10.5,     // 交割时FMV
      balanceAfter: 8000,
      tradeDate: new Date('2023-01-01'),
      relatedGrantId: grant4.id,
    }
  })
  console.log('✅ 创建资产账户 ACC-001 (张三, 8000股)')

  const assetPosition2 = await prisma.assetPosition.create({
    data: {
      accountId: 'ACC-002',
      employeeId: employees[2].id,  // 王五
      holdingEntityId: holdingEntity.id,
      assetType: 'COMMON_SHARE',
      quantity: 15000,  // 持有15000股
      currency: 'CNY',
      status: 'ACTIVE',
    }
  })
  await prisma.assetTransaction.create({
    data: {
      trxId: 'TRX-20240101-001',
      positionId: assetPosition2.id,
      changeType: 'SETTLEMENT',
      quantity: 15000,     // +15000股
      costBasis: 5.0,      // 行权价
      balanceAfter: 15000,
      tradeDate: new Date('2024-01-01'),
      relatedGrantId: grant3.id,
    }
  })
  console.log('✅ 创建资产账户 ACC-002 (王五, 15000股)')

  console.log('🎉 示例数据填充完成！')
  console.log('📊 授予状态分布: DRAFT=1, VESTING=1, VESTED=1, SETTLED=1')
}

main()
  .catch((e) => {
    console.error('❌ 填充失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })