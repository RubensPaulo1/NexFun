import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

// POST - Create Mercado Pago PIX payment
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

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json({
        error: 'MERCADOPAGO_ACCESS_TOKEN não configurado',
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

    // Initialize Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: {
        timeout: 5000,
        idempotencyKey: subscriptionId, // Use subscription ID for idempotency
      },
    })

    const payment = new Payment(client)

    // Create PIX payment
    const amount = subscription.plan.price / 100 // Convert from cents to reais

    // Build payment data
    const paymentData: any = {
      transaction_amount: amount,
      description: `Assinatura ${subscription.plan.name} - ${subscription.plan.creator.displayName}`,
      payment_method_id: 'pix',
      payer: {
        email: subscription.user.email || undefined,
        first_name: subscription.user.name?.split(' ')[0] || 'Cliente',
        last_name: subscription.user.name?.split(' ').slice(1).join(' ') || '',
      },
      metadata: {
        subscription_id: subscription.id,
        plan_id: subscription.plan.id,
        creator_id: subscription.plan.creatorId,
        user_id: subscription.userId,
      },
      statement_descriptor: `NEXFAN ${subscription.plan.name.substring(0, 15)}`,
    }

    // Add notification_url only if we have a valid, public URL
    // O Mercado Pago requer que notification_url seja uma URL válida e acessível publicamente
    // Para desenvolvimento local, use ngrok ou similar e configure MERCADOPAGO_WEBHOOK_URL
    // Se não configurada, o campo será omitido (pagamento funcionará, mas sem webhook automático)
    const webhookUrl = process.env.MERCADOPAGO_WEBHOOK_URL
    
    if (webhookUrl && webhookUrl.trim()) {
      try {
        const url = new URL(webhookUrl.trim())
        // Validate it's a proper HTTP/HTTPS URL with valid hostname (not localhost)
        if ((url.protocol === 'http:' || url.protocol === 'https:') && 
            url.hostname && 
            url.hostname.length > 0 &&
            !url.hostname.includes('localhost') &&
            !url.hostname.includes('127.0.0.1')) {
          paymentData.notification_url = webhookUrl.trim()
          console.log('✅ notification_url configurada:', paymentData.notification_url)
        } else {
          console.warn('⚠️ MERCADOPAGO_WEBHOOK_URL é localhost ou inválida, será omitida. Use uma URL pública (ex: ngrok) em desenvolvimento.')
        }
      } catch (e: any) {
        console.warn('⚠️ MERCADOPAGO_WEBHOOK_URL inválida, será omitida. Erro:', e.message)
      }
    }
    
    // If notification_url is not set, the field won't be included in the request
    // This is valid - Mercado Pago will work without it, you'll just need to poll for status

    const createdPayment = await payment.create({ body: paymentData })

    if (!createdPayment || !createdPayment.id) {
      throw new Error('Falha ao criar pagamento PIX')
    }

    // Save payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount,
        currency: 'BRL',
        status: 'PENDING',
        provider: 'MERCADOPAGO',
        providerPaymentId: createdPayment.id.toString(),
      },
    })

    // Get PIX payment details
    const pixData = createdPayment.point_of_interaction?.transaction_data

    if (!pixData) {
      throw new Error('Dados PIX não encontrados na resposta do Mercado Pago')
    }

    // Build redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')

    return NextResponse.json({
      paymentId: createdPayment.id.toString(),
      paymentUrl: createdPayment.point_of_interaction?.transaction_data?.ticket_url || createdPayment.point_of_interaction?.transaction_data?.qr_code || null,
      qrCode: pixData.qr_code || null,
      qrCodeBase64: pixData.qr_code_base64 || null,
      status: createdPayment.status,
      amount,
      // Redirect to payment page with PIX details
      redirectUrl: `${cleanBaseUrl}/checkout/${subscription.id}/pix/${createdPayment.id}`,
    })
  } catch (error: any) {
    console.error('Error creating PIX payment:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar pagamento PIX' },
      { status: 500 }
    )
  }
}

