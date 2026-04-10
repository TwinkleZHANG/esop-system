import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'

/**
 * POST /api/tax-events/:id/upload
 * 员工上传缴款凭证（图片或 PDF）
 * 上传后自动将税务事件状态从 PENDING → PAID
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const taxEvent = await prisma.taxEvent.findUnique({ where: { id } })
    if (!taxEvent) {
      return NextResponse.json({ error: 'Tax event not found' }, { status: 404 })
    }

    if (taxEvent.status !== 'PENDING' && taxEvent.status !== 'PAID') {
      return NextResponse.json(
        { error: '当前状态不允许上传凭证' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '仅支持 JPG、PNG、GIF、WebP 图片或 PDF 文件' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过 10MB' },
        { status: 400 }
      )
    }

    // Save file
    const ext = file.name.split('.').pop() || 'bin'
    const filename = `receipt_${id}_${Date.now()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const receiptFileUrl = `/uploads/${filename}`

    // Update tax event: save file URL and change status to PAID
    const updated = await prisma.taxEvent.update({
      where: { id },
      data: {
        receiptFileUrl,
        status: 'PAID',
      },
    })

    return NextResponse.json({
      success: true,
      receiptFileUrl,
      status: updated.status,
    })
  } catch (error) {
    console.error('Failed to upload receipt:', error)
    return NextResponse.json(
      { error: 'Failed to upload receipt' },
      { status: 500 }
    )
  }
}
