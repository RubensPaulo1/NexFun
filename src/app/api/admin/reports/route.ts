import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Get all reports (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where = {
      ...(status && { status: status as any }),
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          target: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar denúncias' },
      { status: 500 }
    )
  }
}

// PATCH - Update report status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { reportId, status, resolution } = body

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'ID da denúncia e status são obrigatórios' },
        { status: 400 }
      )
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolution,
        resolvedBy: session.user.id,
        resolvedAt: ['RESOLVED', 'DISMISSED'].includes(status) ? new Date() : null,
      },
    })

    // Notify the report sender
    await prisma.notification.create({
      data: {
        userId: report.senderId,
        type: 'REPORT_UPDATE',
        title: 'Atualização da sua denúncia',
        message: `Sua denúncia foi ${status === 'RESOLVED' ? 'resolvida' : status === 'DISMISSED' ? 'arquivada' : 'atualizada'}`,
        data: { reportId: report.id },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REPORT_UPDATED',
        entity: 'Report',
        entityId: report.id,
        metadata: JSON.stringify({ status, resolution }),
      },
    })

    return NextResponse.json({
      message: 'Denúncia atualizada com sucesso',
      report,
    })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar denúncia' },
      { status: 500 }
    )
  }
}

