import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
})

// GET - Get specific verification request details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const request = await prisma.verificationRequest.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                posts: true,
                subscribers: true,
              },
            },
          },
        },
      },
    })

    if (!request) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ request })
  } catch (error) {
    console.error('Error fetching verification request:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar solicitação' },
      { status: 500 }
    )
  }
}

// PATCH - Approve or reject verification request
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Validate input
    const result = reviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { action, rejectionReason } = result.data

    // Get verification request
    const request = await prisma.verificationRequest.findUnique({
      where: { id: params.id },
      include: { creator: true },
    })

    if (!request) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta solicitação já foi processada' },
        { status: 400 }
      )
    }

    if (action === 'REJECT' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Motivo da rejeição é obrigatório' },
        { status: 400 }
      )
    }

    // Update verification request
    const updatedRequest = await prisma.verificationRequest.update({
      where: { id: params.id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    })

    // If approved, update creator's verified status
    if (action === 'APPROVE') {
      await prisma.creatorProfile.update({
        where: { id: request.creatorId },
        data: { isVerified: true },
      })

      // Create notification for creator
      try {
        await prisma.notification.create({
          data: {
            userId: request.creator.userId,
            type: 'VERIFICATION_APPROVED',
            title: 'Verificação Aprovada! ✅',
            message: 'Parabéns! Seu perfil foi verificado com sucesso. Agora você tem o selo de verificado.',
            data: JSON.stringify({ verificationId: updatedRequest.id }),
          },
        })
      } catch (e) {
        console.error('Notification error:', e)
      }
    } else {
      // Create notification for rejection
      try {
        await prisma.notification.create({
          data: {
            userId: request.creator.userId,
            type: 'VERIFICATION_REJECTED',
            title: 'Verificação Não Aprovada',
            message: `Sua solicitação de verificação não foi aprovada. Motivo: ${rejectionReason}`,
            data: JSON.stringify({ verificationId: updatedRequest.id, reason: rejectionReason }),
          },
        })
      } catch (e) {
        console.error('Notification error:', e)
      }
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: action === 'APPROVE' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
          entity: 'VerificationRequest',
          entityId: updatedRequest.id,
          metadata: JSON.stringify({
            creatorId: request.creatorId,
            action,
            rejectionReason,
          }),
        },
      })
    } catch (e) {
      console.error('Audit log error:', e)
    }

    return NextResponse.json({
      message: action === 'APPROVE' 
        ? 'Criador verificado com sucesso' 
        : 'Solicitação rejeitada',
      request: updatedRequest,
    })
  } catch (error) {
    console.error('Error reviewing verification request:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}


