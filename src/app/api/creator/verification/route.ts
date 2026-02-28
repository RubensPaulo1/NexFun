import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { generateCreatorContract } from '@/lib/contract-generator'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Custom URL validation that accepts both absolute and relative URLs
const urlSchema = z.string().refine(
  (val) => {
    // Accept absolute URLs (http://, https://)
    if (val.startsWith('http://') || val.startsWith('https://')) {
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    }
    // Accept relative URLs starting with /
    if (val.startsWith('/')) {
      return true
    }
    return false
  },
  { message: 'URL inválida' }
)

const verificationRequestSchema = z.object({
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  rg: z.string().min(5, 'RG inválido'),
  rgIssuer: z.string().optional().transform(val => val === '' ? undefined : val),
  birthDate: z.string().optional().transform(val => val === '' ? undefined : val),
  documentFrontUrl: urlSchema,
  documentBackUrl: urlSchema,
  selfieUrl: urlSchema,
})

// POST - Create verification request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    })

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Você precisa ser um criador para solicitar verificação' },
        { status: 403 }
      )
    }

    // Get or create creator profile
    let creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: { verificationRequest: true },
    })

    // If no profile exists but user is CREATOR, create one automatically
    if (!creator) {
      // Generate slug from name
      const baseSlug = (user.name || 'criador')
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

      creator = await prisma.creatorProfile.create({
        data: {
          userId: session.user.id,
          displayName: user.name || 'Criador',
          slug,
        },
        include: { verificationRequest: true },
      })
    }

    // Check if already verified
    if (creator.isVerified) {
      return NextResponse.json(
        { error: 'Seu perfil já está verificado' },
        { status: 400 }
      )
    }

    // Check if there's a pending request
    if (creator.verificationRequest?.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Você já possui uma solicitação de verificação pendente' },
        { status: 400 }
      )
    }

    const body = await req.json()

    // Validate input
    const result = verificationRequestSchema.safeParse(body)
    if (!result.success) {
      console.error('Validation error:', result.error.flatten())
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: result.error.flatten(),
          message: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      )
    }

    const { fullName, cpf, rg, rgIssuer, birthDate, documentFrontUrl, documentBackUrl, selfieUrl } = result.data

    // Transform empty strings to null for optional fields
    const processedRgIssuer = rgIssuer && rgIssuer.trim() !== '' ? rgIssuer : null
    const processedBirthDate = birthDate && birthDate.trim() !== '' ? birthDate : null

    // Create or update verification request
    let verificationRequest
    try {
      verificationRequest = await prisma.verificationRequest.upsert({
        where: { creatorId: creator.id },
        update: {
          fullName,
          cpf: cpf.replace(/\D/g, ''), // Remove non-digits
          rg: rg.replace(/\D/g, ''),
          rgIssuer: processedRgIssuer,
          birthDate: processedBirthDate,
          documentFrontUrl,
          documentBackUrl,
          selfieUrl,
          status: 'PENDING',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          updatedAt: new Date(),
        },
        create: {
          creatorId: creator.id,
          fullName,
          cpf: cpf.replace(/\D/g, ''),
          rg: rg.replace(/\D/g, ''),
          rgIssuer: processedRgIssuer,
          birthDate: processedBirthDate,
          documentFrontUrl,
          documentBackUrl,
          selfieUrl,
          status: 'PENDING',
        },
      })
    } catch (dbError: any) {
      console.error('Database error creating verification request:', dbError)
      // If table doesn't exist, provide helpful error
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Tabela de verificação não encontrada. Execute: npx prisma db push',
            details: 'A tabela verification_requests precisa ser criada no banco de dados.'
          },
          { status: 500 }
        )
      }
      throw dbError
    }

    // Get user data for contract
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
      },
    })

    // Generate and save contract
    let contractUrl: string | null = null
    try {
      const contractHtml = generateCreatorContract({
        creatorName: creator.displayName,
        creatorEmail: userData?.email || '',
        fullName,
        cpf: cpf.replace(/\D/g, ''),
        rg: rg.replace(/\D/g, ''),
        rgIssuer: processedRgIssuer,
        birthDate: processedBirthDate,
        signedAt: new Date(),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      })

      // Save contract HTML to file
      const contractsDir = path.join(process.cwd(), 'public', 'contracts')
      if (!existsSync(contractsDir)) {
        await mkdir(contractsDir, { recursive: true })
      }

      const contractFileName = `contract-${creator.id}-${Date.now()}.html`
      const contractFilePath = path.join(contractsDir, contractFileName)
      await writeFile(contractFilePath, contractHtml, 'utf-8')

      contractUrl = `/contracts/${contractFileName}`

      // Save contract record in database
      await prisma.creatorContract.upsert({
        where: { creatorId: creator.id },
        update: {
          contractHtml,
          contractUrl,
          signedAt: new Date(),
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
          userAgent: req.headers.get('user-agent') || null,
          updatedAt: new Date(),
        },
        create: {
          creatorId: creator.id,
          contractHtml,
          contractUrl,
          signedAt: new Date(),
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
          userAgent: req.headers.get('user-agent') || null,
          contractVersion: '1.0',
        },
      })
    } catch (contractError: any) {
      console.error('Error generating contract:', contractError)
      // Continue even if contract generation fails - verification request is still created
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'VERIFICATION_REQUESTED',
          entity: 'VerificationRequest',
          entityId: verificationRequest.id,
          metadata: JSON.stringify({ creatorId: creator.id, contractGenerated: !!contractUrl }),
        },
      })
    } catch (e) {
      console.error('Audit log error:', e)
    }

    return NextResponse.json({
      message: 'Solicitação de verificação enviada com sucesso',
      verificationRequest: {
        id: verificationRequest.id,
        status: verificationRequest.status,
        createdAt: verificationRequest.createdAt,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating verification request:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao enviar solicitação de verificação',
        details: error.message || 'Erro desconhecido',
        code: error.code
      },
      { status: 500 }
    )
  }
}

// GET - Get current user's verification status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    })

    if (!user || user.role !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Perfil de criador não encontrado' },
        { status: 404 }
      )
    }

    // Get or create creator profile
    let creator = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: { verificationRequest: true },
    })

    // If no profile exists but user is CREATOR, create one automatically
    if (!creator) {
      // Generate slug from name
      const baseSlug = (user.name || 'criador')
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

      creator = await prisma.creatorProfile.create({
        data: {
          userId: session.user.id,
          displayName: user.name || 'Criador',
          slug,
        },
        include: { verificationRequest: true },
      })
    }

    return NextResponse.json({
      isVerified: creator.isVerified,
      verificationRequest: creator.verificationRequest
        ? {
            id: creator.verificationRequest.id,
            status: creator.verificationRequest.status,
            rejectionReason: creator.verificationRequest.rejectionReason,
            createdAt: creator.verificationRequest.createdAt,
            reviewedAt: creator.verificationRequest.reviewedAt,
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching verification status:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status de verificação' },
      { status: 500 }
    )
  }
}

