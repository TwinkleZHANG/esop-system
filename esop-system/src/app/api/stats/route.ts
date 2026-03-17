import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  try {
    const [
      planCount,
      activePlanCount,
      employeeCount,
      activeEmployeeCount,
      grantCount,
      pendingGrantCount,
      taxEventCount,
      pendingTaxEventCount,
    ] = await Promise.all([
      prisma.plan.count(),
      prisma.plan.count({ where: { status: 'APPROVED' } }),
      prisma.employee.count(),
      prisma.employee.count({ where: { employmentStatus: 'ACTIVE' } }),
      prisma.grant.count(),
      prisma.grant.count({ where: { status: 'GRANTED' } }),
      prisma.taxEvent.count(),
      prisma.taxEvent.count({ where: { status: 'TRIGGERED' } }),
    ])

    return NextResponse.json({
      plans: planCount,
      plansActive: activePlanCount,
      employees: employeeCount,
      employeesActive: activeEmployeeCount,
      grants: grantCount,
      grantsPending: pendingGrantCount,
      taxEvents: taxEventCount,
      taxEventsPending: pendingTaxEventCount,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}