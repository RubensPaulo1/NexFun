'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight, User, Palette, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { NexFanLogo, NexiMascot } from '@/components/brand/logo'
import { toast } from '@/components/ui/toaster'
import { Providers } from '@/components/providers'

type UserType = 'fan' | 'creator'

const steps = ['type', 'profile', 'complete']

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    slug: '',
    bio: '',
  })

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type)
    if (type === 'fan') {
      // Fans skip to complete
      setCurrentStep(2)
    } else {
      setCurrentStep(1)
    }
  }

  const handleCreatorSetup = async () => {
    if (!formData.displayName || !formData.slug) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome de exibição e a URL.',
        variant: 'warning',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar perfil')
      }

      // Update session to reflect new role
      await update({ role: 'CREATOR' })
      setCurrentStep(2)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <Providers>
      <div className="min-h-screen bg-soft-gray flex flex-col">
        {/* Header */}
        <header className="p-6">
          <NexFanLogo className="h-8" />
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-12 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-nex-blue' : 'bg-mid-gray'
                  }`}
                />
              ))}
            </div>

            {/* Step: Choose Type */}
            {currentStep === 0 && (
              <div className="text-center animate-fade-in">
                <div className="flex justify-center mb-6">
                  <NexiMascot size="lg" />
                </div>
                <h1 className="font-headline text-display-sm text-deep-navy mb-2">
                  Bem-vindo ao NexFan!
                </h1>
                <p className="text-body-md text-graphite/70 mb-8">
                  Como você pretende usar a plataforma?
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Card
                    interactive
                    className="cursor-pointer"
                    onClick={() => handleUserTypeSelect('fan')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-nex-blue/10 flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-nex-blue" />
                      </div>
                      <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                        Sou um Fã
                      </h3>
                      <p className="text-body-sm text-graphite/60">
                        Quero apoiar criadores e acessar conteúdo exclusivo
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    interactive
                    className="cursor-pointer"
                    onClick={() => handleUserTypeSelect('creator')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-glow/10 flex items-center justify-center mx-auto mb-4">
                        <Palette className="h-8 w-8 text-purple-glow" />
                      </div>
                      <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                        Sou um Criador
                      </h3>
                      <p className="text-body-sm text-graphite/60">
                        Quero monetizar meu conteúdo e construir uma comunidade
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step: Creator Profile */}
            {currentStep === 1 && userType === 'creator' && (
              <div className="animate-fade-in">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-headline text-heading-lg text-deep-navy mb-2">
                      Configure seu perfil de criador
                    </h2>
                    <p className="text-body-sm text-graphite/60 mb-6">
                      Essas informações aparecerão na sua página pública
                    </p>

                    <div className="space-y-4">
                      <Input
                        label="Nome de exibição"
                        placeholder="Ex: Marina Costa"
                        value={formData.displayName}
                        onChange={(e) =>
                          setFormData({ ...formData, displayName: e.target.value })
                        }
                      />

                      <Input
                        label="URL do seu perfil"
                        placeholder="seu-nome"
                        hint="nexfan.com/c/seu-nome"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                          })
                        }
                      />

                      <div>
                        <label className="input-label">Bio (opcional)</label>
                        <textarea
                          className="input-field min-h-[100px]"
                          placeholder="Conte um pouco sobre você e seu conteúdo..."
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData({ ...formData, bio: e.target.value })
                          }
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleCreatorSetup}
                        isLoading={isLoading}
                      >
                        Continuar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step: Complete */}
            {currentStep === 2 && (
              <div className="text-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-emerald-600" />
                </div>
                <h1 className="font-headline text-display-sm text-deep-navy mb-2">
                  Tudo pronto!
                </h1>
                <p className="text-body-md text-graphite/70 mb-8">
                  {userType === 'creator'
                    ? 'Seu perfil de criador foi configurado. Agora você pode criar seu primeiro post e configurar seus planos de assinatura.'
                    : 'Sua conta está pronta. Explore criadores incríveis e comece a apoiar seus favoritos!'}
                </p>

                <Button size="lg" onClick={handleComplete}>
                  {userType === 'creator' ? 'Ir para o Dashboard' : 'Explorar Criadores'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </Providers>
  )
}

