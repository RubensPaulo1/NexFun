'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bookmark, Heart, MessageCircle, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface SavedPost {
  id: string
  title: string
  content: string | null
  savedAt: string
  creator: {
    id: string
    displayName: string
    slug: string
    avatar: string | null
  }
  media: Array<{
    id: string
    url: string
    type: string
    thumbnail: string | null
  }>
  likesCount: number
  commentsCount: number
  publishedAt: string | null
}

export default function SavedPage() {
  const { data: session } = useSession()
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchSavedPosts()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchSavedPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/saved-posts')
      
      if (response.ok) {
        const data = await response.json()
        setSavedPosts(data.posts || [])
      } else {
        console.error('Erro ao buscar posts salvos')
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os posts salvos.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao buscar posts salvos:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os posts salvos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (postId: string) => {
    try {
      setRemoving(postId)
      const response = await fetch(`/api/post/${postId}/save`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from list
        setSavedPosts(savedPosts.filter((p) => p.id !== postId))
        toast({
          title: 'Post removido',
          description: 'O post foi removido dos seus salvos.',
          variant: 'success',
        })
      } else {
        throw new Error('Erro ao remover post')
      }
    } catch (error) {
      console.error('Erro ao remover post:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o post dos salvos.',
        variant: 'destructive',
      })
    } finally {
      setRemoving(null)
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
      <div>
        <h1 className="font-headline text-display-sm text-deep-navy">Posts Salvos</h1>
        <p className="text-body-md text-graphite/60">
          Conteúdos que você salvou para ver depois
        </p>
      </div>

      {/* Saved Posts */}
      {savedPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bookmark className="h-12 w-12 text-graphite/20 mx-auto mb-4" />
            <h3 className="font-headline text-heading-md text-deep-navy mb-2">
              Nenhum post salvo
            </h3>
            <p className="text-body-md text-graphite/60 mb-6">
              Clique no ícone de bookmark nos posts para salvá-los aqui
            </p>
            <Link href="/explore">
              <Button>Explorar Conteúdo</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post) => {
            const savedAt = new Date(post.savedAt)
            const hasMedia = post.media && post.media.length > 0
            const firstMedia = hasMedia ? post.media[0] : null

            return (
              <Card key={post.id} className="hover:shadow-nex-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      {post.creator.avatar ? (
                        <AvatarImage src={post.creator.avatar} alt={post.creator.displayName} />
                      ) : null}
                      <AvatarFallback name={post.creator.displayName} />
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Creator info */}
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/c/${post.creator.slug}`}
                          className="font-medium text-deep-navy hover:text-nex-blue"
                        >
                          {post.creator.displayName}
                        </Link>
                        <span className="text-caption text-graphite/50">
                          • Salvo {formatRelativeTime(savedAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                        {post.title}
                      </h3>

                      {/* Content Preview */}
                      {post.content && (
                        <p className="text-body-sm text-graphite/60 line-clamp-2 mb-4">
                          {post.content}
                        </p>
                      )}

                      {/* Media Preview */}
                      {firstMedia && firstMedia.type === 'IMAGE' && (
                        <div className="mb-4 rounded-nex overflow-hidden">
                          <img
                            src={firstMedia.thumbnail || firstMedia.url}
                            alt={post.title}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}

                      {/* Stats & Actions */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 text-caption text-graphite/50">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likesCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.commentsCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(post.id)}
                            disabled={removing === post.id}
                          >
                            {removing === post.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Bookmark className="h-4 w-4 mr-1 fill-current" />
                            )}
                            Remover
                          </Button>
                          <Link href={`/c/${post.creator.slug}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Ver post
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
