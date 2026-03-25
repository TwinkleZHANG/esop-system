import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await prisma.employmentEntity.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete employment entity:', error)
    return NextResponse.json(
      { error: 'Failed to delete employment entity' },
      { status: 500 }
    )
  }
}
