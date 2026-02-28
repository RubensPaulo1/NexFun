'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, User, Chrome, CheckCircle2, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toaster'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ageVerification: false,
      termsAccepted: false,
      userType: undefined,
    },
  })

  const selectedUserType = watch('userType')

  const password = watch('password', '')

  const passwordRequirements = [
    { met: password.length >= 8, text: 'Pelo menos 8 caracteres' },
    { met: /[A-Z]/.test(password), text: 'Uma letra maiúscula' },
    { met: /[a-z]/.test(password), text: 'Uma letra minúscula' },
    { met: /\d/.test(password), text: 'Um número' },
  ]

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Erro ao criar conta',
          description: result.error || 'Algo deu errado.',
          variant: 'destructive',
        })
        return
      }

      // Auto login after registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.ok) {
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Redirecionando para o dashboard...',
          variant: 'success',
        })
        router.push('/dashboard')
      } else {
        toast({
          title: 'Conta criada com sucesso!',
          description: 'Faça login para continuar.',
          variant: 'success',
        })
        router.push('/login')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Algo deu errado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível entrar com o Google.',
        variant: 'destructive',
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-display-sm text-deep-navy">
          Criar sua conta
        </h1>
        <p className="mt-2 text-body-md text-graphite/70">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-nex-blue hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>

      {/* Google Sign Up */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        isLoading={isGoogleLoading}
        leftIcon={<Chrome className="h-5 w-5" />}
      >
        Continuar com Google
      </Button>

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-caption text-graphite/50">
          ou cadastre com email
        </span>
      </div>

      {/* User Type Selection */}
      <div>
        <label className="block text-body-sm font-medium text-deep-navy mb-3">
          Tipo de conta *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue('userType', 'USER')}
            className={`p-4 rounded-nex border-2 transition-all ${
              selectedUserType === 'USER'
                ? 'border-nex-blue bg-nex-blue/5'
                : 'border-mid-gray hover:border-nex-blue/50'
            }`}
          >
            <Users className={`h-6 w-6 mx-auto mb-2 ${
              selectedUserType === 'USER' ? 'text-nex-blue' : 'text-graphite/50'
            }`} />
            <p className={`font-medium text-body-sm ${
              selectedUserType === 'USER' ? 'text-nex-blue' : 'text-graphite/70'
            }`}>
              Fã
            </p>
            <p className="text-caption text-graphite/50 mt-1">
              Apoiar criadores
            </p>
          </button>
          <button
            type="button"
            onClick={() => setValue('userType', 'CREATOR')}
            className={`p-4 rounded-nex border-2 transition-all ${
              selectedUserType === 'CREATOR'
                ? 'border-nex-blue bg-nex-blue/5'
                : 'border-mid-gray hover:border-nex-blue/50'
            }`}
          >
            <Sparkles className={`h-6 w-6 mx-auto mb-2 ${
              selectedUserType === 'CREATOR' ? 'text-nex-blue' : 'text-graphite/50'
            }`} />
            <p className={`font-medium text-body-sm ${
              selectedUserType === 'CREATOR' ? 'text-nex-blue' : 'text-graphite/70'
            }`}>
              Criador
            </p>
            <p className="text-caption text-graphite/50 mt-1">
              Criar conteúdo
            </p>
          </button>
        </div>
        {errors.userType && (
          <p className="text-caption text-destructive mt-2">{errors.userType.message}</p>
        )}
        <input type="hidden" {...register('userType')} />
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome completo"
          type="text"
          placeholder="Seu nome"
          leftIcon={<User className="h-5 w-5" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="h-5 w-5" />}
            error={errors.password?.message}
            {...register('password')}
          />
          {/* Password strength indicator */}
          {password && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-caption">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      req.met ? 'text-emerald-500' : 'text-mid-gray'
                    }`}
                  />
                  <span className={req.met ? 'text-emerald-600' : 'text-graphite/50'}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-mid-gray text-nex-blue focus:ring-nex-blue/30"
              {...register('ageVerification')}
            />
            <span className="text-body-sm text-graphite/70">
              Confirmo que tenho 18 anos ou mais de idade
            </span>
          </label>
          {errors.ageVerification && (
            <p className="text-caption text-destructive">{errors.ageVerification.message}</p>
          )}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-mid-gray text-nex-blue focus:ring-nex-blue/30"
              {...register('termsAccepted')}
            />
            <span className="text-body-sm text-graphite/70">
              Li e aceito os{' '}
              <Link href="/terms" className="text-nex-blue hover:underline">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacy" className="text-nex-blue hover:underline">
                Política de Privacidade
              </Link>
            </span>
          </label>
          {errors.termsAccepted && (
            <p className="text-caption text-destructive">{errors.termsAccepted.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Criar Conta
        </Button>
      </form>
    </div>
  )
}

