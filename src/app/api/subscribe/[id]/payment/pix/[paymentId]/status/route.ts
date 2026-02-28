import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get PIX payment status
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
    const paymentId = params.paymentId

    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: {
        subscriptionId,
        providerPaymentId: paymentId,
        provider: 'MERCADOPAGO',
      },
      include: {
        subscription: {
          include: {
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

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      paidAt: payment.paidAt,
    })
  } catch (error) {
    console.error('Error fetching payment status:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status do pagamento' },
      { status: 500 }
    )
  }
}

