import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get unread notification count
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { unreadCount: 0 },
        { status: 200 }
      )
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { unreadCount: 0 },
      { status: 200 }
    )
  }
}

