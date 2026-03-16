import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        grants: {
          include: {
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Failed to fetch employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name: body.name,
        department: body.department,
        legalIdentity: body.legalIdentity,
        employmentEntity: body.employmentEntity || [],
        taxJurisdiction: body.taxJurisdiction,
        bankAccountType: body.bankAccountType,
        employmentStatus: body.employmentStatus,
      },
    })
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Failed to update employee:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}