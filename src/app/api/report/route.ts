import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const reportSchema = z.object({
  targetId: z.string().min(1, 'ID do alvo é obrigatório'),
  targetType: z.enum(['USER', 'POST', 'COMMENT']),
  reason: z.enum([
    'SPAM',
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'COPYRIGHT',
    'SCAM',
    'OTHER',
  ]),
  description: z.string().max(1000).optional(),
})

// POST - Create a report
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
    
    const result = reportSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { targetId, targetType, reason, description } = result.data

    // Check if target exists
    let targetUserId: string | null = null
    
    switch (targetType) {
      case 'USER':
        const user = await prisma.user.findUnique({ where: { id: targetId } })
        if (!user) {
          return NextResponse.json(
            { error: 'Usuário não encontrado' },
            { status: 404 }
          )
        }
        targetUserId = user.id
        break
      
      case 'POST':
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          include: { creator: true },
        })
        if (!post) {
          return NextResponse.json(
            { error: 'Post não encontrado' },
            { status: 404 }
          )
        }
        targetUserId = post.creator.userId
        break
      
      case 'COMMENT':
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
        })
        if (!comment) {
          return NextResponse.json(
            { error: 'Comentário não encontrado' },
            { status: 404 }
          )
        }
        targetUserId = comment.userId
        break
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Alvo não encontrado' },
        { status: 404 }
      )
    }

    // Check if user is reporting themselves
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode denunciar a si mesmo' },
        { status: 400 }
      )
    }

    // Check for existing report from same user
    const existingReport = await prisma.report.findFirst({
      where: {
        senderId: session.user.id,
        targetId: targetUserId,
        status: { in: ['PENDING', 'INVESTIGATING'] },
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Você já possui uma denúncia pendente para este alvo' },
        { status: 409 }
      )
    }

    const report = await prisma.report.create({
      data: {
        senderId: session.user.id,
        targetId: targetUserId,
        targetType,
        reason,
        description,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REPORT_CREATED',
        entity: 'Report',
        entityId: report.id,
        metadata: JSON.stringify({ targetType, reason }),
      },
    })

    return NextResponse.json(
      { message: 'Denúncia enviada com sucesso', report },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Erro ao criar denúncia' },
      { status: 500 }
    )
  }
}

