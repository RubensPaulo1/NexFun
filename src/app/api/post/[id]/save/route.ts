import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Save a post
export async function POST(
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

    const postId = params.id
    const userId = session.user.id

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

    // Check if already saved
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    if (existingSave) {
      return NextResponse.json({
        message: 'Post já está salvo',
        saved: true,
      })
    }

    // Save the post
    await prisma.savedPost.create({
      data: {
        postId,
        userId,
      },
    })

    return NextResponse.json({
      message: 'Post salvo com sucesso',
      saved: true,
    })
  } catch (error) {
    console.error('Error saving post:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar post' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a saved post
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

    const postId = params.id
    const userId = session.user.id

    // Remove saved post
    await prisma.savedPost.deleteMany({
      where: {
        postId,
        userId,
      },
    })

    return NextResponse.json({
      message: 'Post removido dos salvos',
      saved: false,
    })
  } catch (error) {
    console.error('Error removing saved post:', error)
    return NextResponse.json(
      { error: 'Erro ao remover post dos salvos' },
      { status: 500 }
    )
  }
}

// GET - Check if post is saved
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { saved: false },
        { status: 200 }
      )
    }

    const postId = params.id
    const userId = session.user.id

    const savedPost = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    return NextResponse.json({
      saved: !!savedPost,
    })
  } catch (error) {
    console.error('Error checking saved post:', error)
    return NextResponse.json(
      { saved: false },
      { status: 200 }
    )
  }
}

