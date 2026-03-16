import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  try {
    const entities = await prisma.employmentEntity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(entities)
  } catch (error) {
    console.error('Failed to fetch employment entities:', error)
    return NextResponse.json({ error: 'Failed to fetch employment entities' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const entity = await prisma.employmentEntity.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: true,
      },
    })
    return NextResponse.json(entity)
  } catch (error) {
    console.error('Failed to create employment entity:', error)
    return NextResponse.json({ error: 'Failed to create employment entity' }, { status: 500 })
  }
}