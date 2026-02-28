'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Video,
  Eye,
  Lock,
  Upload,
  X,
  Plus,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { createPostSchema, type CreatePostInput } from '@/lib/validations/creator'

// Plan type
interface Plan {
  id: string
  name: string
  price: number
}

interface UploadedMedia {
  file: File
  preview: string
  url?: string
  type: 'IMAGE' | 'VIDEO'
  uploading?: boolean
  error?: string
}

export default function NewPostPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [mediaFiles, setMediaFiles] = useState<UploadedMedia[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Fetch plans from API
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/creator/plan')
        if (response.ok) {
          const data = await response.json()
          setPlans(data.plans || [])
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setLoadingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach((media) => {
        if (media.preview) {
          URL.revokeObjectURL(media.preview)
        }
      })
    }
  }, [mediaFiles])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      isPublic: true,
    },
  })

  const isPublic = watch('isPublic')

  const togglePlan = (planId: string) => {
    setSelectedPlans((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    )
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + mediaFiles.length > 10) {
      toast({
        title: 'Limite excedido',
        description: 'Máximo de 10 arquivos por post.',
        variant: 'warning',
      })
      return
    }

    // Create preview and add to list
    const newMedia: UploadedMedia[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      uploading: true,
    }))

    setMediaFiles((prev) => [...prev, ...newMedia])

    // Upload each file
    for (let i = 0; i < newMedia.length; i++) {
      const media = newMedia[i]
      try {
        const formData = new FormData()
        formData.append('file', media.file)

        const response = await fetch('/api/upload/local', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao fazer upload')
        }

        const result = await response.json()

        // Update media with URL
        setMediaFiles((prev) =>
          prev.map((m) =>
            m.preview === media.preview
              ? { ...m, url: result.fileUrl, uploading: false }
              : m
          )
        )
      } catch (error: any) {
        console.error('Upload error:', error)
        // Mark as error
        setMediaFiles((prev) =>
          prev.map((m) =>
            m.preview === media.preview
              ? { ...m, uploading: false, error: error.message }
              : m
          )
        )
        toast({
          title: 'Erro no upload',
          description: error.message || 'Não foi possível fazer upload do arquivo.',
          variant: 'destructive',
        })
      }
    }
  }

  const removeMedia = (index: number) => {
    const media = mediaFiles[index]
    if (media.preview) {
      URL.revokeObjectURL(media.preview)
    }
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CreatePostInput) => {
    // Validate for exclusive posts
    if (!data.isPublic && selectedPlans.length === 0) {
      toast({
        title: 'Selecione os planos',
        description: 'Para posts exclusivos, selecione pelo menos um plano.',
        variant: 'warning',
      })
      return
    }

    // Check if any media is still uploading
    if (mediaFiles.some((m) => m.uploading)) {
      toast({
        title: 'Aguarde',
        description: 'Alguns arquivos ainda estão sendo enviados.',
        variant: 'warning',
      })
      return
    }

    // Check for upload errors
    const failedUploads = mediaFiles.filter((m) => m.error)
    if (failedUploads.length > 0) {
      toast({
        title: 'Erro nos uploads',
        description: 'Remova os arquivos com erro antes de publicar.',
        variant: 'warning',
      })
      return
    }

    try {
      setIsLoading(true)

      // Get successfully uploaded media URLs
      const mediaUrls = mediaFiles
        .filter((m) => m.url)
        .map((m) => ({
          url: m.url!,
          type: m.type,
        }))

      const response = await fetch('/api/creator/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          isPublic: data.isPublic,
          planIds: data.isPublic ? [] : selectedPlans,
          media: mediaUrls,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar post')
      }

      toast({
        title: 'Post criado! 🎉',
        description: 'Seu post foi publicado com sucesso.',
        variant: 'success',
      })

      router.push('/dashboard/posts')
    } catch (error: any) {
      console.error('Error creating post:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o post.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-display-sm text-deep-navy">Novo Post</h1>
          <p className="text-body-sm text-graphite/60">
            Crie conteúdo para seus assinantes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Content Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Title */}
            <Input
              label="Título do Post"
              placeholder="Ex: Tutorial: Como criar ilustrações incríveis"
              error={errors.title?.message}
              {...register('title')}
            />

            {/* Content */}
            <div>
              <label className="input-label">Conteúdo</label>
              <textarea
                className="input-field min-h-[200px] resize-y"
                placeholder="Escreva o conteúdo do seu post aqui..."
                {...register('content')}
              />
              {errors.content && (
                <p className="input-error">{errors.content.message}</p>
              )}
            </div>

            {/* Media Upload */}
            <div>
              <label className="input-label">Mídia (opcional)</label>
              <div className="border-2 border-dashed border-mid-gray rounded-nex p-6 text-center hover:border-nex-blue/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 text-mid-gray mx-auto mb-3" />
                  <p className="text-body-md text-graphite/70 mb-1">
                    Arraste arquivos aqui ou clique para fazer upload
                  </p>
                  <p className="text-caption text-graphite/50">
                    Imagens (JPG, PNG, GIF, WebP) ou Vídeos (MP4, WebM) • Máx. 10 arquivos • Tamanho máximo: 2GB por arquivo
                  </p>
                </label>
              </div>

              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {mediaFiles.map((media, index) => (
                    <div
                      key={index}
                      className={`relative aspect-square rounded-nex overflow-hidden group ${
                        media.error ? 'ring-2 ring-red-500' : ''
                      }`}
                    >
                      {media.type === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={media.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-soft-gray flex items-center justify-center">
                          <Video className="h-8 w-8 text-graphite/30" />
                        </div>
                      )}
                      
                      {/* Loading overlay */}
                      {media.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      
                      {/* Error overlay */}
                      {media.error && (
                        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
                          <p className="text-white text-xs text-center">Erro</p>
                        </div>
                      )}
                      
                      {/* Success indicator */}
                      {media.url && !media.uploading && (
                        <div className="absolute bottom-1 left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-deep-navy/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length < 10 && (
                    <label
                      htmlFor="media-upload"
                      className="aspect-square rounded-nex border-2 border-dashed border-mid-gray flex items-center justify-center cursor-pointer hover:border-nex-blue/50 transition-colors"
                    >
                      <Plus className="h-6 w-6 text-mid-gray" />
                    </label>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visibility Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Visibilidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Public Toggle */}
            <div className="flex items-center justify-between p-4 rounded-nex bg-soft-gray">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Eye className="h-5 w-5 text-nex-blue" />
                ) : (
                  <Lock className="h-5 w-5 text-graphite/50" />
                )}
                <div>
                  <p className="font-medium text-deep-navy">
                    {isPublic ? 'Post Público' : 'Post Exclusivo'}
                  </p>
                  <p className="text-caption text-graphite/50">
                    {isPublic
                      ? 'Visível para todos os visitantes'
                      : 'Visível apenas para assinantes selecionados'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isPublic}
                  onChange={(e) => setValue('isPublic', e.target.checked)}
                />
                <div className="w-11 h-6 bg-mid-gray peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-nex-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nex-blue" />
              </label>
            </div>

            {/* Plan Selection (only for exclusive posts) */}
            {!isPublic && (
              <div>
                <label className="input-label">Planos com acesso</label>
                <p className="text-caption text-graphite/50 mb-3">
                  Selecione quais planos terão acesso a este conteúdo
                </p>
                {loadingPlans ? (
                  <p className="text-caption text-graphite/50">Carregando planos...</p>
                ) : plans.length === 0 ? (
                  <p className="text-caption text-amber-600">
                    Você ainda não criou planos. Crie um plano nas configurações primeiro.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => togglePlan(plan.id)}
                        className={`px-4 py-2 rounded-nex border transition-colors ${
                          selectedPlans.includes(plan.id)
                            ? 'border-nex-blue bg-nex-blue/10 text-nex-blue'
                            : 'border-mid-gray text-graphite/70 hover:border-graphite/30'
                        }`}
                      >
                        {plan.name}
                      </button>
                    ))}
                  </div>
                )}
                {!isPublic && selectedPlans.length === 0 && plans.length > 0 && (
                  <p className="text-caption text-amber-600 mt-2">
                    Selecione pelo menos um plano para posts exclusivos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/posts">
            <Button variant="ghost" type="button">Cancelar</Button>
          </Link>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={mediaFiles.some((m) => m.uploading)}
          >
            Publicar Post
          </Button>
        </div>
      </form>
    </div>
  )
}
