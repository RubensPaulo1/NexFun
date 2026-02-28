import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// DELETE - Delete user (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        creatorProfile: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Prevent deleting other admins
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Não é possível excluir outros administradores' },
        { status: 403 }
      )
    }

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_DELETED_BY_ADMIN',
        entity: 'User',
        entityId: userId,
        metadata: JSON.stringify({
          deletedUserEmail: user.email,
          deletedUserName: user.name,
          deletedUserRole: user.role,
          creatorProfile: user.creatorProfile ? {
            id: user.creatorProfile.id,
            displayName: user.creatorProfile.displayName,
          } : null,
        }),
      },
    })

    // Delete user (cascade will handle related records)
    // Prisma will automatically delete related records due to onDelete: Cascade
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      message: 'Usuário excluído com sucesso',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    )
  }
}

