import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Stripe webhook received:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('🔔 checkout.session.completed recebido:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          paymentMethod: session.payment_method_types?.[0] || 'unknown',
          subscription: session.subscription,
          metadata: session.metadata,
        })
        
        // Verificar se o pagamento foi bem-sucedido
        if (session.payment_status !== 'paid') {
          console.log('⚠️ Pagamento não foi concluído, status:', session.payment_status)
          break
        }

        // Get subscription from metadata
        const subscriptionId = session.metadata?.subscriptionId
        
        if (!subscriptionId) {
          console.error('❌ subscriptionId não encontrado nos metadata')
          break
        }

        // Buscar a assinatura local primeiro
        const localSubscription = await prisma.subscription.findUnique({
          where: { id: subscriptionId },
          include: { creator: true, user: true },
        })

        if (!localSubscription) {
          console.error('❌ Assinatura local não encontrada:', subscriptionId)
          break
        }

        // Se já tiver stripeSubscriptionId, buscar a subscription do Stripe
        let stripeSubscription: Stripe.Subscription | null = null
        let stripeSubscriptionId: string | null = null

        if (session.subscription) {
          stripeSubscriptionId = session.subscription as string
          try {
            stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
            console.log('✅ Subscription do Stripe recuperada:', {
              id: stripeSubscription.id,
              status: stripeSubscription.status,
              currentPeriodStart: stripeSubscription.current_period_start,
              currentPeriodEnd: stripeSubscription.current_period_end,
            })
          } catch (error) {
            console.error('❌ Erro ao recuperar subscription do Stripe:', error)
          }
        }

        // Calcular período: usar dados do Stripe se disponível, senão calcular
        let currentPeriodStart: Date
        let currentPeriodEnd: Date

        if (stripeSubscription) {
          currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
          currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)
        } else {
          // Fallback: calcular baseado na data atual
          currentPeriodStart = new Date()
          currentPeriodEnd = new Date()
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
          console.log('⚠️ Usando datas calculadas como fallback')
        }

        // Atualizar assinatura para ACTIVE
        const updateData: any = {
          status: 'ACTIVE',
          currentPeriodStart,
          currentPeriodEnd,
        }

        // Sempre atualizar o stripeSubscriptionId se disponível
        if (stripeSubscriptionId) {
          updateData.stripeSubscriptionId = stripeSubscriptionId
        }

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: updateData,
        })

        console.log('✅ Assinatura atualizada para ACTIVE:', {
          subscriptionId,
          stripeSubscriptionId: stripeSubscriptionId || localSubscription.stripeSubscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
        })

        // Criar ou atualizar registro de pagamento
        const paymentIntentId = session.payment_intent as string
        if (paymentIntentId) {
          // Verificar se já existe um pagamento para esta assinatura e payment_intent
          const existingPayment = await prisma.payment.findFirst({
            where: {
              subscriptionId,
              providerPaymentId: paymentIntentId,
            },
          })

          if (!existingPayment) {
            await prisma.payment.create({
              data: {
                subscriptionId,
                amount: (session.amount_total || 0) / 100,
                currency: session.currency?.toUpperCase() || 'BRL',
                status: 'COMPLETED',
                provider: 'STRIPE',
                providerPaymentId: paymentIntentId,
                paidAt: new Date(),
              },
            })
            console.log('✅ Pagamento criado com sucesso')
          } else {
            // Atualizar pagamento existente se necessário
            await prisma.payment.update({
              where: { id: existingPayment.id },
              data: {
                status: 'COMPLETED',
                paidAt: new Date(),
              },
            })
            console.log('✅ Pagamento atualizado para COMPLETED')
          }
        }

        // Notificar criador sobre novo assinante
        if (localSubscription.creator && localSubscription.user) {
          await prisma.notification.create({
            data: {
              userId: localSubscription.creator.userId,
              type: 'NEW_SUBSCRIBER',
              title: 'Novo assinante!',
              message: `${localSubscription.user.name || 'Alguém'} assinou seu conteúdo`,
              data: JSON.stringify({ subscriptionId }),
            },
          })
          console.log('✅ Notificação enviada ao criador')
        }

        // Notificar usuário sobre assinatura ativa
        await prisma.notification.create({
          data: {
            userId: localSubscription.userId,
            type: 'PAYMENT_SUCCESS',
            title: 'Assinatura ativada!',
            message: `Sua assinatura foi ativada com sucesso. Acesso válido até ${currentPeriodEnd.toLocaleDateString('pt-BR')}`,
            data: JSON.stringify({ subscriptionId }),
          },
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        const localSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          include: { creator: true, user: true },
        })

        if (localSubscription) {
          const oldStatus = localSubscription.status
          let status: 'ACTIVE' | 'PAUSED' | 'PAST_DUE' | 'CANCELED' = 'ACTIVE'
          
          if (subscription.status === 'past_due') status = 'PAST_DUE'
          if (subscription.status === 'paused') status = 'PAUSED'
          if (subscription.status === 'canceled') status = 'CANCELED'

          await prisma.subscription.update({
            where: { id: localSubscription.id },
            data: {
              status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })

          // Notify user about status changes
          if (oldStatus !== status) {
            try {
              if (status === 'CANCELED') {
                await prisma.notification.create({
                  data: {
                    userId: localSubscription.userId,
                    type: 'SUBSCRIPTION_CANCELED',
                    title: 'Assinatura cancelada',
                    message: 'Sua assinatura foi cancelada. Você não terá mais acesso ao conteúdo exclusivo.',
                    data: JSON.stringify({ subscriptionId: localSubscription.id }),
                  },
                })
                // Also notify creator
                await prisma.notification.create({
                  data: {
                    userId: localSubscription.creator.userId,
                    type: 'SUBSCRIBER_CANCELED',
                    title: 'Assinante cancelou',
                    message: `${localSubscription.user.name || 'Um assinante'} cancelou sua assinatura`,
                    data: JSON.stringify({ subscriptionId: localSubscription.id }),
                  },
                })
              } else if (status === 'PAST_DUE') {
                await prisma.notification.create({
                  data: {
                    userId: localSubscription.userId,
                    type: 'PAYMENT_FAILED',
                    title: 'Pagamento pendente',
                    message: 'Seu pagamento está pendente. Por favor, atualize seu método de pagamento.',
                    data: JSON.stringify({ subscriptionId: localSubscription.id }),
                  },
                })
              } else if (status === 'ACTIVE' && oldStatus === 'PAST_DUE') {
                await prisma.notification.create({
                  data: {
                    userId: localSubscription.userId,
                    type: 'PAYMENT_SUCCESS',
                    title: 'Pagamento atualizado',
                    message: 'Seu pagamento foi processado com sucesso e sua assinatura foi reativada.',
                    data: JSON.stringify({ subscriptionId: localSubscription.id }),
                  },
                })
              }
            } catch (notifError) {
              console.error('Error sending status change notification:', notifError)
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        const localSubscriptions = await prisma.subscription.findMany({
          where: { stripeSubscriptionId: subscription.id },
          include: { creator: true, user: true },
        })
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        })

        // Notify users about cancellation
        for (const localSubscription of localSubscriptions) {
          try {
            await prisma.notification.create({
              data: {
                userId: localSubscription.userId,
                type: 'SUBSCRIPTION_CANCELED',
                title: 'Assinatura cancelada',
                message: 'Sua assinatura foi cancelada. Você não terá mais acesso ao conteúdo exclusivo.',
                data: JSON.stringify({ subscriptionId: localSubscription.id }),
              },
            })
            // Also notify creator
            await prisma.notification.create({
              data: {
                userId: localSubscription.creator.userId,
                type: 'SUBSCRIBER_CANCELED',
                title: 'Assinante cancelou',
                message: `${localSubscription.user.name || 'Um assinante'} cancelou sua assinatura`,
                data: JSON.stringify({ subscriptionId: localSubscription.id }),
              },
            })
          } catch (notifError) {
            console.error('Error sending cancellation notification:', notifError)
          }
        }
        break
      }

      case 'invoice.paid': {
        // Cobrança automática bem-sucedida
        const invoice = event.data.object as Stripe.Invoice
        
        if (!invoice.subscription) break

        const localSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription as string },
          include: { plan: true },
        })

        if (localSubscription) {
          // Buscar a subscription do Stripe para obter as datas atualizadas
          const stripeSubscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )

          const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
          const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)

          // Atualizar assinatura como ativa e renovar o período
          await prisma.subscription.update({
            where: { id: localSubscription.id },
            data: {
              status: 'ACTIVE',
              currentPeriodStart,
              currentPeriodEnd,
            },
          })

          // Criar registro de pagamento
          await prisma.payment.create({
            data: {
              subscriptionId: localSubscription.id,
              amount: (invoice.amount_paid || 0) / 100,
              currency: invoice.currency?.toUpperCase() || 'BRL',
              status: 'COMPLETED',
              provider: 'STRIPE',
              providerPaymentId: invoice.payment_intent as string,
              paidAt: new Date(),
            },
          })

          // Get creator info
          const creator = await prisma.creatorProfile.findUnique({
            where: { id: localSubscription.creatorId },
            include: { user: true },
          })

          // Notificar o usuário sobre o pagamento recorrente
          await prisma.notification.create({
            data: {
              userId: localSubscription.userId,
              type: 'PAYMENT_SUCCESS',
              title: 'Pagamento processado',
              message: `Sua assinatura foi renovada. Acesso válido até ${new Date(currentPeriodEnd).toLocaleDateString('pt-BR')}`,
              data: JSON.stringify({ subscriptionId: localSubscription.id }),
            },
          })

          // Notificar o criador sobre o pagamento recorrente recebido
          if (creator) {
            await prisma.notification.create({
              data: {
                userId: creator.userId,
                type: 'PAYMENT_RECEIVED',
                title: 'Pagamento recebido',
                message: `Você recebeu um pagamento recorrente de R$ ${((invoice.amount_paid || 0) / 100).toFixed(2)}`,
                data: JSON.stringify({ subscriptionId: localSubscription.id, amount: invoice.amount_paid }),
              },
            })
          }

          console.log(`✅ Cobrança automática processada para assinatura ${localSubscription.id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        const localSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription as string },
        })

        if (localSubscription) {
          await prisma.subscription.update({
            where: { id: localSubscription.id },
            data: { status: 'PAST_DUE' },
          })

          // Get creator info
          const creator = await prisma.creatorProfile.findUnique({
            where: { id: localSubscription.creatorId },
            include: { user: true },
          })

          // Notify user
          await prisma.notification.create({
            data: {
              userId: localSubscription.userId,
              type: 'PAYMENT_FAILED',
              title: 'Falha no pagamento',
              message: 'Não foi possível processar seu pagamento. Por favor, atualize seu método de pagamento.',
              data: JSON.stringify({ subscriptionId: localSubscription.id }),
            },
          })

          // Notify creator about failed payment
          if (creator) {
            await prisma.notification.create({
              data: {
                userId: creator.userId,
                type: 'PAYMENT_FAILED',
                title: 'Falha no pagamento de assinante',
                message: `Um assinante teve falha no pagamento. A assinatura está pendente.`,
                data: JSON.stringify({ subscriptionId: localSubscription.id }),
              },
            })
          }
        }
        break
      }

      case 'account.updated': {
        // Stripe Connect account update
        const account = event.data.object as Stripe.Account
        
        await prisma.creatorProfile.updateMany({
          where: { stripeAccountId: account.id },
          data: {
            isVerified: account.charges_enabled && account.payouts_enabled,
          },
        })
        break
      }

      default:
        console.log('Unhandled Stripe event type:', event.type)
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'WEBHOOK_RECEIVED',
        entity: 'Stripe',
        entityId: event.id,
        metadata: JSON.stringify({ type: event.type }),
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

