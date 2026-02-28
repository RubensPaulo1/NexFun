import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get all notifications for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = {
      userId: session.user.id,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    // Parse data field
    const formattedNotifications = notifications.map((notif) => ({
      ...notif,
      data: notif.data ? JSON.parse(notif.data) : null,
    }))

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
      total: notifications.length,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })

      return NextResponse.json({
        message: 'Todas as notificações foram marcadas como lidas',
      })
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 }
      )
    }

    // Mark single notification as read
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id, // Ensure user owns the notification
      },
      data: {
        isRead: true,
      },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Notificação marcada como lida',
      notification,
    })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar notificação' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notification(s)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')
    const deleteAllRead = searchParams.get('deleteAllRead') === 'true'

    if (deleteAllRead) {
      // Delete all read notifications
      const result = await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
          isRead: true,
        },
      })

      return NextResponse.json({
        message: `${result.count} notificação(ões) excluída(s)`,
        deletedCount: result.count,
      })
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação é obrigatório' },
        { status: 400 }
      )
    }

    // Delete single notification
    const notification = await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id, // Ensure user owns the notification
      },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Notificação excluída',
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir notificação' },
      { status: 500 }
    )
  }
}

