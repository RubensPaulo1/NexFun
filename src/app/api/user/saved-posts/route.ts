import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get user's saved posts
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get saved posts with post details
    const [savedPosts, total] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId: session.user.id },
        include: {
          post: {
            include: {
              creator: {
                include: {
                  user: {
                    select: {
                      name: true,
                      avatar: true,
                    },
                  },
                },
              },
              media: {
                take: 1,
                orderBy: { sortOrder: 'asc' },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.savedPost.count({
        where: { userId: session.user.id },
      }),
    ])

    // Format response
    const formattedPosts = savedPosts
      .filter((sp) => sp.post) // Filter out deleted posts
      .map((savedPost) => ({
        id: savedPost.post.id,
        title: savedPost.post.title,
        content: savedPost.post.content,
        isPublic: savedPost.post.isPublic,
        publishedAt: savedPost.post.publishedAt?.toISOString() || null,
        savedAt: savedPost.createdAt.toISOString(),
        creator: {
          id: savedPost.post.creator.id,
          displayName: savedPost.post.creator.displayName,
          slug: savedPost.post.creator.slug,
          avatar: savedPost.post.creator.user?.avatar || null,
        },
        media: savedPost.post.media,
        likesCount: savedPost.post._count.likes,
        commentsCount: savedPost.post._count.comments,
      }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching saved posts:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar posts salvos' },
      { status: 500 }
    )
  }
}

