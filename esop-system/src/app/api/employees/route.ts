import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { grants: true },
        },
      },
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Failed to fetch employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const employee = await prisma.employee.create({
      data: {
        employeeId: body.employeeId,
        name: body.name,
        department: body.department,
        legalIdentity: body.legalIdentity,
        employmentEntity: body.employmentEntity || [],
        taxJurisdiction: body.taxJurisdiction,
        bankAccountType: body.bankAccountType,
        employmentStatus: body.employmentStatus || 'ACTIVE',
      },
    })
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Failed to create employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}