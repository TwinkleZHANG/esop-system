import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.employmentEntity.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete employment entity:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}