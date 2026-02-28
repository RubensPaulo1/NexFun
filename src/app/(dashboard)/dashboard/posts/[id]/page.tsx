'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Globe, Lock, Calendar, Heart, MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedMedia } from '@/components/media/protected-media'
import { toast } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  title: string
  content: string | null
  isPublic: boolean
  isPinned: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  media: any[]
  planAccess: any[]
  _count?: {
    likes: number
    comments: number
  }
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPost() {
      try {
        // For now, fetch all posts and find the one we need
        // In production, you'd have a dedicated endpoint like /api/creator/post/[id]
        const response = await fetch('/api/creator/post')
        if (response.ok) {
          const data = await response.json()
          const foundPost = data.posts?.find((p: Post) => p.id === params.id)
          if (foundPost) {
            setPost(foundPost)
          }
        }
      } catch (error) {
        console.error('Error fetching post:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return

    try {
      const response = await fetch(`/api/creator/post/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Post excluído',
          description: 'O post foi excluído com sucesso.',
          variant: 'success',
        })
        router.push('/dashboard/posts')
      } else {
        throw new Error('Erro ao excluir')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o post.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="font-headline text-heading-lg text-deep-navy mb-2">
              Post não encontrado
            </h2>
            <p className="text-body-md text-graphite/60 mb-6">
              O post que você está procurando não existe ou foi excluído.
            </p>
            <Link href="/dashboard/posts">
              <Button>Voltar para Posts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/posts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-headline text-display-sm text-deep-navy">
              Visualizar Post
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/posts/${post.id}/edit`}>
            <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
              Editar
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={handleDelete}
          >
            Excluir
          </Button>
        </div>
      </div>

      {/* Post Content */}
      <Card>
        <CardContent className="p-6">
          {/* Meta info */}
          <div className="flex items-center gap-3 mb-4">
            <Badge variant={post.isPublic ? 'outline' : 'default'}>
              {post.isPublic ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Público
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Exclusivo
                </>
              )}
            </Badge>
            {post.isPinned && (
              <Badge variant="warning">📌 Fixado</Badge>
            )}
            <span className="text-caption text-graphite/50 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-headline text-display-sm text-deep-navy mb-4">
            {post.title}
          </h2>

          {/* Content */}
          {post.content ? (
            <div className="prose prose-gray max-w-none">
              <p className="text-body-md text-graphite/80 whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          ) : (
            <p className="text-body-md text-graphite/50 italic">
              Este post não possui conteúdo de texto.
            </p>
          )}

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="mt-6">
              <h3 className="font-headline text-heading-sm text-deep-navy mb-3">
                Mídia ({post.media.length})
              </h3>
              <div className={`grid gap-3 ${
                post.media.length === 1 ? 'grid-cols-1' :
                post.media.length === 2 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
                {post.media.map((media: any, index: number) => (
                  <div
                    key={media.id || index}
                    className="rounded-nex overflow-hidden bg-black"
                  >
                    <ProtectedMedia
                      src={media.url}
                      alt={`Mídia ${index + 1}`}
                      type={media.type}
                      className="rounded-nex"
                      maxHeight="300px"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Access */}
          {!post.isPublic && post.planAccess && post.planAccess.length > 0 && (
            <div className="mt-6 p-4 rounded-nex bg-soft-gray">
              <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                Acesso por Plano
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.planAccess.map((access: any, index: number) => (
                  <Badge key={index} variant="default">
                    {access.plan?.name || 'Plano'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-graphite/60">
              <Heart className="h-5 w-5" />
              <span className="text-body-md">{post._count?.likes || 0} curtidas</span>
            </div>
            <div className="flex items-center gap-2 text-graphite/60">
              <MessageCircle className="h-5 w-5" />
              <span className="text-body-md">{post._count?.comments || 0} comentários</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-body-sm">
            <div>
              <dt className="text-graphite/50">ID do Post</dt>
              <dd className="font-mono text-deep-navy">{post.id}</dd>
            </div>
            <div>
              <dt className="text-graphite/50">Criado em</dt>
              <dd className="text-deep-navy">{formatDate(post.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-graphite/50">Publicado em</dt>
              <dd className="text-deep-navy">
                {post.publishedAt ? formatDate(post.publishedAt) : 'Não publicado'}
              </dd>
            </div>
            <div>
              <dt className="text-graphite/50">Última atualização</dt>
              <dd className="text-deep-navy">{formatDate(post.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

