import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get creator's earnings
export async function GET(req: NextRequest) {
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
      select: { id: true },
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Perfil de criador não encontrado' },
        { status: 404 }
      )
    }

    // Get all payments
    const allPayments = await prisma.payment.findMany({
      where: {
        subscription: {
          creatorId: creator.id,
        },
      },
      include: {
        subscription: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totalEarnings = allPayments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const thisMonthEarnings = allPayments
      .filter((p) => p.status === 'COMPLETED' && p.createdAt >= startOfMonth)
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const pendingEarnings = allPayments
      .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    // Available earnings = total - pending payouts
    const pendingPayouts = payouts
      .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + p.amount, 0)
    
    const availableEarnings = totalEarnings - pendingPayouts

    // Get payouts
    const payouts = await prisma.payout.findMany({
      where: {
        creatorId: creator.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format transactions
    const transactions = allPayments.slice(0, 50).map((payment) => ({
      id: payment.id,
      type: 'subscription' as const,
      user: payment.subscription.user.name || 'Usuário',
      plan: payment.subscription.plan.name,
      amount: payment.amount,
      date: payment.createdAt,
      status: payment.status,
    }))

    // Add payout transactions
    payouts.forEach((payout) => {
      transactions.push({
        id: payout.id,
        type: 'payout' as const,
        user: 'Saque',
        plan: '',
        amount: -payout.amount,
        date: payout.createdAt,
        status: payout.status,
      })
    })

    // Sort by date
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      stats: {
        totalEarnings,
        thisMonthEarnings,
        pendingEarnings,
        availableEarnings,
      },
      transactions: transactions.slice(0, 50),
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        requestedAt: p.createdAt,
        completedAt: p.processedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching earnings:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ganhos' },
      { status: 500 }
    )
  }
}

