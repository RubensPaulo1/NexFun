'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/components/ui/toaster'
import { formatRelativeTime } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
}

interface CommentsSectionProps {
  postId: string
  initialCount?: number
  creatorUserId?: string
}

export function CommentsSection({
  postId,
  initialCount = 0,
  creatorUserId,
}: CommentsSectionProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [count, setCount] = useState(initialCount)
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Fetch comments when section is opened
  useEffect(() => {
    if (isOpen && comments.length === 0) {
      fetchComments()
    }
  }, [isOpen])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/post/${postId}/comment`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setCount(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para comentar.',
        variant: 'warning',
      })
      return
    }

    if (!newComment.trim()) return

    try {
      setIsSending(true)
      const response = await fetch(`/api/post/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao comentar')
      }

      const data = await response.json()
      setComments([data.comment, ...comments])
      setCount(count + 1)
      setNewComment('')
      
      toast({
        title: 'Comentário adicionado! 💬',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar o comentário.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Excluir este comentário?')) return

    try {
      const response = await fetch(`/api/post/${postId}/comment?commentId=${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir')
      }

      setComments(comments.filter((c) => c.id !== commentId))
      setCount(count - 1)
      
      toast({
        title: 'Comentário excluído',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o comentário.',
        variant: 'destructive',
      })
    }
  }

  const canDelete = (comment: Comment) => {
    if (!session?.user?.id) return false
    return comment.user.id === session.user.id || session.user.id === creatorUserId
  }

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-body-sm text-graphite/60 hover:text-nex-blue transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{count}</span>
      </button>

      {/* Comments panel */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
          {/* New comment form */}
          {session ? (
            <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
              <Avatar size="sm">
                {session.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session.user.name || ''} />
                ) : null}
                <AvatarFallback name={session.user?.name || 'U'} />
              </Avatar>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 px-3 py-2 rounded-nex border border-[#E5E7EB] text-body-sm focus:outline-none focus:ring-2 focus:ring-nex-blue/20 focus:border-nex-blue"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-body-sm text-graphite/50 mb-4">
              <a href="/login" className="text-nex-blue hover:underline">
                Faça login
              </a>{' '}
              para comentar.
            </p>
          )}

          {/* Comments list */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-nex-blue" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-body-sm text-graphite/50 text-center py-4">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Avatar size="sm">
                    {comment.user.avatar ? (
                      <AvatarImage src={comment.user.avatar} alt={comment.user.name || ''} />
                    ) : null}
                    <AvatarFallback name={comment.user.name || 'U'} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-body-sm text-deep-navy">
                        {comment.user.name || 'Usuário'}
                      </span>
                      <span className="text-caption text-graphite/40">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      {canDelete(comment) && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-graphite/40 hover:text-energy-coral transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-body-sm text-graphite/70 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


