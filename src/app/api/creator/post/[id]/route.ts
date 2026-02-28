import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createPostSchema } from '@/lib/validations/creator'

// GET - Get a specific post
export async function GET(
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

    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Perfil de criador não encontrado' },
        { status: 404 }
      )
    }

    const post = await prisma.post.findFirst({
      where: {
        id: params.id,
        creatorId: creator.id,
      },
      include: {
        media: true,
        planAccess: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
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

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar post' },
      { status: 500 }
    )
  }
}

// PUT - Update a post
export async function PUT(
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

    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Perfil de criador não encontrado' },
        { status: 404 }
      )
    }

    // Check if post exists and belongs to creator
    const existingPost = await prisma.post.findFirst({
      where: {
        id: params.id,
        creatorId: creator.id,
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { title, content, isPublic, planIds } = body

    // Validate input
    const validation = createPostSchema.safeParse({ title, content })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        title,
        content,
        isPublic: isPublic ?? true,
        updatedAt: new Date(),
      },
      include: {
        media: true,
        planAccess: {
          include: {
            plan: true,
          },
        },
      },
    })

    // Update plan access if not public
    if (!isPublic && planIds && planIds.length > 0) {
      // Delete existing plan access
      await prisma.postPlanAccess.deleteMany({
        where: { postId: params.id },
      })

      // Create new plan access
      await prisma.postPlanAccess.createMany({
        data: planIds.map((planId: string) => ({
          postId: params.id,
          planId,
        })),
      })
    } else if (isPublic) {
      // Remove all plan access if post is public
      await prisma.postPlanAccess.deleteMany({
        where: { postId: params.id },
      })
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'POST_UPDATED',
          entity: 'Post',
          entityId: updatedPost.id,
          metadata: JSON.stringify({ title, isPublic }),
        },
      })
    } catch (e) {
      // Ignore audit log errors
    }

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar post' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a post
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

    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Perfil de criador não encontrado' },
        { status: 404 }
      )
    }

    // Check if post exists and belongs to creator
    const existingPost = await prisma.post.findFirst({
      where: {
        id: params.id,
        creatorId: creator.id,
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    // Delete related records first
    await prisma.postPlanAccess.deleteMany({
      where: { postId: params.id },
    })

    await prisma.media.deleteMany({
      where: { postId: params.id },
    })

    await prisma.like.deleteMany({
      where: { postId: params.id },
    })

    await prisma.comment.deleteMany({
      where: { postId: params.id },
    })

    // Delete the post
    await prisma.post.delete({
      where: { id: params.id },
    })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'POST_DELETED',
          entity: 'Post',
          entityId: params.id,
          metadata: JSON.stringify({ title: existingPost.title }),
        },
      })
    } catch (e) {
      // Ignore audit log errors
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir post' },
      { status: 500 }
    )
  }
}

