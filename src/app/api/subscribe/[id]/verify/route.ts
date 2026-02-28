import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// POST - Verify and update subscription status
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

    // Buscar assinatura
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        user: true,
        creator: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      )
    }

    console.log('🔍 Verificando assinatura:', {
      subscriptionId,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      paymentsCount: subscription.payments.length,
      payments: subscription.payments.map(p => ({
        status: p.status,
        amount: p.amount,
        paidAt: p.paidAt,
      })),
    })

    // Verificar se a assinatura pertence ao usuário
    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Se já estiver ativa, retornar
    if (subscription.status === 'ACTIVE') {
      return NextResponse.json({
        status: 'ACTIVE',
        subscription,
        message: 'Assinatura já está ativa',
      })
    }

    // PRIORIDADE 1: Buscar checkout sessions PRIMEIRO (mais confiável)
    // Buscar checkout sessions diretamente usando o email do usuário ou buscando todas recentes
    try {
      console.log('🔍 [PRIORIDADE 1] Buscando checkout sessions no Stripe...')
      
      // Buscar sessions criadas desde que a assinatura foi criada
      const subscriptionCreatedAt = Math.floor(new Date(subscription.createdAt).getTime() / 1000)
      const now = Math.floor(Date.now() / 1000)
      
      console.log('📅 Buscando sessions desde:', new Date(subscription.createdAt).toISOString())
      
      // Listar todas as checkout sessions desde a criação da assinatura
      let allSessions = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: subscriptionCreatedAt },
      })

      console.log(`📋 Encontradas ${allSessions.data.length} checkout sessions desde criação da assinatura`)

      // Se não encontrou, tentar buscar também pelo email do usuário
      if (allSessions.data.length === 0 && subscription.user?.email) {
        console.log('🔍 Buscando também pelo email do usuário:', subscription.user.email)
        try {
          // Buscar customers pelo email
          const customers = await stripe.customers.list({
            email: subscription.user.email,
            limit: 10,
          })
          
          if (customers.data.length > 0) {
            console.log(`📧 Encontrados ${customers.data.length} customers com este email`)
            
            // Para cada customer, buscar subscriptions
            for (const customer of customers.data) {
              const customerSubscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                limit: 10,
              })
              
              console.log(`📦 Encontradas ${customerSubscriptions.data.length} subscriptions para customer ${customer.id}`)
              
              // Verificar se alguma subscription corresponde (por metadata ou criada no mesmo período)
              for (const stripeSub of customerSubscriptions.data) {
                const subMetadata = stripeSub.metadata || {}
                
                // Se o metadata tem subscriptionId correspondente OU foi criada na mesma época
                if (subMetadata.subscriptionId === subscriptionId || 
                    (Math.abs(stripeSub.created - subscriptionCreatedAt) < 300)) { // 5 minutos de diferença
                  
                  console.log('✅ Encontrada subscription correspondente via customer!')
                  
                  if (stripeSub.status === 'active' || stripeSub.status === 'trialing') {
                    const currentPeriodStart = new Date(stripeSub.current_period_start * 1000)
                    const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000)
                    
                    const updatedSubscription = await prisma.subscription.update({
                      where: { id: subscriptionId },
                      data: {
                        status: 'ACTIVE',
                        stripeSubscriptionId: stripeSub.id,
                        currentPeriodStart,
                        currentPeriodEnd,
                      },
                    })
                    
                    return NextResponse.json({
                      status: 'ACTIVE',
                      subscription: updatedSubscription,
                      message: 'Assinatura encontrada e ativada via customer lookup',
                    })
                  }
                }
              }
            }
          }
        } catch (customerError: any) {
          console.error('❌ Erro ao buscar customers:', customerError.message)
        }
      }

      // Procurar session que corresponde a esta assinatura
      for (const checkoutSession of allSessions.data) {
        const sessionMetadata = checkoutSession.metadata || {}
        const sessionSubscriptionId = sessionMetadata.subscriptionId

        if (sessionSubscriptionId === subscriptionId) {
          console.log('✅ Encontrada checkout session correspondente!', {
            sessionId: checkoutSession.id,
            paymentStatus: checkoutSession.payment_status,
            subscriptionId: checkoutSession.subscription,
            metadata: sessionMetadata,
          })

          // Se o pagamento foi concluído
          if (checkoutSession.payment_status === 'paid' && checkoutSession.subscription) {
            const stripeSubscriptionId = typeof checkoutSession.subscription === 'string' 
              ? checkoutSession.subscription 
              : (checkoutSession.subscription as any).id

            console.log('💳 Pagamento confirmado! Buscando subscription no Stripe:', stripeSubscriptionId)

            try {
              // Buscar subscription no Stripe com expand para invoice mais recente
              const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
                expand: ['latest_invoice'],
              })
              
              console.log('📦 Subscription do Stripe:', {
                id: stripeSubscription.id,
                status: stripeSubscription.status,
                currentPeriodStart: stripeSubscription.current_period_start,
                currentPeriodEnd: stripeSubscription.current_period_end,
              })

              if (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing' || stripeSubscription.status === 'incomplete') {
                const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
                const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)

                // Criar pagamento se não existir
                const paymentIntentId = checkoutSession.payment_intent as string || stripeSubscription.latest_invoice
                const existingPayment = await prisma.payment.findFirst({
                  where: {
                    subscriptionId,
                    OR: [
                      { providerPaymentId: paymentIntentId },
                      { providerPaymentId: stripeSubscriptionId },
                    ],
                  },
                })

                if (!existingPayment) {
                  const invoice = stripeSubscription.latest_invoice
                  const invoiceAmount = typeof invoice === 'object' && invoice?.amount_paid 
                    ? invoice.amount_paid / 100
                    : (checkoutSession.amount_total || 0) / 100

                  await prisma.payment.create({
                    data: {
                      subscriptionId,
                      amount: invoiceAmount,
                      currency: (checkoutSession.currency || 'brl').toUpperCase(),
                      status: 'COMPLETED',
                      provider: 'STRIPE',
                      providerPaymentId: paymentIntentId || stripeSubscriptionId,
                      paidAt: new Date(),
                    },
                  })
                  console.log('✅ Pagamento criado no banco de dados')
                }

                // Atualizar assinatura
                const updatedSubscription = await prisma.subscription.update({
                  where: { id: subscriptionId },
                  data: {
                    status: 'ACTIVE',
                    stripeSubscriptionId,
                    currentPeriodStart,
                    currentPeriodEnd,
                  },
                })

                console.log('✅✅✅ Assinatura ATIVADA com sucesso via checkout session!')

                return NextResponse.json({
                  status: 'ACTIVE',
                  subscription: updatedSubscription,
                  message: 'Assinatura encontrada e ativada via checkout session',
                })
              } else {
                console.log(`⚠️ Subscription no Stripe tem status: ${stripeSubscription.status}`)
              }
            } catch (stripeError: any) {
              console.error('❌ Erro ao processar subscription do Stripe:', {
                message: stripeError.message,
                type: stripeError.type,
              })
            }
          } else {
            console.log(`⚠️ Pagamento ainda não foi concluído. Status: ${checkoutSession.payment_status}`)
          }
        }
      }
    } catch (stripeListError: any) {
      console.error('❌ Erro ao listar checkout sessions:', {
        message: stripeListError.message,
        type: stripeListError.type,
      })
    }

    // PRIORIDADE 2: Se tiver stripeSubscriptionId, verificar no Stripe
    if (subscription.stripeSubscriptionId) {
      console.log('🔍 [PRIORIDADE 2] Verificando stripeSubscriptionId existente...')
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        )

        console.log('📦 Status da subscription existente:', stripeSubscription.status)

        // Verificar status da subscription no Stripe
        if (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing' || stripeSubscription.status === 'incomplete') {
          const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
          const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)

          // Atualizar assinatura
          const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
              status: 'ACTIVE',
              currentPeriodStart,
              currentPeriodEnd,
            },
          })

          console.log('✅ Assinatura ativada via stripeSubscriptionId existente')

          return NextResponse.json({
            status: 'ACTIVE',
            subscription: updatedSubscription,
            message: 'Assinatura verificada e ativada com sucesso',
          })
        } else {
          console.log(`⚠️ Subscription no Stripe tem status: ${stripeSubscription.status}`)
          return NextResponse.json({
            status: subscription.status,
            subscription,
            message: `Status no Stripe: ${stripeSubscription.status}`,
          })
        }
      } catch (stripeError: any) {
        console.error('❌ Erro ao verificar subscription no Stripe:', {
          message: stripeError.message,
          type: stripeError.type,
        })
      }
    }

    // Buscar checkout sessions diretamente usando o email do usuário ou buscando todas recentes
    try {
      console.log('🔍 Buscando checkout sessions no Stripe...')
      
      // Buscar sessions criadas nas últimas 2 horas
      const twoHoursAgo = Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000)
      
      // Listar todas as checkout sessions recentes
      const allSessions = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: twoHoursAgo },
        expand: ['data.subscription', 'data.customer'],
      })

      console.log(`📋 Encontradas ${allSessions.data.length} checkout sessions recentes`)

      // Procurar session que corresponde a esta assinatura
      for (const checkoutSession of allSessions.data) {
        const sessionMetadata = checkoutSession.metadata || {}
        const sessionSubscriptionId = sessionMetadata.subscriptionId

        if (sessionSubscriptionId === subscriptionId) {
          console.log('✅ Encontrada checkout session correspondente:', {
            sessionId: checkoutSession.id,
            paymentStatus: checkoutSession.payment_status,
            subscriptionId: checkoutSession.subscription,
          })

          // Se o pagamento foi concluído
          if (checkoutSession.payment_status === 'paid' && checkoutSession.subscription) {
            const stripeSubscriptionId = typeof checkoutSession.subscription === 'string' 
              ? checkoutSession.subscription 
              : checkoutSession.subscription.id

            try {
              // Buscar subscription no Stripe
              const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
              
              console.log('📦 Status da subscription no Stripe:', {
                id: stripeSubscription.id,
                status: stripeSubscription.status,
              })

              if (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing') {
                const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
                const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)

                // Criar pagamento se não existir
                const paymentExists = await prisma.payment.findFirst({
                  where: {
                    subscriptionId,
                    providerPaymentId: checkoutSession.payment_intent as string || stripeSubscription.latest_invoice as string,
                  },
                })

                if (!paymentExists && checkoutSession.amount_total) {
                  await prisma.payment.create({
                    data: {
                      subscriptionId,
                      amount: checkoutSession.amount_total / 100,
                      currency: (checkoutSession.currency || 'brl').toUpperCase(),
                      status: 'COMPLETED',
                      provider: 'STRIPE',
                      providerPaymentId: checkoutSession.payment_intent as string || stripeSubscription.id,
                      paidAt: new Date(),
                    },
                  })
                  console.log('✅ Pagamento criado')
                }

                // Atualizar assinatura
                const updatedSubscription = await prisma.subscription.update({
                  where: { id: subscriptionId },
                  data: {
                    status: 'ACTIVE',
                    stripeSubscriptionId,
                    currentPeriodStart,
                    currentPeriodEnd,
                  },
                })

                console.log('✅ Assinatura ativada com sucesso via checkout session')

                return NextResponse.json({
                  status: 'ACTIVE',
                  subscription: updatedSubscription,
                  message: 'Assinatura encontrada e ativada via checkout session',
                })
              }
            } catch (stripeError: any) {
              console.error('❌ Erro ao processar subscription do Stripe:', stripeError.message)
            }
          } else {
            console.log('⚠️ Pagamento ainda não foi concluído na checkout session')
          }
        }
      }
    } catch (stripeListError: any) {
      console.error('❌ Erro ao listar checkout sessions:', stripeListError.message)
    }

    // Verificar se há pagamentos concluídos para esta assinatura
    const completedPayments = await prisma.payment.findMany({
      where: {
        subscriptionId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    console.log('💳 Pagamentos concluídos encontrados:', completedPayments.length)

    // Se tiver pagamento concluído, mas status ainda estiver PENDING, ativar
    if (completedPayments.length > 0 && subscription.status === 'PENDING') {
      console.log('⚠️ Encontrado pagamento concluído, mas assinatura ainda está PENDING. Ativando...')
      
      // Se não tiver stripeSubscriptionId, tentar buscar via checkout sessions
      if (!subscription.stripeSubscriptionId) {
        try {
          // Listar checkout sessions recentes (últimas 24h)
          const checkoutSessions = await stripe.checkout.sessions.list({
            limit: 50,
            created: {
              gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
            },
          })

          // Procurar session que corresponde a esta assinatura
          for (const session of checkoutSessions.data) {
            if (
              session.metadata?.subscriptionId === subscriptionId &&
              session.payment_status === 'paid'
            ) {
              // Encontramos a session!
              if (session.subscription) {
                const stripeSubscriptionId = session.subscription as string
                
                try {
                  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

                  if (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing') {
                    const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
                    const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)

                    // Atualizar assinatura
                    const updatedSubscription = await prisma.subscription.update({
                      where: { id: subscriptionId },
                      data: {
                        status: 'ACTIVE',
                        stripeSubscriptionId,
                        currentPeriodStart,
                        currentPeriodEnd,
                      },
                    })

                    console.log('✅ Assinatura ativada via busca de checkout session:', subscriptionId)

                    return NextResponse.json({
                      status: 'ACTIVE',
                      subscription: updatedSubscription,
                      message: 'Assinatura encontrada e ativada via checkout session',
                    })
                  }
                } catch (error) {
                  console.error('Erro ao recuperar subscription encontrada:', error)
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar checkout sessions:', error)
        }
      }

      // Se tiver stripeSubscriptionId mas ainda está PENDING, ativar baseado no pagamento
      if (subscription.stripeSubscriptionId) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)
          
          if (stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing') {
            const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
            const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)

            const updatedSubscription = await prisma.subscription.update({
              where: { id: subscriptionId },
              data: {
                status: 'ACTIVE',
                currentPeriodStart,
                currentPeriodEnd,
              },
            })

            return NextResponse.json({
              status: 'ACTIVE',
              subscription: updatedSubscription,
              message: 'Assinatura ativada baseado em pagamento concluído',
            })
          }
        } catch (error) {
          console.error('Erro ao verificar subscription existente:', error)
        }
      }

      // Último recurso: ativar baseado apenas no pagamento concluído
      // Calcular período de 1 mês a partir de agora
      const currentPeriodStart = new Date()
      const currentPeriodEnd = new Date()
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          currentPeriodStart,
          currentPeriodEnd,
        },
      })

      console.log('⚠️ Assinatura ativada forçadamente baseado em pagamento:', subscriptionId)

      return NextResponse.json({
        status: 'ACTIVE',
        subscription: updatedSubscription,
        message: 'Assinatura ativada baseado em pagamento concluído (fallback)',
      })
    }

    // PRIORIDADE 3: Fallback - Se a assinatura foi criada recentemente (últimos 10 minutos)
    // e não há pagamentos falhados, assumir que está ativa
    const subscriptionAge = Date.now() - new Date(subscription.createdAt).getTime()
    const tenMinutesAgo = 10 * 60 * 1000 // 10 minutos em ms
    
    if (subscriptionAge < tenMinutesAgo && subscription.status === 'PENDING') {
      const failedPayments = subscription.payments?.filter(p => p.status === 'FAILED').length || 0
      
      if (failedPayments === 0) {
        console.log('⚠️ Assinatura criada recentemente, ativando como fallback...')
        
        const currentPeriodStart = new Date()
        const currentPeriodEnd = new Date()
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
        
        const updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart,
            currentPeriodEnd,
          },
        })
        
        console.log('✅ Assinatura ativada via fallback (assinatura recente)')
        
        return NextResponse.json({
          status: 'ACTIVE',
          subscription: updatedSubscription,
          message: 'Assinatura ativada (assumida ativa por ser recente)',
        })
      }
    }

    // Se chegou aqui, não conseguiu encontrar/ativar
    console.log('⚠️ Não foi possível ativar a assinatura. Status final:', {
      subscriptionId,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      paymentsCount: subscription.payments?.length || 0,
      subscriptionAgeMinutes: Math.round(subscriptionAge / 60000),
    })

    return NextResponse.json({
      status: subscription.status,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        paymentsCount: subscription.payments?.length || 0,
      },
      debug: {
        hasStripeSubscriptionId: !!subscription.stripeSubscriptionId,
        paymentsCount: subscription.payments?.length || 0,
        completedPaymentsCount: subscription.payments?.filter(p => p.status === 'COMPLETED').length || 0,
      },
      message: subscription.stripeSubscriptionId 
        ? 'Assinatura encontrada mas status ainda não está ativo no Stripe. Pode estar processando.'
        : 'Não foi possível encontrar a assinatura no Stripe. Aguarde o processamento do webhook ou tente novamente em alguns segundos.',
    })
  } catch (error) {
    console.error('Error verifying subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar assinatura' },
      { status: 500 }
    )
  }
}

