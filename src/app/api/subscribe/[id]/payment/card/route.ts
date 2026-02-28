import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

// POST - Create Stripe checkout session for card payment
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

    const subscriptionId = params.id

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        error: 'STRIPE_SECRET_KEY não configurado',
      }, { status: 500 })
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: {
          include: {
            creator: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Create or get Stripe price
    let priceId = subscription.plan.stripePriceId

    if (!priceId) {
      const product = await stripe.products.create({
        name: `${subscription.plan.name} - ${subscription.plan.creator.displayName}`,
        description: subscription.plan.description || 'Assinatura mensal',
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: subscription.plan.price,
        currency: 'brl',
        recurring: {
          interval: 'month',
        },
      })

      priceId = price.id

      await prisma.plan.update({
        where: { id: subscription.plan.id },
        data: { stripePriceId: price.id },
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')

    const successUrl = `${cleanBaseUrl}/checkout/${subscription.id}/success`
    const cancelUrl = `${cleanBaseUrl}/checkout/${subscription.id}/payment`

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: subscription.user.email || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        subscriptionId: subscription.id,
        planId: subscription.plan.id,
        creatorId: subscription.plan.creatorId,
        userId: subscription.userId,
      },
      subscription_data: {
        metadata: {
          subscriptionId: subscription.id,
          planId: subscription.plan.id,
          creatorId: subscription.plan.creatorId,
        },
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error: any) {
    console.error('Error creating Stripe checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}

