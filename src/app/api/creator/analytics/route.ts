import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get creator analytics
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
      select: { id: true },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Perfil de criador não encontrado' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
    }

    // Get posts with interactions
    const posts = await prisma.post.findMany({
      where: {
        creatorId: creator.id,
        publishedAt: { not: null },
        ...(period !== 'all' && {
          publishedAt: {
            gte: startDate,
          },
        }),
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    })

    // Calculate stats
    const totalViews = posts.reduce((sum, post) => {
      return sum + post._count.likes + post._count.comments
    }, 0)

    const totalLikes = posts.reduce((sum, post) => sum + post._count.likes, 0)
    const totalComments = posts.reduce((sum, post) => sum + post._count.comments, 0)

    // Get new subscribers in period
    const newSubscribers = await prisma.subscription.count({
      where: {
        creatorId: creator.id,
        status: 'ACTIVE',
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Get plan distribution
    const subscriptions = await prisma.subscription.findMany({
      where: {
        creatorId: creator.id,
        status: 'ACTIVE',
      },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    })

    const planCounts = new Map<string, number>()
    subscriptions.forEach((sub) => {
      const count = planCounts.get(sub.plan.name) || 0
      planCounts.set(sub.plan.name, count + 1)
    })

    const totalSubscribers = subscriptions.length
    const planDistribution = Array.from(planCounts.entries()).map(([name, count]) => ({
      name,
      subscribers: count,
      percentage: totalSubscribers > 0 ? Math.round((count / totalSubscribers) * 100) : 0,
    }))

    // Top posts
    const topPosts = posts
      .map((post) => ({
        id: post.id,
        title: post.title,
        views: post._count.likes + post._count.comments,
        likes: post._count.likes,
        comments: post._count.comments,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    return NextResponse.json({
      stats: {
        views: totalViews,
        newSubscribers,
        likes: totalLikes,
        comments: totalComments,
      },
      topPosts,
      planDistribution,
      totalSubscribers,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar analytics' },
      { status: 500 }
    )
  }
}


