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

  // 创建示例激励计划
  const plan1 = await prisma.plan.create({
    data: {
      title: '2024年 RSU 激励计划',
      type: 'RSU',
      applicableJurisdiction: 'HK',
      poolSize: 1000000,
      effectiveDate: new Date('2024-01-01'),
      boardApprovalId: 'BR-2024-001',
      status: 'ACTIVE',
    },
  })
  console.log('✅ 创建计划:', plan1.title)

  const plan2 = await prisma.plan.create({
    data: {
      title: '2024年 Option 激励计划',
      type: 'OPTION',
      applicableJurisdiction: 'CN',
      poolSize: 500000,
      effectiveDate: new Date('2024-01-01'),
      boardApprovalId: 'BR-2024-002',
      status: 'ACTIVE',
    },
  })
  console.log('✅ 创建计划:', plan2.title)

  // 创建示例员工
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        employeeId: 'EMP001',
        name: '张三',
        legalIdentity: 'CN_RESIDENT',
        taxJurisdiction: 'CN',
        employmentEntity: '北京科技有限公司',
        status: 'ACTIVE',
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: 'EMP002',
        name: '李四',
        legalIdentity: 'HK_RESIDENT',
        taxJurisdiction: 'HK',
        employmentEntity: 'Hong Kong Tech Ltd',
        status: 'ACTIVE',
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: 'EMP003',
        name: '王五',
        legalIdentity: 'CN_RESIDENT',
        taxJurisdiction: 'CN',
        employmentEntity: '北京科技有限公司',
        status: 'ACTIVE',
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
      name: '员工持股平台合伙企业（有限合伙）',
      type: 'LP份额',
      jurisdiction: 'CN',
      description: '用于员工股权激励的持股平台',
    },
  })
  console.log('✅ 创建持股实体:', holdingEntity.name)

  console.log('🎉 示例数据填充完成！')
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