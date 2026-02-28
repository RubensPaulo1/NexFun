import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

// GET - Download creator contract (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Get user and creator profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        creatorProfile: {
          include: {
            contract: true,
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

    if (!user.creatorProfile) {
      return NextResponse.json(
        { error: 'Este usuário não é um criador' },
        { status: 400 }
      )
    }

    if (!user.creatorProfile.contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado para este criador' },
        { status: 404 }
      )
    }

    const contract = user.creatorProfile.contract

    // Return contract HTML
    return new NextResponse(contract.contractHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="contrato-${user.name || user.email}-${contract.id}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Error downloading contract:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao baixar contrato' },
      { status: 500 }
    )
  }
}




