'use client'

import { useState, useEffect } from 'react'
import { Search, MoreVertical, Mail, UserX, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Subscriber {
  id: string
  name: string
  email: string
  avatar: string | null
  plan: string
  planPrice: number
  subscribedAt: string
  status: string
}

interface SubscriberStats {
  total: number
  newThisMonth: number
  monthlyRevenue: number
  retentionRate: number
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<SubscriberStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')

  useEffect(() => {
    fetchSubscribers()
  }, [statusFilter])

  const fetchSubscribers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/creator/subscribers?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar assinantes')

      const data = await response.json()
      setSubscribers(data.subscribers || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error fetching subscribers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchSubscribers()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const filteredSubscribers = subscribers.filter((sub) =>
    !searchQuery ||
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-display-sm text-deep-navy">Assinantes</h1>
        <p className="text-body-md text-graphite/60">
          Gerencie seus assinantes e acompanhe o crescimento
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-nex-blue" />
        </div>
      ) : stats ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-body-sm text-graphite/60 mb-1">Total de Assinantes</p>
              <p className="font-headline text-heading-lg text-deep-navy">
                {stats.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-body-sm text-graphite/60 mb-1">Novos este mês</p>
              <p className="font-headline text-heading-lg text-deep-navy">
                {stats.newThisMonth}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-body-sm text-graphite/60 mb-1">Receita Mensal</p>
              <p className="font-headline text-heading-lg text-deep-navy">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-body-sm text-graphite/60 mb-1">Taxa de Retenção</p>
              <p className="font-headline text-heading-lg text-deep-navy">
                {stats.retentionRate > 0 ? `${stats.retentionRate}%` : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Input
              placeholder="Buscar assinantes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mid-gray" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('ACTIVE')}
        >
          Ativos
        </Button>
        <Button
          variant={statusFilter === 'CANCELED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('CANCELED')}
        >
          Cancelados
        </Button>
        <Button
          variant={statusFilter === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('ALL')}
        >
          Todos
        </Button>
      </div>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinantes ({filteredSubscribers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-nex-blue" />
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="h-12 w-12 text-graphite/20 mx-auto mb-4" />
              <p className="text-body-md text-graphite/60">
                Nenhum assinante encontrado
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="flex items-center justify-between p-4 rounded-nex bg-soft-gray hover:bg-soft-gray/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      {subscriber.avatar && <AvatarImage src={subscriber.avatar} />}
                      <AvatarFallback name={subscriber.name} />
                    </Avatar>
                    <div>
                      <p className="font-medium text-deep-navy">{subscriber.name}</p>
                      <p className="text-caption text-graphite/50">{subscriber.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant={subscriber.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {subscriber.plan}
                      </Badge>
                      <p className="text-caption text-graphite/50 mt-1">
                        {formatCurrency(subscriber.planPrice / 100)}/mês
                      </p>
                      <p className="text-caption text-graphite/50">
                        Desde {formatDate(subscriber.subscribedAt)}
                      </p>
                    </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar mensagem
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <UserX className="h-4 w-4 mr-2" />
                        Cancelar assinatura
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


