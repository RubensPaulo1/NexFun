'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: string
  initialLiked?: boolean
  initialCount?: number
  onLikeChange?: (liked: boolean, count: number) => void
}

export function LikeButton({
  postId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
}: LikeButtonProps) {
  const { data: session } = useSession()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async () => {
    if (!session) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para curtir.',
        variant: 'warning',
      })
      return
    }

    if (isLoading) return

    // Optimistic update
    const newLiked = !liked
    const newCount = newLiked ? count + 1 : count - 1
    setLiked(newLiked)
    setCount(newCount)

    try {
      setIsLoading(true)
      const response = await fetch(`/api/post/${postId}/like`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erro ao curtir')
      }

      const data = await response.json()
      setLiked(data.liked)
      setCount(data.likesCount)
      onLikeChange?.(data.liked, data.likesCount)
    } catch (error) {
      // Revert on error
      setLiked(liked)
      setCount(count)
      toast({
        title: 'Erro',
        description: 'Não foi possível curtir o post.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-1.5 text-body-sm transition-colors',
        liked
          ? 'text-energy-coral'
          : 'text-graphite/60 hover:text-energy-coral'
      )}
    >
      <Heart
        className={cn('h-4 w-4 transition-all', liked && 'fill-current scale-110')}
      />
      <span>{count}</span>
    </button>
  )
}


