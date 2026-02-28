'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, CreditCard, Bell, Shield, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  benefits: string[]
  isActive: boolean
  _count?: {
    subscriptions: number
  }
}

interface PlanFormData {
  name: string
  description: string
  price: string
  benefits: string[]
}

const defaultPlanForm: PlanFormData = {
  name: '',
  description: '',
  price: '',
  benefits: [''],
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState<PlanFormData>(defaultPlanForm)
  const [savingPlan, setSavingPlan] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(session?.user?.avatar || null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Profile form state
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [slug, setSlug] = useState('')
  const [bio, setBio] = useState('')
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    instagram: '',
    youtube: '',
    website: '',
  })

  const isCreator = session?.user?.role === 'CREATOR'

  // Fetch profile data and plans
  useEffect(() => {
    if (session?.user) {
      fetchProfile()
      if (isCreator) {
        fetchPlans()
      }
    }
  }, [session?.user, isCreator])

  // Update avatar when session changes
  useEffect(() => {
    if (session?.user?.avatar) {
      setAvatar(session.user.avatar)
    }
  }, [session?.user?.avatar])

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true)
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        const user = data.user
        
        // Set user fields
        setName(user.name || '')
        setBio(user.bio || '')
        setAvatar(user.avatar || null)
        
        // Set creator profile fields
        if (user.creatorProfile) {
          setDisplayName(user.creatorProfile.displayName || '')
          setSlug(user.creatorProfile.slug || '')
          if (user.creatorProfile.socialLinks) {
            setSocialLinks({
              twitter: user.creatorProfile.socialLinks.twitter || '',
              instagram: user.creatorProfile.socialLinks.instagram || '',
              youtube: user.creatorProfile.socialLinks.youtube || '',
              website: user.creatorProfile.socialLinks.website || '',
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true)
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

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, use uma imagem JPG, PNG, GIF ou WebP.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 2MB.',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploadingAvatar(true)

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setAvatar(previewUrl)

      // Upload file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload/local', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const uploadData = await uploadResponse.json()
      const avatarUrl = uploadData.fileUrl

      // Update user profile with new avatar
      const updateResponse = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: avatarUrl }),
      })

      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        throw new Error(error.error || 'Erro ao atualizar perfil')
      }

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          avatar: avatarUrl,
        },
      })

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
        variant: 'success',
      })

      // Refresh the page to update all components
      router.refresh()
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      // Reset to original avatar on error
      setAvatar(session?.user?.avatar || null)
      toast({
        title: 'Erro ao atualizar foto',
        description: error.message || 'Não foi possível atualizar sua foto de perfil.',
        variant: 'destructive',
      })
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true)

      // Prepare update data
      const updateData: any = {
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
      }

      // If creator, add creator profile data
      if (isCreator) {
        // Filter out empty social links
        const filteredSocialLinks: any = {}
        if (socialLinks.twitter?.trim()) filteredSocialLinks.twitter = socialLinks.twitter.trim()
        if (socialLinks.instagram?.trim()) filteredSocialLinks.instagram = socialLinks.instagram.trim()
        if (socialLinks.youtube?.trim()) filteredSocialLinks.youtube = socialLinks.youtube.trim()
        if (socialLinks.website?.trim()) filteredSocialLinks.website = socialLinks.website.trim()

        updateData.creatorProfile = {
          displayName: displayName.trim() || undefined,
          slug: slug.trim() || undefined,
          // Bio is stored in User model, not CreatorProfile
          socialLinks: Object.keys(filteredSocialLinks).length > 0 ? filteredSocialLinks : undefined,
        }
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      if (updateData.creatorProfile) {
        Object.keys(updateData.creatorProfile).forEach(key => {
          if (updateData.creatorProfile[key] === undefined) {
            delete updateData.creatorProfile[key]
          }
        })
      }

      // Send update request
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar perfil')
      }

      // Update session if name changed
      if (updateData.name && updateData.name !== session?.user?.name) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: updateData.name,
          },
        })
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Suas alterações foram salvas com sucesso.',
        variant: 'success',
      })

      // Refresh profile data
      await fetchProfile()
      
      // Refresh page to update all components
      router.refresh()
      
      // If slug changed, redirect to new profile URL
      if (updateData.creatorProfile?.slug && updateData.creatorProfile.slug !== slug && isCreator) {
        setTimeout(() => {
          router.push(`/c/${updateData.creatorProfile.slug}`)
        }, 1000)
      }
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openNewPlanModal = () => {
    setEditingPlan(null)
    setPlanForm(defaultPlanForm)
    setShowPlanModal(true)
  }

  const openEditPlanModal = (plan: Plan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: (plan.price / 100).toFixed(2).replace('.', ','),
      benefits: plan.benefits.length > 0 ? plan.benefits : [''],
    })
    setShowPlanModal(true)
  }

  const closePlanModal = () => {
    setShowPlanModal(false)
    setEditingPlan(null)
    setPlanForm(defaultPlanForm)
  }

  const addBenefit = () => {
    setPlanForm((prev) => ({
      ...prev,
      benefits: [...prev.benefits, ''],
    }))
  }

  const removeBenefit = (index: number) => {
    setPlanForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }))
  }

  const updateBenefit = (index: number, value: string) => {
    setPlanForm((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => (i === index ? value : b)),
    }))
  }

  const handleSavePlan = async () => {
    // Validate
    if (!planForm.name.trim()) {
      toast({ title: 'Erro', description: 'Nome do plano é obrigatório', variant: 'destructive' })
      return
    }

    const priceValue = parseFloat(planForm.price.replace(',', '.'))
    if (isNaN(priceValue) || priceValue < 1) {
      toast({ title: 'Erro', description: 'Preço mínimo é R$ 1,00', variant: 'destructive' })
      return
    }

    const benefits = planForm.benefits.filter((b) => b.trim())
    if (benefits.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um benefício', variant: 'destructive' })
      return
    }

    try {
      setSavingPlan(true)

      const planData = {
        name: planForm.name.trim(),
        description: planForm.description.trim() || null,
        price: Math.round(priceValue * 100), // Convert to cents
        benefits,
      }

      let response
      if (editingPlan) {
        // Update existing plan
        response = await fetch(`/api/creator/plan/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData),
        })
      } else {
        // Create new plan
        response = await fetch('/api/creator/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...planData,
            currency: 'BRL',
            interval: 'MONTHLY',
          }),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar plano')
      }

      toast({
        title: editingPlan ? 'Plano atualizado!' : 'Plano criado!',
        description: editingPlan
          ? 'As alterações foram salvas.'
          : 'Seu novo plano está disponível para assinatura.',
        variant: 'success',
      })

      closePlanModal()
      fetchPlans()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o plano.',
        variant: 'destructive',
      })
    } finally {
      setSavingPlan(false)
    }
  }

  const handleDeletePlan = async (plan: Plan) => {
    const hasSubscribers = (plan._count?.subscriptions || 0) > 0
    const message = hasSubscribers
      ? `Este plano tem ${plan._count?.subscriptions} assinante(s). O plano será desativado mas os assinantes atuais manterão acesso. Continuar?`
      : 'Tem certeza que deseja excluir este plano?'

    if (!confirm(message)) return

    try {
      const response = await fetch(`/api/creator/plan/${plan.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir plano')
      }

      const result = await response.json()

      toast({
        title: result.softDeleted ? 'Plano desativado' : 'Plano excluído',
        description: result.message,
        variant: 'success',
      })

      fetchPlans()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o plano.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-headline text-display-sm text-deep-navy">Configurações</h1>
        <p className="text-body-md text-graphite/60">
          Gerencie sua conta e preferências
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          {isCreator && (
            <TabsTrigger value="plans">
              <CreditCard className="h-4 w-4 mr-2" />
              Planos
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
                <CardDescription>
                  Esta foto será exibida em seu perfil e em comentários.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar size="xl">
                      {avatar ? (
                        <AvatarImage src={avatar} alt={session?.user?.name || 'User'} />
                      ) : null}
                      <AvatarFallback name={session?.user?.name || 'User'} />
                    </Avatar>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingAvatar}
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Camera className="h-4 w-4" />
                        {uploadingAvatar ? 'Enviando...' : 'Alterar foto'}
                      </Button>
                    </label>
                    <p className="text-caption text-graphite/50">
                      JPG, PNG, GIF ou WebP. Máx. 2MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-nex-blue" />
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={session?.user?.email || ''}
                        disabled
                        hint="O email não pode ser alterado"
                      />
                    </div>
                    {isCreator && (
                      <>
                        <Input
                          label="Nome de exibição"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Ex: Marina Costa"
                        />
                        <Input
                          label="URL do perfil"
                          value={slug}
                          onChange={(e) => {
                            // Only allow lowercase letters, numbers, and hyphens
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                            setSlug(value)
                          }}
                          placeholder="seu-nome"
                          hint="nexfan.com/c/seu-nome"
                        />
                        <div>
                          <label className="input-label">Bio</label>
                          <textarea
                            className="input-field min-h-[100px]"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Conte um pouco sobre você e seu conteúdo..."
                            maxLength={500}
                          />
                          <p className="text-caption text-graphite/50 mt-1">
                            {bio.length}/500 caracteres
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Social Links (creators only) */}
            {isCreator && (
              <Card>
                <CardHeader>
                  <CardTitle>Links Sociais</CardTitle>
                  <CardDescription>
                    Adicione links para suas outras redes sociais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingProfile ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-nex-blue" />
                    </div>
                  ) : (
                    <>
                      <Input 
                        label="Twitter" 
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                        placeholder="https://twitter.com/seu-usuario" 
                      />
                      <Input 
                        label="Instagram" 
                        value={socialLinks.instagram}
                        onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                        placeholder="https://instagram.com/seu-usuario" 
                      />
                      <Input 
                        label="YouTube" 
                        value={socialLinks.youtube}
                        onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                        placeholder="https://youtube.com/seu-canal" 
                      />
                      <Input 
                        label="Website" 
                        value={socialLinks.website}
                        onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                        placeholder="https://seu-site.com" 
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} isLoading={isLoading}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Plans Tab (creators only) */}
        {isCreator && (
          <TabsContent value="plans">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Seus Planos de Assinatura</CardTitle>
                    <CardDescription>
                      Gerencie os planos disponíveis para seus fãs. O preço definido aqui será cobrado dos assinantes.
                    </CardDescription>
                  </div>
                  <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNewPlanModal}>
                    Novo Plano
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingPlans ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-nex-blue" />
                    </div>
                  ) : plans.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-graphite/20 mx-auto mb-4" />
                      <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                        Nenhum plano criado
                      </h3>
                      <p className="text-body-sm text-graphite/60 mb-4">
                        Crie seu primeiro plano de assinatura para começar a receber apoio.
                      </p>
                      <Button onClick={openNewPlanModal}>Criar Primeiro Plano</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`flex items-center justify-between p-4 rounded-nex border ${
                            plan.isActive ? 'border-[#E5E7EB]' : 'border-dashed border-graphite/30 bg-soft-gray/50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-deep-navy">{plan.name}</h4>
                              {!plan.isActive && (
                                <Badge variant="secondary">Desativado</Badge>
                              )}
                              <Badge variant="outline">
                                {plan._count?.subscriptions || 0} assinantes
                              </Badge>
                            </div>
                            <p className="text-body-sm text-nex-blue font-semibold mb-2">
                              {formatCurrency(plan.price / 100)}/mês
                            </p>
                            {plan.description && (
                              <p className="text-caption text-graphite/60 mb-2">
                                {plan.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {plan.benefits.map((benefit, index) => (
                                <Badge key={index} variant="secondary" className="text-[11px]">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditPlanModal(plan)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeletePlan(plan)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>💡 Dicas de Precificação</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-body-sm text-graphite/70">
                    <li>• <strong>Plano básico:</strong> R$ 5 - R$ 15/mês - Acesso a conteúdo exclusivo</li>
                    <li>• <strong>Plano intermediário:</strong> R$ 15 - R$ 30/mês - Benefícios extras como downloads, bastidores</li>
                    <li>• <strong>Plano premium:</strong> R$ 30 - R$ 100/mês - Interação direta, comissões, lives privadas</li>
                    <li>• A taxa da plataforma é de 10% sobre cada pagamento</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Escolha como e quando deseja receber notificações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: 'Novos assinantes', desc: 'Quando alguém assinar seu conteúdo' },
                { label: 'Novos comentários', desc: 'Quando alguém comentar em seus posts' },
                { label: 'Novos posts', desc: 'Quando criadores que você segue publicarem' },
                { label: 'Atualizações de pagamento', desc: 'Status de pagamentos e saques' },
                { label: 'Novidades da plataforma', desc: 'Atualizações e novos recursos do NexFan' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-deep-navy">{item.label}</p>
                    <p className="text-caption text-graphite/50">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-mid-gray peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-nex-blue/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nex-blue" />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Senha atual" type="password" />
                <Input label="Nova senha" type="password" />
                <Input label="Confirmar nova senha" type="password" />
                <Button>Alterar Senha</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessões Ativas</CardTitle>
                <CardDescription>
                  Gerencie os dispositivos conectados à sua conta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-nex bg-soft-gray">
                    <div>
                      <p className="font-medium text-deep-navy">Este dispositivo</p>
                      <p className="text-caption text-graphite/50">
                        Windows • Chrome • São Paulo, BR
                      </p>
                    </div>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                </div>
                <Button variant="outline" className="mt-4">
                  Encerrar todas as outras sessões
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-graphite/70 mb-4">
                  Após excluir sua conta, todos os seus dados serão permanentemente removidos.
                  Esta ação não pode ser desfeita.
                </p>
                <Button variant="destructive">Excluir minha conta</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-nex-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="font-headline text-heading-lg text-deep-navy">
                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
              </h2>
              <button
                onClick={closePlanModal}
                className="p-2 hover:bg-soft-gray rounded-nex transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Input
                label="Nome do Plano *"
                placeholder="Ex: Apoiador, Fã, Premium"
                value={planForm.name}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
              />

              <Input
                label="Descrição (opcional)"
                placeholder="Uma breve descrição do plano"
                value={planForm.description}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
              />

              <Input
                label="Preço Mensal (R$) *"
                placeholder="Ex: 19,90"
                value={planForm.price}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, price: e.target.value }))}
                hint="Este valor será cobrado mensalmente dos assinantes"
              />

              <div>
                <label className="input-label">Benefícios *</label>
                <p className="text-caption text-graphite/50 mb-2">
                  Liste o que o assinante terá acesso
                </p>
                <div className="space-y-2">
                  {planForm.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Benefício ${index + 1}`}
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                      />
                      {planForm.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBenefit(index)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addBenefit}
                  className="mt-2"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Adicionar Benefício
                </Button>
              </div>
            </div>

            <div className="p-6 border-t border-[#E5E7EB] flex justify-end gap-3">
              <Button variant="ghost" onClick={closePlanModal}>
                Cancelar
              </Button>
              <Button onClick={handleSavePlan} isLoading={savingPlan}>
                {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
