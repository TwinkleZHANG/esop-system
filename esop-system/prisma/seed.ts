import { PrismaClient, PlanType, Jurisdiction, PlanStatus, LegalIdentity, EmployeeStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充示例数据...')

  // 创建示例激励计划
  const plan1 = await prisma.plan.create({
    data: {
      title: '2024年 RSU 激励计划',
      type: PlanType.RSU,
      applicableJurisdiction: Jurisdiction.HK,
      poolSize: 1000000,
      effectiveDate: new Date('2024-01-01'),
      boardApprovalId: 'BR-2024-001',
      status: PlanStatus.ACTIVE,
    },
  })
  console.log('✅ 创建计划:', plan1.title)

  const plan2 = await prisma.plan.create({
    data: {
      title: '2024年 Option 激励计划',
      type: PlanType.OPTION,
      applicableJurisdiction: Jurisdiction.CN,
      poolSize: 500000,
      effectiveDate: new Date('2024-01-01'),
      boardApprovalId: 'BR-2024-002',
      status: PlanStatus.ACTIVE,
    },
  })
  console.log('✅ 创建计划:', plan2.title)

  // 创建示例员工
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        employeeId: 'EMP001',
        name: '张三',
        legalIdentity: LegalIdentity.CN_RESIDENT,
        taxJurisdiction: Jurisdiction.CN,
        employmentEntity: '北京科技有限公司',
        status: EmployeeStatus.ACTIVE,
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: 'EMP002',
        name: '李四',
        legalIdentity: LegalIdentity.HK_RESIDENT,
        taxJurisdiction: Jurisdiction.HK,
        employmentEntity: 'Hong Kong Tech Ltd',
        status: EmployeeStatus.ACTIVE,
      },
    }),
    prisma.employee.create({
      data: {
        employeeId: 'EMP003',
        name: '王五',
        legalIdentity: LegalIdentity.CN_RESIDENT,
        taxJurisdiction: Jurisdiction.CN,
        employmentEntity: '北京科技有限公司',
        status: EmployeeStatus.ACTIVE,
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
      jurisdiction: Jurisdiction.CN,
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
  })