import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024 // 2GB

// POST - Upload file locally
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validate content type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use imagens (JPEG, PNG, GIF, WebP) ou vídeos (MP4, WebM).' },
        { status: 400 }
      )
    }

    // Validate size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    if (file.size > maxSize) {
      const maxSizeGB = maxSize / (1024 * 1024 * 1024)
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${maxSizeGB}GB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const extension = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4')
    const uniqueFilename = `${uuidv4()}.${extension}`
    const folder = isImage ? 'images' : 'videos'
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filePath = path.join(uploadDir, uniqueFilename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return the public URL
    const fileUrl = `/uploads/${folder}/${uniqueFilename}`

    return NextResponse.json({
      fileUrl,
      mediaType: isImage ? 'IMAGE' : 'VIDEO',
      filename: file.name,
      size: file.size,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}


