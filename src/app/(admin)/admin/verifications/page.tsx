'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Loader2,
  User,
  FileText,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/components/ui/toaster'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface VerificationRequest {
  id: string
  fullName: string
  cpf: string
  rg: string
  rgIssuer: string | null
  birthDate: string | null
  documentFrontUrl: string
  documentBackUrl: string | null
  selfieUrl: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason: string | null
  reviewedAt: string | null
  createdAt: string
  creator: {
    id: string
    displayName: string
    slug: string
    user: {
      id: string
      name: string | null
      email: string
      avatar: string | null
      createdAt: string
    }
    _count?: {
      posts: number
      subscribers: number
    }
  }
}

const statusConfig = {
  PENDING: { label: 'Pendente', color: 'warning', icon: Clock },
  APPROVED: { label: 'Aprovado', color: 'success', icon: CheckCircle2 },
  REJECTED: { label: 'Rejeitado', color: 'destructive', icon: XCircle },
}

export default function AdminVerificationsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/verifications?status=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRequest) return

    if (action === 'REJECT' && !rejectionReason.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe o motivo da rejeição.',
        variant: 'destructive',
      })
      return
    }

    try {
      setProcessing(true)

      const response = await fetch(`/api/admin/verifications/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao processar')
      }

      toast({
        title: action === 'APPROVE' ? 'Verificação Aprovada! ✅' : 'Solicitação Rejeitada',
        description: action === 'APPROVE'
          ? 'O criador agora tem o selo de verificado.'
          : 'O criador foi notificado sobre a rejeição.',
        variant: 'success',
      })

      setSelectedRequest(null)
      setRejectionReason('')
      fetchRequests()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao processar solicitação.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const maskCPF = (cpf: string) => {
    if (cpf.length !== 11) return cpf
    return `***.***.${cpf.slice(6, 9)}-**`
  }

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-display-sm text-white flex items-center gap-2">
            <Shield className="h-8 w-8 text-nex-blue" />
            Verificações de Criadores
          </h1>
          <p className="text-body-md text-white/60">
            Analise e aprove solicitações de verificação
          </p>
        </div>
        {filter === 'ALL' && pendingCount > 0 && (
          <Badge variant="warning" className="text-lg px-4 py-2">
            {pendingCount} pendentes
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-graphite border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => {
              const config = status === 'ALL' 
                ? { label: 'Todos', color: 'outline' as const, icon: Filter }
                : statusConfig[status]
              const Icon = config.icon
              return (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
                leftIcon={<Icon className="h-4 w-4" />}
                className={filter === status ? 'bg-nex-blue' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}
              >
                {config.label}
              </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="bg-graphite border-white/10">
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-headline text-heading-md text-white mb-2">
              Nenhuma solicitação
            </h3>
            <p className="text-body-sm text-white/60">
              {filter === 'PENDING'
                ? 'Não há solicitações pendentes no momento.'
                : 'Nenhuma solicitação encontrada com este filtro.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => {
            const config = statusConfig[request.status]
            const StatusIcon = config.icon
            return (
              <Card
                key={request.id}
                className={`bg-graphite border-white/10 hover:bg-white/5 transition-colors cursor-pointer ${
                  request.status === 'PENDING' ? 'border-amber-300' : ''
                }`}
                onClick={() => setSelectedRequest(request)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar size="lg">
                        {request.creator.user.avatar ? (
                          <AvatarImage src={request.creator.user.avatar} />
                        ) : null}
                        <AvatarFallback name={request.creator.displayName} />
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-headline text-heading-md text-white">
                            {request.creator.displayName}
                          </h3>
                          <Badge variant={config.color as any}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-body-sm text-white/60 mb-2">
                          @{request.creator.slug} • {request.creator.user.email}
                        </p>
                        <div className="flex items-center gap-4 text-caption text-white/50">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {request.fullName}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            CPF: {maskCPF(request.cpf)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatRelativeTime(request.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-nex-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-headline text-heading-lg text-deep-navy">
                Detalhes da Solicitação
              </h2>
              <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                Fechar
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Creator Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Criador</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar size="xl">
                      {selectedRequest.creator.user.avatar ? (
                        <AvatarImage src={selectedRequest.creator.user.avatar} />
                      ) : null}
                      <AvatarFallback name={selectedRequest.creator.displayName} />
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-headline text-heading-md text-deep-navy">
                        {selectedRequest.creator.displayName}
                      </h3>
                      <p className="text-body-sm text-graphite/60">
                        @{selectedRequest.creator.slug}
                      </p>
                      <p className="text-caption text-graphite/50 mt-2">
                        {selectedRequest.creator.user.email}
                      </p>
                      <div className="flex gap-4 mt-3 text-caption">
                        <span>📝 {selectedRequest.creator._count?.posts || 0} posts</span>
                        <span>👥 {selectedRequest.creator._count?.subscribers || 0} assinantes</span>
                        <span>📅 Desde {formatDate(selectedRequest.creator.user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-caption text-graphite/50">Nome Completo</dt>
                      <dd className="font-medium text-deep-navy">{selectedRequest.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-caption text-graphite/50">CPF</dt>
                      <dd className="font-medium text-deep-navy font-mono">{selectedRequest.cpf}</dd>
                    </div>
                    <div>
                      <dt className="text-caption text-graphite/50">RG</dt>
                      <dd className="font-medium text-deep-navy font-mono">{selectedRequest.rg}</dd>
                    </div>
                    <div>
                      <dt className="text-caption text-graphite/50">Órgão Emissor</dt>
                      <dd className="font-medium text-deep-navy">
                        {selectedRequest.rgIssuer || '-'}
                      </dd>
                    </div>
                    {selectedRequest.birthDate && (
                      <div>
                        <dt className="text-caption text-graphite/50">Data de Nascimento</dt>
                        <dd className="font-medium text-deep-navy">{selectedRequest.birthDate}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Enviados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* Front */}
                    <div>
                      <p className="text-caption text-graphite/50 mb-2">Frente do Documento</p>
                      <a
                        href={selectedRequest.documentFrontUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedRequest.documentFrontUrl}
                          alt="Frente do documento"
                          className="w-full h-40 object-cover rounded-nex border hover:opacity-80 transition-opacity"
                        />
                        <span className="text-caption text-nex-blue flex items-center gap-1 mt-1">
                          <ExternalLink className="h-3 w-3" />
                          Abrir em nova aba
                        </span>
                      </a>
                    </div>

                    {/* Back */}
                    {selectedRequest.documentBackUrl && (
                      <div>
                        <p className="text-caption text-graphite/50 mb-2">Verso do Documento</p>
                        <a
                          href={selectedRequest.documentBackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedRequest.documentBackUrl}
                            alt="Verso do documento"
                            className="w-full h-40 object-cover rounded-nex border hover:opacity-80 transition-opacity"
                          />
                          <span className="text-caption text-nex-blue flex items-center gap-1 mt-1">
                            <ExternalLink className="h-3 w-3" />
                            Abrir em nova aba
                          </span>
                        </a>
                      </div>
                    )}

                    {/* Selfie */}
                    {selectedRequest.selfieUrl && (
                      <div>
                        <p className="text-caption text-graphite/50 mb-2">Selfie com Documento</p>
                        <a
                          href={selectedRequest.selfieUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedRequest.selfieUrl}
                            alt="Selfie com documento"
                            className="w-full h-40 object-cover rounded-nex border hover:opacity-80 transition-opacity"
                          />
                          <span className="text-caption text-nex-blue flex items-center gap-1 mt-1">
                            <ExternalLink className="h-3 w-3" />
                            Abrir em nova aba
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions for pending requests */}
              {selectedRequest.status === 'PENDING' && (
                <Card className="border-nex-blue">
                  <CardHeader>
                    <CardTitle>Ação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="input-label">Motivo da Rejeição (se aplicável)</label>
                      <textarea
                        className="input-field min-h-[80px]"
                        placeholder="Informe o motivo caso vá rejeitar a solicitação..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="destructive"
                        onClick={() => handleReview('REJECT')}
                        disabled={processing}
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Rejeitar
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => handleReview('APPROVE')}
                        disabled={processing}
                        isLoading={processing}
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      >
                        Aprovar Verificação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status info for processed requests */}
              {selectedRequest.status !== 'PENDING' && (
                <Card className={selectedRequest.status === 'APPROVED' ? 'border-green-300' : 'border-red-300'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {selectedRequest.status === 'APPROVED' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {selectedRequest.status === 'APPROVED'
                            ? 'Verificação Aprovada'
                            : 'Verificação Rejeitada'}
                        </p>
                        {selectedRequest.rejectionReason && (
                          <p className="text-body-sm text-graphite/60 mt-1">
                            Motivo: {selectedRequest.rejectionReason}
                          </p>
                        )}
                        {selectedRequest.reviewedAt && (
                          <p className="text-caption text-graphite/50 mt-1">
                            Processado em: {formatDate(selectedRequest.reviewedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


