import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

// GET - Get PIX payment details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
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
    const mpPaymentId = params.paymentId

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json({
        error: 'MERCADOPAGO_ACCESS_TOKEN não configurado',
      }, { status: 500 })
    }

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: {
        subscriptionId,
        providerPaymentId: mpPaymentId,
        provider: 'MERCADOPAGO',
      },
      include: {
        subscription: {
          include: {
            plan: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (payment.subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Fetch payment details from Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    })

    const mpPayment = new Payment(client)
    const paymentDetails = await mpPayment.get({ id: parseInt(mpPaymentId) })

    if (!paymentDetails) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado no Mercado Pago' },
        { status: 404 }
      )
    }

    const pixData = paymentDetails.point_of_interaction?.transaction_data

    return NextResponse.json({
      paymentId: mpPaymentId,
      status: paymentDetails.status || payment.status,
      amount: payment.amount,
      qrCode: pixData?.qr_code || null,
      qrCodeBase64: pixData?.qr_code_base64 || null,
      ticketUrl: pixData?.ticket_url || null,
    })
  } catch (error: any) {
    console.error('Error fetching payment details:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar detalhes do pagamento' },
      { status: 500 }
    )
  }
}

