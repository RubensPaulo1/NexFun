'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Heart,
  Plus,
  Lock,
  Share2,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils'
import { LikeButton } from '@/components/post/like-button'
import { SaveButton } from '@/components/post/save-button'
import { CommentsSection } from '@/components/post/comments-section'
import { ProtectedMedia } from '@/components/media/protected-media'

interface CreatorStats {
  totalEarnings: number
  thisMonthEarnings: number
  totalSubscribers: number
  totalPosts: number
  totalViews: number
}

interface RecentSubscriber {
  id: string
  name: string
  avatar: string | null
  plan: string
  date: string
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  format = 'number',
}: {
  title: string
  value: number
  change: number
  icon: any
  format?: 'number' | 'currency'
}) {
  const isPositive = change >= 0
  const showChange = change !== 0
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-nex bg-nex-blue/10">
            <Icon className="h-5 w-5 text-nex-blue" />
          </div>
          {showChange && (
            <div className={`flex items-center gap-1 text-caption ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-body-sm text-graphite/60 mb-1">{title}</p>
        <p className="font-headline text-display-sm text-deep-navy">
          {format === 'currency' ? formatCurrency(value) : value.toLocaleString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  )
}

function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [recentSubscribers, setRecentSubscribers] = useState<RecentSubscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/creator/stats')
      if (!response.ok) throw new Error('Erro ao buscar estatísticas')

      const data = await response.json()
      setStats(data.stats)
      setRecentSubscribers(data.recentSubscribers || [])
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-display-sm text-deep-navy">Dashboard</h1>
          <p className="text-body-md text-graphite/60">Bem-vindo de volta! Aqui está um resumo do seu desempenho.</p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Novo Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ganhos do Mês"
          value={stats?.thisMonthEarnings || 0}
          change={0}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Total de Assinantes"
          value={stats?.totalSubscribers || 0}
          change={0}
          icon={Users}
        />
        <StatCard
          title="Posts Publicados"
          value={stats?.totalPosts || 0}
          change={0}
          icon={FileText}
        />
        <StatCard
          title="Interações"
          value={stats?.totalViews || 0}
          change={0}
          icon={Eye}
        />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Subscribers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Novos Assinantes</CardTitle>
            <Link href="/dashboard/subscribers">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSubscribers.length === 0 ? (
              <p className="text-body-sm text-graphite/50 text-center py-8">
                Nenhum assinante ainda
              </p>
            ) : (
              recentSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="flex items-center gap-3">
                  <Avatar size="sm">
                    {subscriber.avatar && <AvatarImage src={subscriber.avatar} />}
                    <AvatarFallback name={subscriber.name} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-deep-navy truncate">
                      {subscriber.name}
                    </p>
                    <p className="text-caption text-graphite/50">
                      {formatRelativeTime(subscriber.date)}
                    </p>
                  </div>
                  <Badge variant="default">{subscriber.plan}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle>Posts Recentes</CardTitle>
            <Link href="/dashboard/posts">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-graphite/50 text-center py-8">
              Acesse a página de posts para ver seus conteúdos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/dashboard/posts/new">
              <div className="p-4 rounded-nex border border-[#E5E7EB] hover:border-nex-blue/30 hover:bg-nex-blue/5 transition-colors cursor-pointer">
                <FileText className="h-8 w-8 text-nex-blue mb-3" />
                <p className="font-medium text-deep-navy">Criar Post</p>
                <p className="text-caption text-graphite/50">Publique novo conteúdo</p>
              </div>
            </Link>
            <Link href="/dashboard/settings">
              <div className="p-4 rounded-nex border border-[#E5E7EB] hover:border-nex-blue/30 hover:bg-nex-blue/5 transition-colors cursor-pointer">
                <TrendingUp className="h-8 w-8 text-nex-blue mb-3" />
                <p className="font-medium text-deep-navy">Gerenciar Planos</p>
                <p className="text-caption text-graphite/50">Configure seus planos</p>
              </div>
            </Link>
            <Link href="/dashboard/earnings">
              <div className="p-4 rounded-nex border border-[#E5E7EB] hover:border-nex-blue/30 hover:bg-nex-blue/5 transition-colors cursor-pointer">
                <DollarSign className="h-8 w-8 text-nex-blue mb-3" />
                <p className="font-medium text-deep-navy">Solicitar Saque</p>
                <p className="text-caption text-graphite/50">Retire seus ganhos</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface FeedPost {
  id: string
  title: string
  content: string | null
  isPublic: boolean
  isPinned: boolean
  publishedAt: string | null
  createdAt: string
  media: Array<{
    id: string
    type: string
    url: string
  }>
  isLocked: boolean
  isLiked: boolean
  isSaved?: boolean
  _count: {
    likes: number
    comments: number
  }
  creator: {
    id: string
    userId: string
    displayName: string
    slug: string
    avatar: string | null
    isVerified: boolean
  }
}

interface Subscription {
  id: string
  creator: {
    id: string
    displayName: string
    slug: string
    avatar: string | null
  }
  plan: {
    id: string
    name: string
  }
}

function FeedPostCard({ post }: { post: FeedPost }) {
  const likesCount = post._count?.likes || 0
  const commentsCount = post._count?.comments || 0
  const hasMedia = post.media && post.media.length > 0
  const firstMedia = hasMedia ? post.media[0] : null

  return (
    <Card 
      interactive 
      className={cn(
        post.isLocked ? 'relative overflow-hidden' : '',
        'h-full'
      )}
    >
      <CardContent className="p-6">
        {/* Creator header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/c/${post.creator.slug}`}>
            <Avatar>
              {post.creator.avatar ? (
                <AvatarImage src={post.creator.avatar} alt={post.creator.displayName} />
              ) : null}
              <AvatarFallback name={post.creator.displayName} />
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/c/${post.creator.slug}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <span className="font-medium text-body-sm text-deep-navy truncate">
                {post.creator.displayName}
              </span>
              {post.creator.isVerified && (
                <CheckCircle2 className="h-4 w-4 text-nex-blue shrink-0" />
              )}
            </Link>
            <p className="text-caption text-graphite/50">
              {formatRelativeTime(post.publishedAt || post.createdAt)}
            </p>
          </div>
          <Badge variant={post.isPublic ? 'outline' : 'default'}>
            {post.isPublic ? 'Público' : 'Exclusivo'}
          </Badge>
        </div>

        {/* Locked overlay */}
        {post.isLocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent z-10 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-soft-gray flex items-center justify-center mx-auto mb-3">
                <Lock className="h-5 w-5 text-graphite/50" />
              </div>
              <p className="text-body-sm text-graphite/70 mb-3">
                Este conteúdo é exclusivo para assinantes
              </p>
              <Link href={`/c/${post.creator.slug}`}>
                <Button size="sm">Ver perfil</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Media Display */}
        {hasMedia && !post.isLocked && (
          <div className="mb-4">
            {/* Single media */}
            {post.media.length === 1 && firstMedia && (
              <div className="rounded-nex overflow-hidden max-w-2xl mx-auto">
                <ProtectedMedia
                  src={firstMedia.url}
                  alt={post.title}
                  type={firstMedia.type}
                  className="rounded-nex w-full"
                />
              </div>
            )}

            {/* Multiple media - grid */}
            {post.media.length > 1 && (
              <div className={`grid gap-2 max-w-2xl mx-auto ${
                post.media.length === 2 ? 'grid-cols-2' : 
                post.media.length === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                {post.media.slice(0, 4).map((media, index) => (
                  <div 
                    key={media.id || index} 
                    className={`relative rounded-nex overflow-hidden ${
                      post.media.length === 3 && index === 0 ? 'col-span-3' : ''
                    }`}
                  >
                    <ProtectedMedia
                      src={media.url}
                      alt=""
                      type={media.type}
                      className="w-full"
                    />
                    {/* Show +N indicator for extra media */}
                    {index === 3 && post.media.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="text-white font-headline text-heading-lg">
                          +{post.media.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Locked media placeholder */}
        {hasMedia && post.isLocked && (
          <div className="bg-soft-gray rounded-nex h-32 mb-4 max-w-2xl mx-auto flex items-center justify-center">
            <Lock className="h-8 w-8 text-graphite/20" />
          </div>
        )}

        {/* Content */}
        <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
          {post.title}
        </h3>
        {post.content && (
          <p className="text-body-sm text-graphite/70 line-clamp-2 mb-4">
            {post.content}
          </p>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <LikeButton
                postId={post.id}
                initialLiked={post.isLiked}
                initialCount={likesCount}
              />
              <CommentsSection
                postId={post.id}
                initialCount={commentsCount}
                creatorUserId={post.creator.userId}
              />
              <SaveButton postId={post.id} initialSaved={post.isSaved} />
            </div>
            <button className="text-graphite/60 hover:text-nex-blue transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SubscriberDashboard() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeed() {
      try {
        const response = await fetch('/api/feed')
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts || [])
          setSubscriptions(data.subscriptions || [])
        } else {
          console.error('Error fetching feed')
        }
      } catch (error) {
        console.error('Error fetching feed:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeed()
  }, [])

  if (loading) {
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
        <h1 className="font-headline text-display-sm text-deep-navy">Seu Feed</h1>
        <p className="text-body-md text-graphite/60">Acompanhe os criadores que você apoia.</p>
      </div>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <Link key={sub.id} href={`/c/${sub.creator.slug}`}>
              <Card interactive>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {sub.creator.avatar ? (
                        <AvatarImage src={sub.creator.avatar} alt={sub.creator.displayName} />
                      ) : null}
                      <AvatarFallback name={sub.creator.displayName} />
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-deep-navy">{sub.creator.displayName}</p>
                      <p className="text-caption text-graphite/50">{sub.plan.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Discover Creators - Only show if no subscriptions */}
      {subscriptions.length === 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/explore">
            <Card interactive className="h-full">
              <CardContent className="p-4 h-full flex items-center justify-center">
                <div className="text-center">
                  <Plus className="h-8 w-8 text-nex-blue mx-auto mb-2" />
                  <p className="font-medium text-deep-navy">Descobrir Criadores</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Feed Posts */}
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-soft-gray flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-graphite/30" />
            </div>
            <h3 className="font-headline text-heading-md text-deep-navy mb-2">
              {subscriptions.length === 0 ? 'Nenhuma assinatura ainda' : 'Nenhum post ainda'}
            </h3>
            <p className="text-body-md text-graphite/60 mb-6">
              {subscriptions.length === 0
                ? 'Assine criadores para ver seus posts aqui.'
                : 'Os posts dos criadores que você apoia aparecerão aqui.'}
            </p>
            <Link href="/explore">
              <Button>Descobrir Criadores</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const isCreator = session?.user?.role === 'CREATOR'

  return isCreator ? <CreatorDashboard /> : <SubscriberDashboard />
}

