'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, TrendingUp, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/utils'

interface Creator {
  id: string
  displayName: string
  slug: string
  isVerified: boolean
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

function CreatorCard({ creator }: { creator: Creator }) {
  // Price is stored in cents, so divide by 100 to get the actual price
  const lowestPrice = creator.plans.length > 0 ? creator.plans[0].price / 100 : 0

  return (
    <Link href={`/c/${creator.slug}`}>
      <Card interactive className="h-full">
        <CardContent className="p-0">
          {/* Cover gradient */}
          <div className="h-24 bg-nex-gradient rounded-t-nex" />
          
          {/* Avatar */}
          <div className="px-6 -mt-10">
            <Avatar size="xl" ring>
              {creator.user.avatar ? (
                <AvatarImage src={creator.user.avatar} alt={creator.displayName} />
              ) : null}
              <AvatarFallback name={creator.displayName} />
            </Avatar>
          </div>

          {/* Content */}
          <div className="p-6 pt-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-headline text-heading-md text-deep-navy truncate">
                {creator.displayName}
              </h3>
              {creator.isVerified && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                  ✓
                </Badge>
              )}
            </div>
            
            {creator.user.bio && (
              <p className="text-body-sm text-graphite/70 line-clamp-2 mb-4">
                {creator.user.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-caption text-graphite/60 mb-4">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {creator._count.subscribers.toLocaleString('pt-BR')}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {creator._count.posts} posts
              </span>
            </div>

            {/* Price */}
            {lowestPrice > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-caption text-graphite/50">A partir de</span>
                <span className="font-headline text-heading-sm text-nex-blue">
                  {formatCurrency(lowestPrice)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const search = searchParams.get('search') || ''
    setSearchQuery(search)
    setPage(1)
    fetchCreators(search, 1)
  }, [searchParams])

  const fetchCreators = async (search: string, pageNum: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/explore')
    }
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Hero Section */}
      <section className="bg-white border-b border-[#E5E7EB] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="font-headline text-display-md text-deep-navy mb-4">
              {searchQuery ? `Resultados para "${searchQuery}"` : 'Explore Criadores'}
            </h1>
            <p className="text-body-lg text-graphite/70">
              {searchQuery
                ? 'Encontre criadores que correspondem à sua busca'
                : 'Descubra criadores incríveis e apoie o conteúdo que você ama.'}
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="search"
                placeholder="Buscar criadores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12"
                leftIcon={<Search className="h-5 w-5" />}
              />
            </form>
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-20">
              <Search className="h-12 w-12 text-graphite/20 mx-auto mb-4" />
              <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                Nenhum criador encontrado
              </h3>
              <p className="text-body-sm text-graphite/60 mb-6">
                {searchQuery
                  ? `Não encontramos criadores com o nome "${searchQuery}". Tente outra busca.`
                  : 'Ainda não há criadores cadastrados.'}
              </p>
              {searchQuery && (
                <Button onClick={() => router.push('/explore')} variant="outline">
                  Ver todos os criadores
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-body-sm text-graphite/60">
                  {creators.length} criador{creators.length !== 1 ? 'es' : ''} encontrado{creators.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {creators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newPage = Math.max(1, page - 1)
                      setPage(newPage)
                      fetchCreators(searchQuery, newPage)
                    }}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-body-sm text-graphite/60 px-4">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newPage = Math.min(totalPages, page + 1)
                      setPage(newPage)
                      fetchCreators(searchQuery, newPage)
                    }}
                    disabled={page === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-soft-gray flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  )
}
