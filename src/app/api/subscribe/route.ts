import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Create a subscription checkout session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json(
        { error: 'ID do plano é obrigatório' },
        { status: 400 }
      )
    }


    // Get the plan and creator
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        creator: true,
      },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Plano não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Garantir que apenas planos mensais sejam aceitos
    if (plan.interval !== 'MONTHLY') {
      return NextResponse.json(
        { error: 'Apenas planos mensais são permitidos' },
        { status: 400 }
      )
    }

    // Check if user is not subscribing to themselves
    if (plan.creator.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode assinar seu próprio conteúdo' },
        { status: 400 }
      )
    }

    // Check for existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        userId_creatorId: {
          userId: session.user.id,
          creatorId: plan.creatorId,
        },
      },
    })

    if (existingSubscription?.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa com este criador' },
        { status: 409 }
      )
    }

    // Calculate period dates - apenas planos mensais
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

    // Create or update subscription (pending state)
    const subscription = existingSubscription
      ? await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId,
            status: 'PENDING',
            currentPeriodStart,
            currentPeriodEnd,
          },
        })
      : await prisma.subscription.create({
          data: {
            userId: session.user.id,
            creatorId: plan.creatorId,
            planId,
            status: 'PENDING',
            currentPeriodStart,
            currentPeriodEnd,
          },
        })

    // Retornar a assinatura criada para redirecionar para página de seleção de pagamento
    // O usuário escolherá entre PIX (Mercado Pago) ou Cartão (Stripe)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')

    return NextResponse.json({
      message: 'Assinatura criada. Redirecione para seleção de pagamento.',
      subscription,
      paymentSelectionUrl: `${cleanBaseUrl}/checkout/${subscription.id}/payment`,
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao criar assinatura' },
      { status: 500 }
    )
  }
}

// GET - Get user's subscriptions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            interval: true,
            benefits: true,
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            isVerified: true,
            user: {
              select: {
                name: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formatar assinaturas com todos os dados importantes
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      canceledAt: sub.canceledAt?.toISOString() || null,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
        description: sub.plan.description,
        price: sub.plan.price,
        currency: sub.plan.currency,
        interval: sub.plan.interval,
        benefits: typeof sub.plan.benefits === 'string' 
          ? JSON.parse(sub.plan.benefits) 
          : sub.plan.benefits,
      },
      creator: {
        id: sub.creator.id,
        displayName: sub.creator.displayName,
        slug: sub.creator.slug,
        avatar: sub.creator.user?.avatar || null,
        isVerified: sub.creator.isVerified,
      },
    }))

    console.log(`📋 Retornando ${formattedSubscriptions.length} assinaturas para o usuário ${session.user.id}`)
    console.log('📊 Detalhes das assinaturas:', formattedSubscriptions.map(sub => ({
      id: sub.id,
      status: sub.status,
      creator: sub.creator.displayName,
      plan: sub.plan.name,
      periodEnd: sub.currentPeriodEnd,
    })))
    
    return NextResponse.json({ 
      subscriptions: formattedSubscriptions,
      count: formattedSubscriptions.length,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assinaturas' },
      { status: 500 }
    )
  }
}
