'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { createPostSchema, type CreatePostInput } from '@/lib/validations/creator'

interface Post {
  id: string
  title: string
  content: string | null
  isPublic: boolean
  isPinned: boolean
  planAccess: any[]
}

interface Plan {
  id: string
  name: string
  price: number
}

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  })

  // Fetch post and plans
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch post
        const postResponse = await fetch('/api/creator/post')
        if (postResponse.ok) {
          const postData = await postResponse.json()
          const foundPost = postData.posts?.find((p: Post) => p.id === params.id)
          if (foundPost) {
            setPost(foundPost)
            setValue('title', foundPost.title)
            setValue('content', foundPost.content || '')
            setIsPublic(foundPost.isPublic)
            setSelectedPlans(foundPost.planAccess?.map((pa: any) => pa.planId) || [])
          }
        }

        // Fetch plans
        const plansResponse = await fetch('/api/creator/plan')
        if (plansResponse.ok) {
          const plansData = await plansResponse.json()
          setPlans(plansData.plans || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id, setValue])

  const onSubmit = async (data: CreatePostInput) => {
    try {
      setSaving(true)

      const response = await fetch(`/api/creator/post/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          isPublic,
          planIds: isPublic ? [] : selectedPlans,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar post')
      }

      toast({
        title: 'Post atualizado! ✏️',
        description: 'Suas alterações foram salvas com sucesso.',
        variant: 'success',
      })

      router.push('/dashboard/posts')
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const togglePlan = (planId: string) => {
    setSelectedPlans((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    )
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-headline text-display-sm text-deep-navy">
            Editar Post
          </h1>
          <p className="text-body-md text-graphite/60">
            Atualize o conteúdo do seu post
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-deep-navy mb-2">
                Título *
              </label>
              <Input
                {...register('title')}
                placeholder="Digite um título chamativo..."
              />
              {errors.title && (
                <p className="text-caption text-energy-coral mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-deep-navy mb-2">
                Conteúdo
              </label>
              <textarea
                {...register('content')}
                rows={8}
                className="flex w-full rounded-nex border border-[#E5E7EB] bg-white px-4 py-3 text-body-md text-graphite placeholder:text-mid-gray focus:outline-none focus:ring-2 focus:ring-nex-blue/20 focus:border-nex-blue transition-all resize-none"
                placeholder="Escreva seu conteúdo aqui..."
              />
              {errors.content && (
                <p className="text-caption text-energy-coral mt-1">
                  {errors.content.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Visibilidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-4 rounded-nex border-2 text-left transition-all ${
                  isPublic
                    ? 'border-nex-blue bg-nex-blue/5'
                    : 'border-[#E5E7EB] hover:border-mid-gray'
                }`}
              >
                <div className="text-2xl mb-2">🌍</div>
                <h3 className="font-headline text-heading-sm text-deep-navy">
                  Público
                </h3>
                <p className="text-caption text-graphite/60">
                  Todos podem ver
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-4 rounded-nex border-2 text-left transition-all ${
                  !isPublic
                    ? 'border-nex-blue bg-nex-blue/5'
                    : 'border-[#E5E7EB] hover:border-mid-gray'
                }`}
              >
                <div className="text-2xl mb-2">🔒</div>
                <h3 className="font-headline text-heading-sm text-deep-navy">
                  Exclusivo
                </h3>
                <p className="text-caption text-graphite/60">
                  Apenas assinantes
                </p>
              </button>
            </div>

            {/* Plan Selection */}
            {!isPublic && plans.length > 0 && (
              <div className="pt-4 border-t border-[#E5E7EB]">
                <label className="block text-body-sm font-medium text-deep-navy mb-3">
                  Quais planos terão acesso?
                </label>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex items-center justify-between p-3 rounded-nex border cursor-pointer transition-all ${
                        selectedPlans.includes(plan.id)
                          ? 'border-nex-blue bg-nex-blue/5'
                          : 'border-[#E5E7EB] hover:border-mid-gray'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPlans.includes(plan.id)}
                          onChange={() => togglePlan(plan.id)}
                          className="rounded border-mid-gray text-nex-blue focus:ring-nex-blue"
                        />
                        <span className="font-medium text-deep-navy">
                          {plan.name}
                        </span>
                      </div>
                      <span className="text-body-sm text-graphite/60">
                        R$ {(plan.price / 100).toFixed(2)}/mês
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/posts">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            leftIcon={
              saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )
            }
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}


