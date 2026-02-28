'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  FileText,
  User,
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'

interface VerificationStatus {
  isVerified: boolean
  verificationRequest: {
    id: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    rejectionReason: string | null
    createdAt: string
    reviewedAt: string | null
  } | null
}

interface FormData {
  fullName: string
  cpf: string
  rg: string
  rgIssuer: string
  birthDate: string
  documentFrontUrl: string
  documentBackUrl: string
  selfieUrl: string
}

const initialFormData: FormData = {
  fullName: '',
  cpf: '',
  rg: '',
  rgIssuer: '',
  birthDate: '',
  documentFrontUrl: '',
  documentBackUrl: '',
  selfieUrl: '',
}

export default function VerificationPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/creator/verification')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'documentFrontUrl' | 'documentBackUrl' | 'selfieUrl'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Apenas imagens são permitidas',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'Arquivo muito grande. Máximo 10MB.',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploadingField(field)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/upload/local', {
        method: 'POST',
        body: formDataUpload,
      })

      if (!response.ok) {
        throw new Error('Erro no upload')
      }

      const result = await response.json()
      setFormData((prev) => ({ ...prev, [field]: result.fileUrl }))

      toast({
        title: 'Upload concluído',
        description: 'Documento enviado com sucesso.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar documento.',
        variant: 'destructive',
      })
    } finally {
      setUploadingField(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.fullName || !formData.cpf || !formData.rg || !formData.documentFrontUrl || !formData.documentBackUrl || !formData.selfieUrl) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos e envie todos os documentos.',
        variant: 'destructive',
      })
      return
    }

    // Validate CPF format
    const cpfDigits = formData.cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      toast({
        title: 'Erro',
        description: 'CPF inválido.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/creator/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        // Show detailed validation errors if available
        if (error.details) {
          const fieldErrors = Object.entries(error.details.fieldErrors || {})
            .map(([field, errors]: [string, any]) => {
              const fieldName = field === 'documentFrontUrl' ? 'Frente do documento' :
                               field === 'documentBackUrl' ? 'Verso do documento' :
                               field === 'selfieUrl' ? 'Selfie com documento' :
                               field === 'fullName' ? 'Nome completo' :
                               field === 'cpf' ? 'CPF' :
                               field === 'rg' ? 'RG' :
                               field === 'rgIssuer' ? 'Órgão emissor' :
                               field === 'birthDate' ? 'Data de nascimento' : field
              return `${fieldName}: ${Array.isArray(errors) ? errors.join(', ') : errors}`
            })
            .join('\n')
          throw new Error(error.message || fieldErrors || error.error || 'Dados inválidos. Verifique os campos.')
        }
        throw new Error(error.message || error.error || 'Erro ao enviar solicitação')
      }

      toast({
        title: 'Solicitação Enviada! 🎉',
        description: 'Aguarde a análise da equipe. Você será notificado.',
        variant: 'success',
      })

      fetchStatus()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao enviar solicitação.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  // Already verified
  if (status?.isVerified) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="font-headline text-display-sm text-deep-navy mb-2">
              Perfil Verificado! ✅
            </h2>
            <p className="text-body-md text-graphite/60 mb-6">
              Seu perfil já possui o selo de verificação. Seus seguidores podem confiar que você é autêntico.
            </p>
            <Link href="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending request
  if (status?.verificationRequest?.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="font-headline text-display-sm text-deep-navy mb-2">
              Aguardando Análise
            </h2>
            <p className="text-body-md text-graphite/60 mb-4">
              Sua solicitação de verificação está sendo analisada pela nossa equipe.
              Você será notificado assim que tivermos uma resposta.
            </p>
            <p className="text-caption text-graphite/50 mb-6">
              Enviado em: {formatDate(status.verificationRequest.createdAt)}
            </p>
            <Link href="/dashboard">
              <Button variant="outline">Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Rejected - can try again
  const wasRejected = status?.verificationRequest?.status === 'REJECTED'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-display-sm text-deep-navy">
            Solicitar Verificação
          </h1>
          <p className="text-body-md text-graphite/60">
            Obtenha o selo de criador verificado
          </p>
        </div>
      </div>

      {/* Rejected warning */}
      {wasRejected && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Solicitação anterior rejeitada</h3>
                <p className="text-body-sm text-amber-700 mt-1">
                  Motivo: {status?.verificationRequest?.rejectionReason}
                </p>
                <p className="text-caption text-amber-600 mt-2">
                  Você pode enviar uma nova solicitação com os dados corretos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-nex-blue" />
            Por que verificar?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-body-sm text-graphite/70">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Selo de verificado no seu perfil
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Maior confiança dos assinantes
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Destaque nos resultados de busca
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Acesso a recursos exclusivos
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>
              Estas informações são confidenciais e usadas apenas para verificação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nome Completo *"
              placeholder="Conforme documento"
              value={formData.fullName}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              leftIcon={<User className="h-4 w-4" />}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="CPF *"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleCPFChange}
                leftIcon={<CreditCard className="h-4 w-4" />}
              />
              <Input
                label="RG *"
                placeholder="Número do RG"
                value={formData.rg}
                onChange={(e) => setFormData((prev) => ({ ...prev, rg: e.target.value }))}
                leftIcon={<FileText className="h-4 w-4" />}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Órgão Emissor"
                placeholder="Ex: SSP/SP"
                value={formData.rgIssuer}
                onChange={(e) => setFormData((prev) => ({ ...prev, rgIssuer: e.target.value }))}
              />
              <Input
                label="Data de Nascimento"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>
              Envie fotos legíveis do seu documento de identidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Front */}
            <div>
              <label className="input-label">Frente do Documento *</label>
              <div className="mt-2">
                {formData.documentFrontUrl ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.documentFrontUrl}
                      alt="Frente do documento"
                      className="w-full max-w-sm h-48 object-cover rounded-nex border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setFormData((prev) => ({ ...prev, documentFrontUrl: '' }))}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-mid-gray rounded-nex cursor-pointer hover:border-nex-blue/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'documentFrontUrl')}
                      disabled={uploadingField !== null}
                    />
                    {uploadingField === 'documentFrontUrl' ? (
                      <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-mid-gray mb-2" />
                        <p className="text-body-sm text-graphite/60">
                          Clique para enviar a frente do documento
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Document Back */}
            <div>
              <label className="input-label">Verso do Documento *</label>
              <div className="mt-2">
                {formData.documentBackUrl ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.documentBackUrl}
                      alt="Verso do documento"
                      className="w-full max-w-sm h-48 object-cover rounded-nex border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setFormData((prev) => ({ ...prev, documentBackUrl: '' }))}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-mid-gray rounded-nex cursor-pointer hover:border-nex-blue/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'documentBackUrl')}
                      disabled={uploadingField !== null}
                    />
                    {uploadingField === 'documentBackUrl' ? (
                      <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-mid-gray mb-2" />
                        <p className="text-body-sm text-graphite/60">
                          Clique para enviar o verso do documento
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Selfie */}
            <div>
              <label className="input-label">Selfie com Documento *</label>
              <p className="text-caption text-graphite/50 mb-2">
                Uma foto sua segurando o documento ao lado do rosto
              </p>
              <div className="mt-2">
                {formData.selfieUrl ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.selfieUrl}
                      alt="Selfie com documento"
                      className="w-full max-w-sm h-48 object-cover rounded-nex border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setFormData((prev) => ({ ...prev, selfieUrl: '' }))}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-mid-gray rounded-nex cursor-pointer hover:border-nex-blue/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'selfieUrl')}
                      disabled={uploadingField !== null}
                    />
                    {uploadingField === 'selfieUrl' ? (
                      <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-mid-gray mb-2" />
                        <p className="text-body-sm text-graphite/60">
                          Clique para enviar selfie com documento
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Card className="mt-6 bg-soft-gray border-0">
          <CardContent className="p-4">
            <p className="text-caption text-graphite/60">
              🔒 <strong>Privacidade:</strong> Seus dados pessoais e documentos são armazenados de forma segura 
              e utilizados apenas para fins de verificação de identidade. Não compartilhamos essas informações 
              com terceiros.
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="mt-6 flex justify-end gap-3">
          <Link href="/dashboard">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" isLoading={submitting}>
            Enviar Solicitação
          </Button>
        </div>
      </form>
    </div>
  )
}

