import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'

// Verify Mercado Pago webhook signature
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false
  
  const [ts, hash] = signature.split(',').map((s) => s.split('=')[1])
  const manifest = `id:${JSON.parse(body).data?.id};request-id:;ts:${ts};`
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')
  
  return hash === expectedHash
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-signature')
    
    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyWebhookSignature(
        body,
        signature,
        process.env.MERCADOPAGO_WEBHOOK_SECRET!
      )
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const event = JSON.parse(body)
    const { type, data } = event

    console.log('Mercado Pago webhook received:', type, data)

    switch (type) {
      case 'payment': {
        // Payment notification
        const paymentId = data.id
        
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
          console.error('MERCADOPAGO_ACCESS_TOKEN não configurado')
          break
        }

        try {
          // Fetch payment details from Mercado Pago API
          const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
          })
          const payment = new Payment(client)
          const paymentDetails = await payment.get({ id: parseInt(paymentId.toString()) })

          if (!paymentDetails) {
            console.error('Pagamento não encontrado no Mercado Pago:', paymentId)
            break
          }

          const paymentStatus = paymentDetails.status
          const subscriptionId = paymentDetails.metadata?.subscription_id

          if (!subscriptionId) {
            console.error('subscription_id não encontrado nos metadata do pagamento')
            break
          }

          // Find payment record
          const localPayment = await prisma.payment.findFirst({
            where: {
              subscriptionId: subscriptionId as string,
              providerPaymentId: paymentId.toString(),
              provider: 'MERCADOPAGO',
            },
            include: {
              subscription: {
                include: {
                  creator: true,
                  user: true,
                },
              },
            },
          })

          if (!localPayment) {
            console.error('Pagamento local não encontrado:', paymentId)
            break
          }

          // Update payment status
          await prisma.payment.update({
            where: { id: localPayment.id },
            data: {
              status: paymentStatus === 'approved' ? 'COMPLETED' : 
                     paymentStatus === 'rejected' || paymentStatus === 'cancelled' ? 'FAILED' : 'PENDING',
              paidAt: paymentStatus === 'approved' ? new Date() : null,
              failedAt: (paymentStatus === 'rejected' || paymentStatus === 'cancelled') ? new Date() : null,
              failureReason: (paymentStatus === 'rejected' || paymentStatus === 'cancelled') ? paymentDetails.status_detail || 'Pagamento rejeitado' : null,
            },
          })

          // If approved, activate subscription
          if (paymentStatus === 'approved') {
            const currentPeriodStart = new Date()
            const currentPeriodEnd = new Date()
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

            await prisma.subscription.update({
              where: { id: localPayment.subscriptionId },
              data: {
                status: 'ACTIVE',
                currentPeriodStart,
                currentPeriodEnd,
              },
            })

            // Notify creator about new subscriber
            if (localPayment.subscription.creator && localPayment.subscription.user) {
              await prisma.notification.create({
                data: {
                  userId: localPayment.subscription.creator.userId,
                  type: 'NEW_SUBSCRIBER',
                  title: 'Novo assinante!',
                  message: `${localPayment.subscription.user.name || 'Alguém'} assinou seu conteúdo`,
                  data: JSON.stringify({ subscriptionId: localPayment.subscriptionId }),
                },
              })
            }

            // Notify user about active subscription
            await prisma.notification.create({
              data: {
                userId: localPayment.subscription.userId,
                type: 'PAYMENT_SUCCESS',
                title: 'Assinatura ativada!',
                message: `Sua assinatura foi ativada com sucesso. Acesso válido até ${currentPeriodEnd.toLocaleDateString('pt-BR')}`,
                data: JSON.stringify({ subscriptionId: localPayment.subscriptionId }),
              },
            })

            console.log('✅ Pagamento PIX aprovado e assinatura ativada:', paymentId)
          } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
            // Notify user about failed payment
            await prisma.notification.create({
              data: {
                userId: localPayment.subscription.userId,
                type: 'PAYMENT_FAILED',
                title: 'Pagamento rejeitado',
                message: 'Não foi possível processar seu pagamento PIX. Por favor, tente novamente.',
                data: JSON.stringify({ subscriptionId: localPayment.subscriptionId }),
              },
            })
            console.log('❌ Pagamento PIX rejeitado:', paymentId)
          }
        } catch (error: any) {
          console.error('Erro ao processar webhook de pagamento PIX:', error)
        }
        break
      }

      case 'subscription_preapproval': {
        // Subscription status change
        const subscriptionId = data.id
        
        // Fetch subscription details from Mercado Pago
        // Update local subscription accordingly
        
        console.log('Subscription update:', subscriptionId)
        break
      }

      case 'subscription_preapproval_plan': {
        // Plan update
        console.log('Plan update:', data.id)
        break
      }

      default:
        console.log('Unhandled webhook type:', type)
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'WEBHOOK_RECEIVED',
        entity: 'MercadoPago',
        entityId: data?.id?.toString(),
        metadata: JSON.stringify({ type, data }),
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Mercado Pago webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

