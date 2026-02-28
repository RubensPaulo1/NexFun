import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get creator's subscribers
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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'ACTIVE'
    const search = searchParams.get('search') || ''

    // Get subscriptions
    let subscriptions = await prisma.subscription.findMany({
      where: {
        creatorId: creator.id,
        ...(status !== 'ALL' && { status }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by search term (case-insensitive)
    if (search) {
      const searchLower = search.toLowerCase()
      subscriptions = subscriptions.filter((sub) => {
        const name = sub.user.name?.toLowerCase() || ''
        const email = sub.user.email.toLowerCase()
        return name.includes(searchLower) || email.includes(searchLower)
      })
    }

    // Get stats
    const totalSubscribers = await prisma.subscription.count({
      where: {
        creatorId: creator.id,
        status: 'ACTIVE',
      },
    })

    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const newThisMonth = await prisma.subscription.count({
      where: {
        creatorId: creator.id,
        status: 'ACTIVE',
        createdAt: {
          gte: thisMonthStart,
        },
      },
    })

    // Calculate monthly revenue (price is stored in cents, so divide by 100)
    const monthlyRevenue = subscriptions
      .filter((sub) => sub.status === 'ACTIVE')
      .reduce((sum, sub) => sum + ((sub.plan.price || 0) / 100), 0)

    return NextResponse.json({
      subscribers: subscriptions.map((sub) => ({
        id: sub.id,
        name: sub.user.name || 'Usuário',
        email: sub.user.email,
        avatar: sub.user.avatar,
        plan: sub.plan.name,
        planPrice: sub.plan.price,
        subscribedAt: sub.createdAt,
        status: sub.status,
      })),
      stats: {
        total: totalSubscribers,
        newThisMonth,
        monthlyRevenue,
        retentionRate: 0, // TODO: Calculate retention rate
      },
    })
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assinantes' },
      { status: 500 }
    )
  }
}


