import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPostSchema } from '@/lib/validations/creator'
import prisma from '@/lib/prisma'

// POST - Create a new post (updated for SQLite)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login novamente.' },
        { status: 401 }
      )
    }

    // Get creator profile
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Você precisa ser um criador para criar posts. Configure seu perfil de criador primeiro.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    
    // Validate input
    const result = createPostSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { title, content, isPublic, planIds } = result.data
    const { media } = body // Media array from frontend: [{ url, type }]

    // Create post with plan access and media
    const post = await prisma.post.create({
      data: {
        creatorId: creator.id,
        title,
        content,
        isPublic,
        publishedAt: new Date(),
        ...(planIds && planIds.length > 0 && {
          planAccess: {
            create: planIds.map((planId: string) => ({
              planId,
            })),
          },
        }),
        ...(media && media.length > 0 && {
          media: {
            create: media.map((m: { url: string; type: string }, index: number) => ({
              url: m.url,
              type: m.type,
              sortOrder: index,
            })),
          },
        }),
      },
      include: {
        planAccess: {
          include: { plan: true },
        },
        media: true,
      },
    })

    // Notify subscribers about new post (optional, wrapped in try-catch)
    try {
      // Get all active subscribers for this creator
      // For private posts: only notify subscribers with access to the plan
      // For public posts: notify all active subscribers
      const subscribers = await prisma.subscription.findMany({
        where: {
          creatorId: creator.id,
          status: 'ACTIVE',
          ...(isPublic
            ? {} // Public posts: notify all subscribers
            : planIds && planIds.length > 0
            ? {
                planId: { in: planIds }, // Private posts: only notify subscribers with plan access
              }
            : {}), // No planIds: notify all subscribers
        },
        select: { userId: true },
      })

      // Create notifications for subscribers
      // For private posts: only notify subscribers with access to the plan
      // For public posts: notify all subscribers
      if (subscribers.length > 0) {
        await prisma.notification.createMany({
          data: subscribers.map((sub) => ({
            userId: sub.userId,
            type: 'NEW_POST',
            title: 'Novo conteúdo disponível',
            message: `${creator.displayName} publicou: ${title}`,
            data: JSON.stringify({ postId: post.id, creatorSlug: creator.slug }),
          })),
        })
      }
    } catch (notifError) {
      console.error('Error sending notifications:', notifError)
      // Continue even if notifications fail
    }

    // Audit log (optional)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'POST_CREATED',
          entity: 'Post',
          entityId: post.id,
          metadata: JSON.stringify({ title, isPublic }),
        },
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json(
      { message: 'Post criado com sucesso', post },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Erro ao criar post. Verifique se você está logado como criador.' },
      { status: 500 }
    )
  }
}

// GET - Get all posts for the current creator (dashboard)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Perfil de criador não encontrado' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { creatorId: creator.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          media: true,
          planAccess: {
            include: { plan: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      }),
      prisma.post.count({ where: { creatorId: creator.id } }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar posts' },
      { status: 500 }
    )
  }
}
