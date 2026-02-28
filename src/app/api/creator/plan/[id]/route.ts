import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updatePlanSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().min(1, 'Preço mínimo é R$ 1,00').optional(),
  benefits: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET - Get a specific plan
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

    const plan = await prisma.plan.findFirst({
      where: {
        id: params.id,
        creatorId: creator.id,
      },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      plan: {
        ...plan,
        benefits: typeof plan.benefits === 'string' ? JSON.parse(plan.benefits) : plan.benefits,
      },
    })
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar plano' },
      { status: 500 }
    )
  }
}

// PUT - Update a plan
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

    // Check if plan exists and belongs to creator
    const existingPlan = await prisma.plan.findFirst({
      where: {
        id: params.id,
        creatorId: creator.id,
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Validate input
    const result = updatePlanSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, price, benefits, isActive } = result.data

    // Update plan
    const updatedPlan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price }),
        ...(benefits && { benefits: JSON.stringify(benefits) }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PLAN_UPDATED',
          entity: 'Plan',
          entityId: updatedPlan.id,
          metadata: JSON.stringify({ name: updatedPlan.name, price: updatedPlan.price }),
        },
      })
    } catch (e) {
      // Ignore audit log errors
    }

    return NextResponse.json({
      message: 'Plano atualizado com sucesso',
      plan: {
        ...updatedPlan,
        benefits: typeof updatedPlan.benefits === 'string' ? JSON.parse(updatedPlan.benefits) : updatedPlan.benefits,
      },
    })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a plan (soft delete - deactivate)
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

    // Check if plan exists and belongs to creator
    const existingPlan = await prisma.plan.findFirst({
      where: {
        id: params.id,
        creatorId: creator.id,
      },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: params.id,
        status: 'ACTIVE',
      },
    })

    if (activeSubscriptions > 0) {
      // Soft delete - deactivate the plan
      await prisma.plan.update({
        where: { id: params.id },
        data: { isActive: false },
      })

      return NextResponse.json({
        message: 'Plano desativado (possui assinantes ativos)',
        softDeleted: true,
      })
    }

    // Hard delete if no active subscriptions
    await prisma.plan.delete({
      where: { id: params.id },
    })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PLAN_DELETED',
          entity: 'Plan',
          entityId: params.id,
          metadata: JSON.stringify({ name: existingPlan.name }),
        },
      })
    } catch (e) {
      // Ignore audit log errors
    }

    return NextResponse.json({
      message: 'Plano excluído com sucesso',
      success: true,
    })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir plano' },
      { status: 500 }
    )
  }
}


