'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, Lock, Globe, Loader2, Image as ImageIcon, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toaster'
import { formatRelativeTime } from '@/lib/utils'

interface Media {
  id: string
  url: string
  type: 'IMAGE' | 'VIDEO'
}

interface Post {
  id: string
  title: string
  content: string | null
  isPublic: boolean
  publishedAt: string | null
  createdAt: string
  media?: Media[]
  _count?: {
    likes: number
    comments: number
  }
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch posts from API
  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/creator/post')
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts || [])
        } else {
          console.error('Error fetching posts')
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const handleDelete = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return

    try {
      const response = await fetch(`/api/creator/post/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== postId))
        toast({
          title: 'Post excluído',
          description: 'O post foi excluído com sucesso.',
          variant: 'success',
        })
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

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="font-headline text-display-sm text-deep-navy">Meus Posts</h1>
          <p className="text-body-md text-graphite/60">
            Gerencie seu conteúdo publicado ({posts.length} posts)
          </p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Novo Post
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mid-gray" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-soft-gray flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-graphite/30" />
              </div>
              <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                {searchQuery ? 'Nenhum post encontrado' : 'Nenhum post ainda'}
              </h3>
              <p className="text-body-md text-graphite/60 mb-6">
                {searchQuery
                  ? 'Tente uma busca diferente'
                  : 'Comece criando seu primeiro post'}
              </p>
              <Link href="/dashboard/posts/new">
                <Button>Criar Post</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-nex-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Media Thumbnail */}
                  {post.media && post.media.length > 0 && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-nex overflow-hidden bg-soft-gray">
                      {post.media[0].type === 'VIDEO' ? (
                        <div className="w-full h-full flex items-center justify-center bg-deep-navy/10">
                          <Video className="h-8 w-8 text-graphite/40" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.media[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      {post.media.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                          +{post.media.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-2">
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
                      {post.media && post.media.length > 0 && (
                        <Badge variant="outline">
                          {post.media[0].type === 'VIDEO' ? (
                            <>
                              <Video className="h-3 w-3 mr-1" />
                              Vídeo
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {post.media.length} {post.media.length === 1 ? 'imagem' : 'imagens'}
                            </>
                          )}
                        </Badge>
                      )}
                      <span className="text-caption text-graphite/50">
                        {formatRelativeTime(post.publishedAt || post.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-headline text-heading-md text-deep-navy mb-2 truncate">
                      {post.title}
                    </h3>

                    {/* Content Preview */}
                    {post.content && (
                      <p className="text-body-sm text-graphite/60 line-clamp-2 mb-4">
                        {post.content}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-caption text-graphite/50">
                      <span>❤️ {post._count?.likes || 0}</span>
                      <span>💬 {post._count?.comments || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/posts/${post.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/posts/${post.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive cursor-pointer"
                        onSelect={(e) => {
                          e.preventDefault()
                          handleDelete(post.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
