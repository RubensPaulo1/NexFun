import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Like a post
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Faça login para curtir' },
        { status: 401 }
      )
    }

    const postId = params.id

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    })

    if (existingLike) {
      // Unlike - remove the like
      await prisma.like.delete({
        where: { id: existingLike.id },
      })

      const likesCount = await prisma.like.count({
        where: { postId },
      })

      return NextResponse.json({
        liked: false,
        likesCount,
        message: 'Like removido',
      })
    }

    // Create like
    await prisma.like.create({
      data: {
        postId,
        userId: session.user.id,
      },
    })

    const likesCount = await prisma.like.count({
      where: { postId },
    })

    return NextResponse.json({
      liked: true,
      likesCount,
      message: 'Post curtido!',
    })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Erro ao curtir post' },
      { status: 500 }
    )
  }
}

// GET - Check if user liked a post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.id

    // Get likes count
    const likesCount = await prisma.like.count({
      where: { postId },
    })

    // Check if current user liked
    let liked = false
    if (session?.user?.id) {
      const existingLike = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: session.user.id,
          },
        },
      })
      liked = !!existingLike
    }

    return NextResponse.json({
      liked,
      likesCount,
    })
  } catch (error) {
    console.error('Error getting like status:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar like' },
      { status: 500 }
    )
  }
}


