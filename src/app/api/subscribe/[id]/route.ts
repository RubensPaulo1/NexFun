import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get subscription by ID
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

    const subscriptionId = params.id

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            interval: true,
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            slug: true,
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

    // Verificar se a assinatura pertence ao usuário
    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        creator: subscription.creator,
      },
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assinatura' },
      { status: 500 }
    )
  }
}
