import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get creator statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get creator profile
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
      },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Perfil de criador não encontrado' },
        { status: 404 }
      )
    }

    // Get statistics
    const [
      totalSubscribers,
      totalPosts,
      recentSubscriptions,
      totalEarnings,
      thisMonthEarnings,
    ] = await Promise.all([
      // Total active subscribers
      prisma.subscription.count({
        where: {
          creatorId: creator.id,
          status: 'ACTIVE',
        },
      }),
      // Total published posts
      prisma.post.count({
        where: {
          creatorId: creator.id,
          publishedAt: { not: null },
        },
      }),
      // Recent subscriptions (last 5)
      prisma.subscription.findMany({
        where: {
          creatorId: creator.id,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
          plan: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Total earnings from payments
      (async () => {
        try {
          const payments = await prisma.payment.findMany({
            where: {
              subscription: {
                creatorId: creator.id,
              },
              status: 'COMPLETED',
            },
            select: {
              amount: true,
            },
          })
          return payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        } catch {
          return 0
        }
      })(),
      // This month earnings
      (async () => {
        try {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)
          
          const payments = await prisma.payment.findMany({
            where: {
              subscription: {
                creatorId: creator.id,
              },
              status: 'COMPLETED',
              createdAt: {
                gte: startOfMonth,
              },
            },
            select: {
              amount: true,
            },
          })
          return payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        } catch {
          return 0
        }
      })(),
    ])

    // Get likes and comments count (as proxy for views/interactions)
    const posts = await prisma.post.findMany({
      where: {
        creatorId: creator.id,
        publishedAt: { not: null },
      },
      select: {
        id: true,
      },
    })

    const postIds = posts.map(p => p.id)
    const [likesCount, commentsCount] = await Promise.all([
      postIds.length > 0 ? prisma.like.count({
        where: { postId: { in: postIds } },
      }) : Promise.resolve(0),
      postIds.length > 0 ? prisma.comment.count({
        where: { postId: { in: postIds } },
      }) : Promise.resolve(0),
    ])

    const totalViewsCount = likesCount + commentsCount

    return NextResponse.json({
      stats: {
        totalEarnings: totalEarnings || 0,
        thisMonthEarnings: thisMonthEarnings || 0,
        totalSubscribers,
        totalPosts,
        totalViews: totalViewsCount,
      },
      recentSubscribers: recentSubscriptions.map((sub) => ({
        id: sub.id,
        name: sub.user.name || 'Usuário',
        avatar: sub.user.avatar,
        plan: sub.plan.name,
        date: sub.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching creator stats:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}

