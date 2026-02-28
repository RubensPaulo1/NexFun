import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPlanSchema } from '@/lib/validations/creator'
import prisma from '@/lib/prisma'

// POST - Create a new subscription plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get creator profile
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Você precisa ser um criador para criar planos' },
        { status: 403 }
      )
    }

    const body = await req.json()
    
    // Validate input
    const result = createPlanSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, price, currency, benefits } = result.data
    // Sempre usar MONTHLY - apenas planos mensais são permitidos
    const interval = 'MONTHLY'

    // Check plan limit (max 5 plans per creator)
    const planCount = await prisma.plan.count({
      where: { creatorId: creator.id, isActive: true },
    })

    if (planCount >= 5) {
      return NextResponse.json(
        { error: 'Limite máximo de 5 planos ativos atingido' },
        { status: 400 }
      )
    }

    // Get next sort order
    const lastPlan = await prisma.plan.findFirst({
      where: { creatorId: creator.id },
      orderBy: { sortOrder: 'desc' },
    })

    const plan = await prisma.plan.create({
      data: {
        creatorId: creator.id,
        name,
        description,
        price,
        currency,
        interval,
        benefits: JSON.stringify(benefits), // SQLite: store as JSON string
        sortOrder: (lastPlan?.sortOrder ?? -1) + 1,
      },
    })

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PLAN_CREATED',
          entity: 'Plan',
          entityId: plan.id,
          metadata: JSON.stringify({ name, price, currency }),
        },
      })
    } catch (e) {
      console.error('Audit log error:', e)
    }

    return NextResponse.json(
      { message: 'Plano criado com sucesso', plan },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: 'Erro ao criar plano' },
      { status: 500 }
    )
  }
}

// GET - Get all plans for the current creator
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
      // Return empty plans instead of 404 for better UX
      return NextResponse.json({ plans: [] })
    }

    const plans = await prisma.plan.findMany({
      where: { 
        creatorId: creator.id,
        interval: 'MONTHLY', // Apenas planos mensais
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    })

    // Parse benefits JSON for each plan
    const parsedPlans = plans.map(plan => ({
      ...plan,
      benefits: typeof plan.benefits === 'string' ? JSON.parse(plan.benefits) : plan.benefits,
    }))

    return NextResponse.json({ plans: parsedPlans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}
