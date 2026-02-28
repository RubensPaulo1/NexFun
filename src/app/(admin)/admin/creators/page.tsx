'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, CheckCircle2, XCircle, Eye, Loader2, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Creator {
  id: string
  displayName: string
  slug: string
  isVerified: boolean
  isActive: boolean
  createdAt: string
  user: {
    avatar: string | null
    bio: string | null
  }
  plans: Array<{
    id: string
    name: string
    price: number
  }>
  _count: {
    subscribers: number
    posts: number
  }
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCreators()
  }, [page, search])

  const fetchCreators = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      })

      const response = await fetch(`/api/creator?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar criadores')

      const data = await response.json()
      setCreators(data.creators || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching creators:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && creators.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-display-sm text-white">Gerenciar Criadores</h1>
        <p className="text-body-md text-white/60">
          Perfis de criadores, estatísticas e configurações
        </p>
      </div>

      {/* Search */}
      <Card className="bg-graphite border-white/10">
        <CardContent className="p-4">
          <Input
            placeholder="Buscar criador por nome ou slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            leftIcon={<Search className="h-4 w-4" />}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </CardContent>
      </Card>

      {/* Creators Grid */}
      <div className="grid gap-4">
        {creators.length === 0 ? (
          <Card className="bg-graphite border-white/10">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-body-md text-white/40">Nenhum criador encontrado</p>
            </CardContent>
          </Card>
        ) : (
          creators.map((creator) => (
            <Card key={creator.id} className="bg-graphite border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={creator.user.avatar || undefined} />
                      <AvatarFallback className="bg-nex-blue/20 text-nex-blue">
                        {creator.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-headline text-heading-md text-white">
                          {creator.displayName}
                        </h3>
                        {creator.isVerified && (
                          <Badge variant="gradient" className="text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                        {!creator.isActive && (
                          <Badge variant="destructive" className="text-[10px]">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-body-sm text-white/60 mb-2">
                        @{creator.slug}
                      </p>
                      {creator.user.bio && (
                        <p className="text-body-sm text-white/50 line-clamp-2 mb-4">
                          {creator.user.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-caption text-white/50">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {creator._count.subscribers} assinantes
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {creator._count.posts} posts
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {creator.plans.length} planos
                        </div>
                        <div>
                          Criado em {formatDate(creator.createdAt)}
                        </div>
                      </div>
                      {creator.plans.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {creator.plans.map((plan) => (
                            <Badge key={plan.id} variant="outline" className="text-[10px]">
                              {plan.name}: {formatCurrency(plan.price)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/c/${creator.slug}`} target="_blank">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Perfil
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-body-sm text-white/60">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


