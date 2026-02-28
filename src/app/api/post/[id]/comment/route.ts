import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1, 'Comentário não pode estar vazio').max(1000, 'Comentário muito longo'),
})

// POST - Create a comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Faça login para comentar' },
        { status: 401 }
      )
    }

    const postId = params.id
    const body = await req.json()

    // Validate input
    const result = commentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content } = result.data

    // Check if post exists with creator info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: session.user.id,
        content,
      },
    })

    // Get user info for response
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    })

    // Notify post creator about new comment (only if not commenting on own post)
    try {
      if (post.creator.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: post.creator.userId,
            type: 'NEW_COMMENT',
            title: 'Novo comentário',
            message: `${user?.name || 'Alguém'} comentou no seu post: ${post.title}`,
            data: JSON.stringify({ postId, commentId: comment.id, creatorSlug: post.creator.slug }),
          },
        })
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError)
      // Continue even if notification fails
    }

    return NextResponse.json({
      comment: {
        ...comment,
        user,
      },
      message: 'Comentário adicionado!',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Erro ao criar comentário' },
      { status: 500 }
    )
  }
}

// GET - Get comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get comments with user info
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          post: false,
        },
      }),
      prisma.comment.count({ where: { postId } }),
    ])

    // Get user info for each comment
    const userIds = [...new Set(comments.map((c) => c.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    })

    const usersMap = new Map(users.map((u) => [u.id, u]))

    const commentsWithUsers = comments.map((comment) => ({
      ...comment,
      user: usersMap.get(comment.userId) || { id: comment.userId, name: 'Usuário', avatar: null },
    }))

    return NextResponse.json({
      comments: commentsWithUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error getting comments:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar comentários' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a comment (by owner or post creator)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { error: 'ID do comentário não fornecido' },
        { status: 400 }
      )
    }

    // Get comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          include: {
            creator: true,
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Check permission (comment owner or post creator)
    const isCommentOwner = comment.userId === session.user.id
    const isPostCreator = comment.post.creator.userId === session.user.id

    if (!isCommentOwner && !isPostCreator) {
      return NextResponse.json(
        { error: 'Você não tem permissão para excluir este comentário' },
        { status: 403 }
      )
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({
      success: true,
      message: 'Comentário excluído',
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir comentário' },
      { status: 500 }
    )
  }
}


