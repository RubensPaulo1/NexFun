'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CreditCard, ExternalLink, MoreVertical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/utils'
import { isSubscriptionActive } from '@/lib/utils'

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  createdAt: string
  canceledAt: string | null
  stripeSubscriptionId: string | null
  plan: {
    id: string
    name: string
    price: number
    description: string | null
    benefits: string[]
  }
  creator: {
    id: string
    displayName: string
    slug: string
    avatar: string | null
    isVerified: boolean
  }
}

function SubscriptionCard({ 
  sub, 
  isActive 
}: { 
  sub: Subscription
  isActive: boolean
}) {
  const nextBillingDate = new Date(sub.currentPeriodEnd)
  const subscribedSince = new Date(sub.createdAt)
  const periodStart = new Date(sub.currentPeriodStart)

  const getStatusLabel = () => {
    if (isActive) return 'Ativa'
    switch (sub.status) {
      case 'CANCELED': return 'Cancelada'
      case 'PAST_DUE': return 'Atrasada'
      case 'PENDING': return 'Pendente'
      case 'EXPIRED': return 'Expirada'
      default: return 'Inativa'
    }
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-nex bg-soft-gray ${
        !isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          {sub.creator.avatar ? (
            <AvatarImage src={sub.creator.avatar} alt={sub.creator.displayName} />
          ) : null}
          <AvatarFallback name={sub.creator.displayName} />
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-deep-navy">{sub.creator.displayName}</p>
            {sub.creator.isVerified && (
              <Badge variant="outline" className="text-[10px]">✓ Verificado</Badge>
            )}
            <Link href={`/c/${sub.creator.slug}`}>
              <ExternalLink className="h-4 w-4 text-graphite/40 hover:text-nex-blue" />
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {sub.plan.name}
            </Badge>
            {!isActive && (
              <Badge variant="outline" className="text-caption">
                {getStatusLabel()}
              </Badge>
            )}
            <span className="text-caption text-graphite/50">
              Desde {formatDate(subscribedSince, { month: 'short', year: 'numeric' })}
            </span>
          </div>
          {sub.plan.description && (
            <p className="text-caption text-graphite/60 mt-1">
              {sub.plan.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-deep-navy">
            {formatCurrency(sub.plan.price / 100)}/mês
          </p>
          {isActive ? (
            <>
              <p className="text-caption text-graphite/50">
                Próxima cobrança: {formatDate(nextBillingDate)}
              </p>
              <p className="text-caption text-graphite/50">
                Período: {formatDate(periodStart, { day: '2-digit', month: '2-digit' })} até {formatDate(nextBillingDate, { day: '2-digit', month: '2-digit' })}
              </p>
            </>
          ) : (
            <p className="text-caption text-graphite/50">
              {sub.canceledAt ? `Cancelada em ${formatDate(sub.canceledAt)}` : `Expirou em ${formatDate(nextBillingDate)}`}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isActive && (
              <>
                <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                <DropdownMenuItem>Alterar plano</DropdownMenuItem>
                <DropdownMenuItem>Atualizar método de pagamento</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Cancelar assinatura
                </DropdownMenuItem>
              </>
            )}
            {!isActive && (
              <>
                <DropdownMenuItem>Reativar assinatura</DropdownMenuItem>
                <DropdownMenuItem>Ver histórico</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const { data: session } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const response = await fetch('/api/subscribe')
        if (response.ok) {
          const data = await response.json()
          console.log('📦 Dados recebidos da API:', data)
          console.log('📋 Número de assinaturas:', data.subscriptions?.length || 0)
          const subscriptionsData = data.subscriptions || []
          
          // Log detalhado de cada assinatura
          subscriptionsData.forEach((sub: Subscription, index: number) => {
            console.log(`📝 Assinatura ${index + 1}:`, {
              id: sub.id,
              status: sub.status,
              creator: sub.creator.displayName,
              plan: sub.plan.name,
              price: sub.plan.price,
              periodStart: sub.currentPeriodStart,
              periodEnd: sub.currentPeriodEnd,
              isActive: isSubscriptionActive(sub.status, sub.currentPeriodEnd),
            })
          })
          
          console.log('✅ Total de assinaturas a serem exibidas:', subscriptionsData.length)
          setSubscriptions(subscriptionsData)
        } else {
          const errorData = await response.json()
          console.error('❌ Erro ao buscar assinaturas:', errorData)
        }
      } catch (error) {
        console.error('Erro ao buscar assinaturas:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchSubscriptions()
    } else {
      setLoading(false)
    }
  }, [session])

  const activeSubscriptions = subscriptions.filter((sub) =>
    isSubscriptionActive(sub.status, sub.currentPeriodEnd)
  )

  const inactiveSubscriptions = subscriptions.filter(
    (sub) => !isSubscriptionActive(sub.status, sub.currentPeriodEnd)
  )

  const totalMonthly = activeSubscriptions.reduce((acc, sub) => {
    return acc + (sub.plan.price / 100)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-display-sm text-deep-navy">Minhas Assinaturas</h1>
        <p className="text-body-md text-graphite/60">
          Gerencie seus apoios a criadores
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <Card className="bg-nex-gradient text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 mb-1">Gasto mensal com assinaturas</p>
                  <p className="font-headline text-display-sm">{formatCurrency(totalMonthly)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 mb-1">Criadores apoiados</p>
                  <p className="font-headline text-display-sm">{activeSubscriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions List */}
          <Card>
            <CardHeader>
              <CardTitle>Minhas Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-graphite/20 mx-auto mb-4" />
                  <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                    Nenhuma assinatura ainda
                  </h3>
                  <p className="text-body-md text-graphite/60 mb-6">
                    Explore criadores e comece a apoiar conteúdo incrível
                  </p>
                  <Link href="/explore">
                    <Button>Explorar Criadores</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Assinaturas Ativas */}
                  {activeSubscriptions.length > 0 && (
                    <div>
                      <h3 className="text-body-md font-semibold text-deep-navy mb-3">
                        Assinaturas Ativas ({activeSubscriptions.length})
                      </h3>
                      <div className="space-y-3">
                        {activeSubscriptions.map((sub) => (
                          <SubscriptionCard key={sub.id} sub={sub} isActive={true} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assinaturas Inativas/Expiradas */}
                  {inactiveSubscriptions.length > 0 && (
                    <div className="pt-6 border-t border-[#E5E7EB]">
                      <h3 className="text-body-md font-semibold text-deep-navy mb-3">
                        Assinaturas Inativas ({inactiveSubscriptions.length})
                      </h3>
                      <div className="space-y-3">
                        {inactiveSubscriptions.map((sub) => (
                          <SubscriptionCard key={sub.id} sub={sub} isActive={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Discover More */}
      <Card className="bg-soft-gray border-0">
        <CardContent className="p-6 text-center">
          <h3 className="font-headline text-heading-md text-deep-navy mb-2">
            Descubra mais criadores
          </h3>
          <p className="text-body-sm text-graphite/60 mb-4">
            Explore nossa comunidade de criadores e encontre conteúdo que você vai amar
          </p>
          <Link href="/explore">
            <Button variant="outline">Explorar</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
