import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validations/auth'
import { hashPassword } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password, ageVerification, userType } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate slug for creator profile if userType is CREATOR
    let creatorSlug: string | null = null
    if (userType === 'CREATOR') {
      // Generate slug from name
      const baseSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      
      // Check if slug exists and append number if needed
      let slug = baseSlug
      let counter = 1
      while (await prisma.creatorProfile.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
      creatorSlug = slug
    }

    // Create user with the selected role
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        ageVerified: ageVerification,
        role: userType, // CREATOR or USER
        // Create creator profile automatically if userType is CREATOR
        ...(userType === 'CREATOR' && creatorSlug && {
          creatorProfile: {
            create: {
              displayName: name,
              slug: creatorSlug,
            },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entity: 'User',
          entityId: user.id,
          metadata: JSON.stringify({ method: 'credentials', userType }),
        },
      })
    } catch (auditError) {
      // Log error but don't fail registration
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json(
      { message: 'Cadastro realizado com sucesso', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

