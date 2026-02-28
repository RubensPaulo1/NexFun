import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isSubscriptionActive } from '@/lib/utils'

// GET - Get feed posts from creators the user follows
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get user's subscriptions (vamos filtrar depois apenas as válidas)
    const allSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        plan: true,
      },
    })

    // Filtrar apenas assinaturas ativas E dentro do período válido
    const subscriptions = allSubscriptions.filter((sub) =>
      isSubscriptionActive(sub.status, sub.currentPeriodEnd)
    )

    if (subscriptions.length === 0) {
      return NextResponse.json({
        posts: [],
        subscriptions: [],
      })
    }

    // Get creator IDs
    const creatorIds = subscriptions.map((sub) => sub.creatorId)

    // Get all posts from followed creators
    const posts = await prisma.post.findMany({
      where: {
        creatorId: { in: creatorIds },
        publishedAt: { not: null },
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        media: true,
        planAccess: {
          include: { plan: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50, // Limit to 50 most recent posts
    })

    // Get user's likes for these posts
    const userLikes = await prisma.like.findMany({
      where: {
        userId: session.user.id,
        postId: { in: posts.map((p) => p.id) },
      },
      select: { postId: true },
    })
    const likedPostIds = new Set(userLikes.map((l) => l.postId))

    // Get user's saved posts
    const userSavedPosts = await prisma.savedPost.findMany({
      where: {
        userId: session.user.id,
        postId: { in: posts.map((p) => p.id) },
      },
      select: { postId: true },
    })
    const savedPostIds = new Set(userSavedPosts.map((sp) => sp.postId))

    // Create a map of creatorId -> subscription for quick lookup
    const subscriptionMap = new Map(
      subscriptions.map((sub) => [sub.creatorId, sub])
    )

    // Filter and format posts based on access
    const feedPosts = posts
      .map((post) => {
        const subscription = subscriptionMap.get(post.creatorId)
        const userPlanId = subscription?.planId

        // Check if user has access to this post
        // Verificar se tem assinatura ativa E dentro do período válido
        const hasValidSubscription = subscription 
          ? isSubscriptionActive(subscription.status, subscription.currentPeriodEnd)
          : false

        const hasAccess =
          post.isPublic ||
          (hasValidSubscription &&
            subscription &&
            (post.planAccess.length === 0 ||
              post.planAccess.some((pa) => pa.planId === userPlanId)))

        return {
          id: post.id,
          title: post.title,
          content: hasAccess ? post.content : null,
          isPublic: post.isPublic,
          isPinned: post.isPinned,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          media: hasAccess ? post.media : [],
          isLocked: !hasAccess,
          isLiked: likedPostIds.has(post.id),
          isSaved: savedPostIds.has(post.id),
          _count: post._count,
          creator: {
            id: post.creator.id,
            userId: post.creator.userId,
            displayName: post.creator.displayName,
            slug: post.creator.slug,
            avatar: post.creator.user?.avatar || null,
            isVerified: post.creator.isVerified,
          },
        }
      })
      .filter((post) => {
        // Only show posts that are public OR the user has access to
        return post.isPublic || !post.isLocked
      })

    // Format subscriptions for frontend
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      creator: {
        id: sub.creator.id,
        displayName: sub.creator.displayName,
        slug: sub.creator.slug,
        avatar: sub.creator.user?.avatar || null,
      },
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
      },
    }))

    return NextResponse.json({
      posts: feedPosts,
      subscriptions: formattedSubscriptions,
    })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar feed' },
      { status: 500 }
    )
  }
}

