import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get user profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        username: true,
        role: true,
        creatorProfile: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            coverImage: true,
            socialLinks: true,
            bio: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        ...user,
        creatorProfile: user.creatorProfile ? {
          ...user.creatorProfile,
          socialLinks: user.creatorProfile.socialLinks 
            ? JSON.parse(user.creatorProfile.socialLinks) 
            : null,
        } : null,
      },
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, bio, avatar, username, creatorProfile } = body

    // Build update data
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (avatar !== undefined) updateData.avatar = avatar
    if (username !== undefined) {
      // Check if username is already taken
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: username,
            id: { not: session.user.id },
          },
        })
        
        if (existingUser) {
          return NextResponse.json(
            { error: 'Este nome de usuário já está em uso' },
            { status: 409 }
          )
        }
      }
      updateData.username = username
    }

    // Update user (bio is saved here, as it's in the User model)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        username: true,
      },
    })

    // Update creator profile if user is a creator and data provided
    // Note: bio is stored in User model, not CreatorProfile
    if (session.user.role === 'CREATOR' && creatorProfile) {
      const creator = await prisma.creatorProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (creator) {
        const creatorUpdateData: any = {}
        
        if (creatorProfile.displayName !== undefined) {
          creatorUpdateData.displayName = creatorProfile.displayName
        }
        if (creatorProfile.slug !== undefined) {
          // Check if slug is available
          if (creatorProfile.slug) {
            const existingCreator = await prisma.creatorProfile.findFirst({
              where: {
                slug: creatorProfile.slug,
                id: { not: creator.id },
              },
            })
            
            if (existingCreator) {
              return NextResponse.json(
                { error: 'Esta URL já está em uso' },
                { status: 409 }
              )
            }
          }
          creatorUpdateData.slug = creatorProfile.slug
        }
        // Bio is stored in User model, not CreatorProfile - already updated above
        if (creatorProfile.coverImage !== undefined) {
          creatorUpdateData.coverImage = creatorProfile.coverImage
        }
        if (creatorProfile.socialLinks !== undefined) {
          // Filter out empty strings
          const filteredLinks: any = {}
          Object.entries(creatorProfile.socialLinks).forEach(([key, value]) => {
            if (value && typeof value === 'string' && value.trim()) {
              filteredLinks[key] = value.trim()
            }
          })
          // Only update if there are any links, or set to empty JSON object to clear
          creatorUpdateData.socialLinks = JSON.stringify(
            Object.keys(filteredLinks).length > 0 ? filteredLinks : {}
          )
        }

        if (Object.keys(creatorUpdateData).length > 0) {
          await prisma.creatorProfile.update({
            where: { userId: session.user.id },
            data: creatorUpdateData,
          })
        }
      }
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PROFILE_UPDATED',
          entity: 'User',
          entityId: session.user.id,
          metadata: JSON.stringify({ updatedFields: Object.keys(updateData) }),
        },
      })
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}

