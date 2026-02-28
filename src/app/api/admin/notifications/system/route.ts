import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createSystemNotificationSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(1000, 'Mensagem muito longa'),
  targetRole: z.enum(['ALL', 'CREATOR', 'USER']).optional(),
  data: z.record(z.any()).optional(),
})

// POST - Create system notification (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem criar notificações do sistema.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const result = createSystemNotificationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { title, message, targetRole = 'ALL', data } = result.data

    // Get target users
    let whereClause: any = {}
    if (targetRole === 'CREATOR') {
      whereClause.role = 'CREATOR'
    } else if (targetRole === 'USER') {
      whereClause.role = 'USER'
    }
    // If 'ALL', no filter needed

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum usuário encontrado para enviar a notificação' },
        { status: 404 }
      )
    }

    // Create notifications for all target users
    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: 'SYSTEM',
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      })),
    })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'SYSTEM_NOTIFICATION_SENT',
          entity: 'Notification',
          metadata: JSON.stringify({
            title,
            message,
            targetRole,
            recipientCount: users.length,
          }),
        },
      })
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json({
      message: `Notificação enviada para ${users.length} usuário(s)`,
      recipients: users.length,
    })
  } catch (error) {
    console.error('Error creating system notification:', error)
    return NextResponse.json(
      { error: 'Erro ao criar notificação do sistema' },
      { status: 500 }
    )
  }
}

