import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

// POST - Get presigned URL for upload
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { filename, contentType, size, type = 'image' } = body

    if (!filename || !contentType || !size) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }

    // Validate content type
    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    // Validate size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    if (size > maxSize) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const extension = filename.split('.').pop()
    const uniqueFilename = `${uuidv4()}.${extension}`
    const folder = isImage ? 'images' : 'videos'
    const key = `uploads/${session.user.id}/${folder}/${uniqueFilename}`

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: contentType,
      ACL: 'private',
      Metadata: {
        userId: session.user.id,
        originalFilename: filename,
      },
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    
    // Construct the final URL
    const fileUrl = process.env.AWS_CLOUDFRONT_URL
      ? `${process.env.AWS_CLOUDFRONT_URL}/${key}`
      : `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
      mediaType: isImage ? 'IMAGE' : 'VIDEO',
    })
  } catch (error) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar URL de upload' },
      { status: 500 }
    )
  }
}

