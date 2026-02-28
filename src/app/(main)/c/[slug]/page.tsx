'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Users,
  FileText,
  Calendar,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  CheckCircle2,
  Lock,
  Share2,
  Flag,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LikeButton } from '@/components/post/like-button'
import { CommentsSection } from '@/components/post/comments-section'
import { SaveButton } from '@/components/post/save-button'
import { ProtectedMedia } from '@/components/media/protected-media'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/components/ui/toaster'

interface Post {
  id: string
  title: string
  content: string | null
  isPublic: boolean
  createdAt: string
  media: any[]
  isLiked?: boolean
  isSaved?: boolean
  _count?: {
    likes: number
    comments: number
  }
}

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  benefits: string[]
}

interface Creator {
  id: string
  userId: string
  displayName: string
  slug: string
  avatar: string | null
  coverImage: string | null
  bio: string | null
  socialLinks: {
    twitter?: string
    instagram?: string
    youtube?: string
    website?: string
  } | null
  isVerified: boolean
  createdAt: string
  _count: {
    subscribers: number
    posts: number
  }
  plans: Plan[]
  posts: Post[]
}

const socialIcons = {
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
}

function PlanCard({ plan, featured = false }: { plan: Plan; featured?: boolean }) {
  const benefits = plan.benefits || []
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!session?.user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erro na API:', data)
        toast({
          title: 'Erro ao criar assinatura',
          description: data.error || 'Não foi possível processar sua solicitação. Verifique se o Stripe está configurado.',
          variant: 'destructive',
        })
        return
      }

      console.log('Resposta da API:', data)

      // Redirecionar para página de seleção de método de pagamento
      if (data.paymentSelectionUrl) {
        console.log('Redirecionando para seleção de pagamento:', data.paymentSelectionUrl)
        router.push(data.paymentSelectionUrl)
        return
      } else {
        console.error('paymentSelectionUrl não encontrado na resposta:', data)
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a assinatura. Verifique o console para mais detalhes.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Erro ao assinar:', error)
      toast({
        title: 'Erro ao assinar',
        description: error.message || 'Ocorreu um erro ao processar sua assinatura',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card className={featured ? 'border-nex-blue ring-2 ring-nex-blue/20' : ''}>
      <CardContent className="p-6">
        {featured && (
          <Badge variant="gradient" className="mb-3">
            Mais Popular
          </Badge>
        )}
        <h3 className="font-headline text-heading-md text-deep-navy mb-1">
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="font-headline text-display-sm text-nex-blue">
            {formatCurrency(plan.price / 100)}
          </span>
          <span className="text-body-sm text-graphite/50">/mês</span>
        </div>

        {benefits.length > 0 && (
          <ul className="space-y-2 mb-6">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-body-sm text-graphite/70">
                <CheckCircle2 className="h-4 w-4 text-nex-blue mt-0.5 shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        <Button
          className="w-full"
          variant={featured ? 'gradient' : 'default'}
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            'Assinar'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function PostCard({ post, isSubscribed, creatorUserId }: { post: Post; isSubscribed: boolean; creatorUserId?: string }) {
  const isLocked = !post.isPublic && !isSubscribed
  const likesCount = post._count?.likes || 0
  const commentsCount = post._count?.comments || 0
  const hasMedia = post.media && post.media.length > 0
  const firstMedia = hasMedia ? post.media[0] : null

  return (
    <Card className={isLocked ? 'relative overflow-hidden' : ''}>
      <CardContent className="p-6">
        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent z-10 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-soft-gray flex items-center justify-center mx-auto mb-3">
                <Lock className="h-5 w-5 text-graphite/50" />
              </div>
              <p className="text-body-sm text-graphite/70 mb-3">
                Este conteúdo é exclusivo para assinantes
              </p>
              <Button size="sm">Assinar para ver</Button>
            </div>
          </div>
        )}

        {/* Post header */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant={post.isPublic ? 'outline' : 'default'}>
            {post.isPublic ? 'Público' : 'Exclusivo'}
          </Badge>
          <span className="text-caption text-graphite/50">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>

        {/* Media Display */}
        {hasMedia && !isLocked && (
          <div className="mb-4">
            {/* Single media */}
            {post.media.length === 1 && firstMedia && (
              <div className="rounded-nex overflow-hidden">
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
              <div className={`grid gap-2 ${
                post.media.length === 2 ? 'grid-cols-2' : 
                post.media.length === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                {post.media.slice(0, 4).map((media: any, index: number) => (
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
        {hasMedia && isLocked && (
          <div className="bg-soft-gray rounded-nex h-48 mb-4 flex items-center justify-center">
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
                creatorUserId={creatorUserId}
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

export default function CreatorProfilePage() {
  const params = useParams()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCreator() {
      try {
        const response = await fetch(`/api/creator/${params.slug}`)
        if (response.ok) {
          const data = await response.json()
          setCreator(data.creator)
          // Usar o valor real de isSubscribed retornado pela API
          setIsSubscribed(data.isSubscribed || false)
        } else if (response.status === 404) {
          setError('Criador não encontrado')
        } else {
          setError('Erro ao carregar perfil')
        }
      } catch (err) {
        setError('Erro ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchCreator()
    }
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <h2 className="font-headline text-heading-lg text-deep-navy mb-2">
              {error || 'Criador não encontrado'}
            </h2>
            <p className="text-body-md text-graphite/60 mb-6">
              O perfil que você está procurando não existe ou foi removido.
            </p>
            <Link href="/explore">
              <Button>Explorar Criadores</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const socialLinks = creator.socialLinks || {}
  const subscriberCount = creator._count?.subscribers || 0
  const postCount = creator._count?.posts || 0

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-nex-gradient relative">
        {creator.coverImage && (
          <Image
            src={creator.coverImage}
            alt=""
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 mb-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            <Avatar size="xl" ring className="w-32 h-32 border-4 border-white">
              {creator.avatar ? (
                <AvatarImage src={creator.avatar} alt={creator.displayName} />
              ) : null}
              <AvatarFallback name={creator.displayName} className="text-3xl" />
            </Avatar>

            {/* Info */}
            <div className="flex-1 pb-2 pt-2 md:pt-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-headline text-display-sm text-deep-navy">
                  {creator.displayName}
                </h1>
                {creator.isVerified && (
                  <Badge variant="gradient">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
              <p className="text-body-md text-graphite/60">@{creator.slug}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Flag className="h-5 w-5" />
              </Button>
              {!isSubscribed && (
                <Button variant="gradient">Assinar</Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6 text-body-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-nex-blue" />
            <span className="font-semibold">{subscriberCount.toLocaleString()}</span>
            <span className="text-graphite/60">assinantes</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-nex-blue" />
            <span className="font-semibold">{postCount}</span>
            <span className="text-graphite/60">posts</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-nex-blue" />
            <span className="text-graphite/60">
              Desde {formatDate(creator.createdAt, { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-body-md text-graphite/80 max-w-2xl mb-6">
            {creator.bio}
          </p>
        )}

        {/* Social Links */}
        {Object.keys(socialLinks).length > 0 && (
          <div className="flex items-center gap-3 mb-8">
            {Object.entries(socialLinks).map(([key, url]) => {
              if (!url) return null
              const Icon = socialIcons[key as keyof typeof socialIcons]
              if (!Icon) return null
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-nex bg-white border border-[#E5E7EB] hover:border-nex-blue/30 hover:text-nex-blue transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              )
            })}
          </div>
        )}

        {/* Main Content */}
        <div className={`grid ${isSubscribed ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8 pb-16 lg:items-start`}>
          {/* Posts Column */}
          <div className={isSubscribed ? 'w-full' : 'lg:col-span-2'}>
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="about">Sobre</TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="space-y-6 !mt-0">
                {creator.posts && creator.posts.length > 0 ? (
                  creator.posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      isSubscribed={isSubscribed} 
                      creatorUserId={creator.userId}
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-graphite/20 mx-auto mb-4" />
                      <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                        Nenhum post ainda
                      </h3>
                      <p className="text-body-sm text-graphite/60">
                        Este criador ainda não publicou nenhum conteúdo.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="about">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-headline text-heading-md text-deep-navy mb-4">
                      Sobre {creator.displayName}
                    </h3>
                    <p className="text-body-md text-graphite/70 whitespace-pre-line">
                      {creator.bio || 'Este criador ainda não adicionou uma descrição.'}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Plans Column - Only show if user is not subscribed */}
          {!isSubscribed && (
            <div>
              <h2 className="font-headline text-heading-md text-deep-navy mb-4 lg:absolute lg:h-11 lg:mb-0 lg:top-0 flex items-center">
                Planos de Assinatura
              </h2>
              <div className="space-y-4 lg:pt-[68px]">
                {creator.plans && creator.plans.length > 0 ? (
                  creator.plans.map((plan, index) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      featured={index === 1}
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-body-sm text-graphite/60">
                        Nenhum plano disponível ainda.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
