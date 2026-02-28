import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCreatorProfileSchema } from '@/lib/validations/creator'
import prisma from '@/lib/prisma'

// GET - List all active creators
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // SQLite doesn't support case-insensitive search natively
    // We'll fetch all active creators and filter in memory for case-insensitive search
    const baseWhere = {
      isActive: true,
    }

    // Fetch all active creators first
    const allCreators = await prisma.creatorProfile.findMany({
      where: baseWhere,
      include: {
        user: {
          select: {
            avatar: true,
            bio: true,
          },
        },
        plans: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            subscribers: true,
            posts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by search term (case-insensitive)
    let filteredCreators = allCreators
    if (search) {
      const searchLower = search.toLowerCase().trim()
      filteredCreators = allCreators.filter((creator) => {
        const displayNameLower = creator.displayName.toLowerCase()
        const slugLower = creator.slug.toLowerCase()
        return (
          displayNameLower.includes(searchLower) ||
          slugLower.includes(searchLower)
        )
      })
    }

    // Apply pagination
    const total = filteredCreators.length
    const creators = filteredCreators.slice(skip, skip + limit)

    return NextResponse.json({
      creators,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching creators:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar criadores' },
      { status: 500 }
    )
  }
}

// POST - Create creator profile
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Check if user already has a creator profile
    const existingProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Você já possui um perfil de criador' },
        { status: 409 }
      )
    }

    const body = await req.json()
    
    // Validate input
    const result = createCreatorProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { displayName, slug, bio, socialLinks } = result.data

    // Check if slug is already taken
    const existingSlug = await prisma.creatorProfile.findUnique({
      where: { slug },
    })

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Esta URL já está em uso' },
        { status: 409 }
      )
    }

    // Create creator profile and update user role
    const [creatorProfile] = await prisma.$transaction([
      prisma.creatorProfile.create({
        data: {
          userId: session.user.id,
          displayName,
          slug,
          socialLinks: socialLinks || {},
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          role: 'CREATOR',
          bio,
        },
      }),
    ])

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATOR_PROFILE_CREATED',
        entity: 'CreatorProfile',
        entityId: creatorProfile.id,
      },
    })

    return NextResponse.json(
      { message: 'Perfil de criador criado com sucesso', creatorProfile },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating creator profile:', error)
    return NextResponse.json(
      { error: 'Erro ao criar perfil de criador' },
      { status: 500 }
    )
  }
}

