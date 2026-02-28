'use client'

import { useState } from 'react'
import { Search, Filter, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'

// Mock data
const reports = [
  {
    id: '1',
    sender: { name: 'João Silva', email: 'joao@email.com' },
    target: { name: 'user123', type: 'USER' },
    reason: 'SPAM',
    description: 'Este usuário está enviando mensagens promocionais não solicitadas para múltiplos usuários.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    sender: { name: 'Maria Santos', email: 'maria@email.com' },
    target: { name: 'Post: Tutorial de...', type: 'POST' },
    reason: 'COPYRIGHT',
    description: 'O conteúdo deste post utiliza imagens protegidas por direitos autorais sem autorização.',
    status: 'INVESTIGATING',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    sender: { name: 'Pedro Costa', email: 'pedro@email.com' },
    target: { name: 'creator456', type: 'USER' },
    reason: 'INAPPROPRIATE_CONTENT',
    description: 'Conteúdo impróprio sendo postado publicamente.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: '4',
    sender: { name: 'Ana Lima', email: 'ana@email.com' },
    target: { name: 'Comment #789', type: 'COMMENT' },
    reason: 'HARASSMENT',
    description: 'Comentários ofensivos e ameaçadores direcionados a outros usuários.',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

const reasonLabels: Record<string, string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Assédio',
  INAPPROPRIATE_CONTENT: 'Conteúdo Impróprio',
  COPYRIGHT: 'Direitos Autorais',
  SCAM: 'Golpe',
  OTHER: 'Outro',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  INVESTIGATING: 'Investigando',
  RESOLVED: 'Resolvido',
  DISMISSED: 'Arquivado',
}

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const handleResolve = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    // In production, this would call the API
    toast({
      title: status === 'RESOLVED' ? 'Denúncia resolvida' : 'Denúncia arquivada',
      description: 'O status foi atualizado com sucesso.',
      variant: 'success',
    })
    setSelectedReport(null)
  }

  const filteredReports = statusFilter === 'all'
    ? reports
    : reports.filter((r) => r.status === statusFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-display-sm text-white">Denúncias</h1>
          <p className="text-body-md text-white/60">
            Gerencie as denúncias da plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="destructive">
            {reports.filter((r) => r.status === 'PENDING').length} pendentes
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-graphite border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar denúncias..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="INVESTIGATING">Investigando</SelectItem>
                <SelectItem value="RESOLVED">Resolvidos</SelectItem>
                <SelectItem value="DISMISSED">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="bg-graphite border-white/10">
        <CardHeader>
          <CardTitle className="text-white">
            {filteredReports.length} denúncias encontradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-nex bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          report.reason === 'SPAM' ? 'warning' :
                          report.reason === 'HARASSMENT' ? 'destructive' :
                          report.reason === 'COPYRIGHT' ? 'purple' : 'default'
                        }
                      >
                        {reasonLabels[report.reason]}
                      </Badge>
                      <Badge
                        variant={
                          report.status === 'PENDING' ? 'warning' :
                          report.status === 'INVESTIGATING' ? 'default' :
                          report.status === 'RESOLVED' ? 'success' : 'secondary'
                        }
                      >
                        {statusLabels[report.status]}
                      </Badge>
                      <span className="text-caption text-white/40">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>
                    <p className="text-body-sm text-white mb-1">
                      <span className="text-white/60">De:</span>{' '}
                      <span className="font-medium">{report.sender.name}</span>{' '}
                      <span className="text-white/60">→ Alvo:</span>{' '}
                      <span className="font-medium">{report.target.name}</span>{' '}
                      <span className="text-white/40">({report.target.type})</span>
                    </p>
                    <p className="text-body-sm text-white/60 line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="bg-graphite border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Detalhes da Denúncia</DialogTitle>
            <DialogDescription className="text-white/60">
              Revise os detalhes e tome uma ação
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={
                  selectedReport.reason === 'SPAM' ? 'warning' :
                  selectedReport.reason === 'HARASSMENT' ? 'destructive' : 'default'
                }>
                  {reasonLabels[selectedReport.reason]}
                </Badge>
                <Badge variant={
                  selectedReport.status === 'PENDING' ? 'warning' :
                  selectedReport.status === 'INVESTIGATING' ? 'default' : 'success'
                }>
                  {statusLabels[selectedReport.status]}
                </Badge>
              </div>

              <div className="p-4 rounded-nex bg-white/5 space-y-3">
                <div>
                  <p className="text-caption text-white/40">Denunciante</p>
                  <p className="text-body-sm text-white">{selectedReport.sender.name}</p>
                  <p className="text-caption text-white/60">{selectedReport.sender.email}</p>
                </div>
                <div>
                  <p className="text-caption text-white/40">Alvo</p>
                  <p className="text-body-sm text-white">{selectedReport.target.name}</p>
                  <p className="text-caption text-white/60">Tipo: {selectedReport.target.type}</p>
                </div>
                <div>
                  <p className="text-caption text-white/40">Descrição</p>
                  <p className="text-body-sm text-white">{selectedReport.description}</p>
                </div>
                <div>
                  <p className="text-caption text-white/40">Data</p>
                  <p className="text-body-sm text-white">{formatDate(selectedReport.createdAt)}</p>
                </div>
              </div>

              <div className="p-4 rounded-nex bg-white/5">
                <label className="text-caption text-white/40 block mb-2">Resolução</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-nex p-3 text-white placeholder:text-white/40 resize-none"
                  rows={3}
                  placeholder="Descreva a ação tomada..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => handleResolve(selectedReport?.id || '', 'DISMISSED')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Arquivar
            </Button>
            <Button
              onClick={() => handleResolve(selectedReport?.id || '', 'RESOLVED')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

