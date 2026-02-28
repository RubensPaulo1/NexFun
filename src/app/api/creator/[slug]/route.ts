import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateCreatorProfileSchema } from '@/lib/validations/creator'
import prisma from '@/lib/prisma'
import { isSubscriptionActive } from '@/lib/utils'

// GET - Get creator profile by slug
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { slug } = params

    const creator = await prisma.creatorProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
        plans: {
          where: { 
            isActive: true,
            interval: 'MONTHLY', // Apenas planos mensais
          },
          orderBy: { sortOrder: 'asc' },
        },
        posts: {
          where: { publishedAt: { not: null } },
          orderBy: { publishedAt: 'desc' },
          take: 10,
          include: {
            media: true,
            planAccess: {
              include: { plan: true },
            },
            _count: {
              select: { likes: true, comments: true },
            },
          },
        },
        _count: {
          select: {
            subscribers: true,
            posts: true,
          },
        },
      },
    })

    if (!creator || !creator.isActive) {
      return NextResponse.json(
        { error: 'Criador não encontrado' },
        { status: 404 }
      )
    }

    // Check if current user is subscribed and has valid access
    let isSubscribed = false
    let subscription = null
    
    if (session?.user?.id) {
      subscription = await prisma.subscription.findUnique({
        where: {
          userId_creatorId: {
            userId: session.user.id,
            creatorId: creator.id,
          },
        },
        include: { plan: true },
      })
      // Verificar se está ativa E dentro do período válido
      isSubscribed = subscription 
        ? isSubscriptionActive(subscription.status, subscription.currentPeriodEnd)
        : false
    }

    // Get likes for current user if logged in
    let userLikes: Set<string> = new Set()
    let userSavedPosts: Set<string> = new Set()
    if (session?.user?.id) {
      const likes = await prisma.like.findMany({
        where: {
          userId: session.user.id,
          postId: { in: creator.posts.map((p) => p.id) },
        },
        select: { postId: true },
      })
      userLikes = new Set(likes.map((l) => l.postId))

      // Get saved posts
      const savedPosts = await prisma.savedPost.findMany({
        where: {
          userId: session.user.id,
          postId: { in: creator.posts.map((p) => p.id) },
        },
        select: { postId: true },
      })
      userSavedPosts = new Set(savedPosts.map((sp) => sp.postId))
    }

    // Filter posts based on subscription
    const posts = creator.posts.map((post) => {
      const hasAccess = post.isPublic || isSubscribed
      return {
        ...post,
        content: hasAccess ? post.content : null,
        media: hasAccess ? post.media : [],
        isLocked: !hasAccess,
        isLiked: userLikes.has(post.id),
        isSaved: userSavedPosts.has(post.id),
      }
    })

    // Flatten user data into creator object for frontend
    const creatorData = {
      id: creator.id,
      userId: creator.userId,
      displayName: creator.displayName,
      slug: creator.slug,
      avatar: creator.user?.avatar || null,
      coverImage: creator.coverImage,
      bio: creator.user?.bio || null,
      socialLinks: creator.socialLinks ? JSON.parse(creator.socialLinks) : null,
      isVerified: creator.isVerified,
      isActive: creator.isActive,
      createdAt: creator.createdAt,
      plans: creator.plans.map((plan) => ({
        ...plan,
        benefits: plan.benefits ? JSON.parse(plan.benefits) : [],
      })),
      posts,
      _count: creator._count,
    }

    return NextResponse.json({
      creator: creatorData,
      isSubscribed,
      subscription,
      isOwner: session?.user?.id === creator.userId,
    })
  } catch (error) {
    console.error('Error fetching creator:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar criador' },
      { status: 500 }
    )
  }
}

// PATCH - Update creator profile
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { slug } = params

    // Find creator profile
    const creator = await prisma.creatorProfile.findUnique({
      where: { slug },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Criador não encontrado' },
        { status: 404 }
      )
    }

    // Check ownership
    if (creator.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const body = await req.json()
    
    // Validate input
    const result = updateCreatorProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { displayName, slug: newSlug, bio, socialLinks } = result.data

    // Check if new slug is already taken
    if (newSlug && newSlug !== slug) {
      const existingSlug = await prisma.creatorProfile.findUnique({
        where: { slug: newSlug },
      })
      if (existingSlug) {
        return NextResponse.json(
          { error: 'Esta URL já está em uso' },
          { status: 409 }
        )
      }
    }

    // Update creator profile
    const updatedProfile = await prisma.creatorProfile.update({
      where: { slug },
      data: {
        ...(displayName && { displayName }),
        ...(newSlug && { slug: newSlug }),
        ...(socialLinks && { socialLinks }),
      },
    })

    // Update user bio if provided
    if (bio !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { bio },
      })
    }

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      creatorProfile: updatedProfile,
    })
  } catch (error) {
    console.error('Error updating creator profile:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}

