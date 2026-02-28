'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

interface SaveButtonProps {
  postId: string
  initialSaved?: boolean
  onSaveChange?: (saved: boolean) => void
  className?: string
}

export function SaveButton({
  postId,
  initialSaved = false,
  onSaveChange,
  className,
}: SaveButtonProps) {
  const { data: session } = useSession()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  // Sync with initialSaved prop and check status if needed
  useEffect(() => {
    if (!session?.user) {
      setSaved(false)
      return
    }

    // If initialSaved was provided, use it, otherwise check
    if (initialSaved !== undefined) {
      setSaved(initialSaved)
    } else {
      // Check saved status from API
      const checkSavedStatus = async () => {
        try {
          const response = await fetch(`/api/post/${postId}/save`)
          if (response.ok) {
            const data = await response.json()
            setSaved(data.saved)
          }
        } catch (error) {
          console.error('Error checking saved status:', error)
        }
      }
      checkSavedStatus()
    }
  }, [session, postId, initialSaved])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      toast({
        title: 'Login necessário',
        description: 'Você precisa estar logado para salvar posts.',
        variant: 'warning',
      })
      return
    }

    setLoading(true)

    try {
      const method = saved ? 'DELETE' : 'POST'
      const response = await fetch(`/api/post/${postId}/save`, {
        method,
      })

      if (response.ok) {
        const newSaved = !saved
        setSaved(newSaved)
        
        toast({
          title: newSaved ? 'Post salvo!' : 'Post removido',
          description: newSaved 
            ? 'O post foi adicionado aos seus salvos.' 
            : 'O post foi removido dos seus salvos.',
          variant: 'success',
        })

        if (onSaveChange) {
          onSaveChange(newSaved)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar post')
      }
    } catch (error: any) {
      console.error('Error toggling save:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o post.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 text-graphite/60 hover:text-nex-blue transition-colors',
        saved && 'text-nex-blue',
        className
      )}
    >
      <Bookmark
        className={cn(
          'h-4 w-4 transition-all',
          saved && 'fill-current'
        )}
      />
      {saved ? 'Salvo' : 'Salvar'}
    </Button>
  )
}

