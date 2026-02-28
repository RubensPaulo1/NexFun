'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Download, Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface EarningsStats {
  totalEarnings: number
  thisMonthEarnings: number
  pendingEarnings: number
  availableEarnings: number
}

interface Transaction {
  id: string
  type: 'subscription' | 'payout'
  user: string
  plan: string
  amount: number
  date: string
  status?: string
}

interface Payout {
  id: string
  amount: number
  status: string
  requestedAt: string
  completedAt: string | null
}

export default function EarningsPage() {
  const [stats, setStats] = useState<EarningsStats | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/creator/earnings')
      if (!response.ok) throw new Error('Erro ao buscar ganhos')

      const data = await response.json()
      setStats(data.stats)
      setTransactions(data.transactions || [])
      setPayouts(data.payouts || [])
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-display-sm text-deep-navy">Ganhos</h1>
          <p className="text-body-md text-graphite/60">
            Acompanhe seus rendimentos e solicite saques
          </p>
        </div>
        <Button leftIcon={<Download className="h-4 w-4" />}>
          Solicitar Saque
        </Button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-nex-blue" />
        </div>
      ) : stats ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-nex bg-nex-blue/10">
                  <DollarSign className="h-5 w-5 text-nex-blue" />
                </div>
              </div>
              <p className="text-body-sm text-graphite/60 mb-1">Total Ganho</p>
              <p className="font-headline text-display-sm text-deep-navy">
                {formatCurrency(stats.totalEarnings)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-nex bg-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-body-sm text-graphite/60 mb-1">Este Mês</p>
              <p className="font-headline text-display-sm text-deep-navy">
                {formatCurrency(stats.thisMonthEarnings)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-nex bg-amber-100">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="text-body-sm text-graphite/60 mb-1">Pendente</p>
              <p className="font-headline text-display-sm text-deep-navy">
                {formatCurrency(stats.pendingEarnings)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-nex-blue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-nex bg-nex-blue/10">
                  <CreditCard className="h-5 w-5 text-nex-blue" />
                </div>
              </div>
              <p className="text-body-sm text-graphite/60 mb-1">Disponível para Saque</p>
              <p className="font-headline text-display-sm text-nex-blue">
                {formatCurrency(stats.availableEarnings)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-graphite/50 py-8">
                Nenhuma transação ainda
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-nex bg-soft-gray"
                  >
                    <div>
                      <p className="font-medium text-deep-navy">{tx.user}</p>
                      <p className="text-caption text-graphite/50">
                        {tx.plan && `${tx.plan} • `}
                        {formatDate(tx.date)}
                      </p>
                    </div>
                    <span className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-graphite'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Saques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payouts.length === 0 ? (
                <p className="text-center text-graphite/50 py-8">
                  Nenhum saque realizado ainda
                </p>
              ) : (
                payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-3 rounded-nex bg-soft-gray"
                  >
                    <div>
                      <p className="font-medium text-deep-navy">
                        {formatCurrency(payout.amount)}
                      </p>
                      <p className="text-caption text-graphite/50">
                        Solicitado em {formatDate(payout.requestedAt)}
                        {payout.completedAt && ` • Concluído em ${formatDate(payout.completedAt)}`}
                      </p>
                    </div>
                    <Badge variant={payout.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {payout.status === 'COMPLETED' ? 'Concluído' : 
                       payout.status === 'PROCESSING' ? 'Processando' :
                       payout.status === 'PENDING' ? 'Pendente' : 'Falhou'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Info */}
      <Card className="bg-soft-gray border-0">
        <CardContent className="p-6">
          <h3 className="font-headline text-heading-md text-deep-navy mb-2">
            Informações de Pagamento
          </h3>
          <p className="text-body-sm text-graphite/70 mb-4">
            Os saques são processados em até 3 dias úteis. O valor mínimo para saque é R$ 50,00.
            A taxa de processamento é de 5% sobre o valor sacado.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


