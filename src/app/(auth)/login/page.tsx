'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toaster'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true)

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Erro ao entrar',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
        variant: 'success',
      })

      router.push(callbackUrl)
      router.refresh()
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
      await signIn('google', { callbackUrl })
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
          Entrar na sua conta
        </h1>
        <p className="mt-2 text-body-md text-graphite/70">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-nex-blue hover:underline font-medium">
            Criar conta grátis
          </Link>
        </p>
      </div>

      {/* Google Sign In */}
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
          ou entre com email
        </span>
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-5 w-5" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-mid-gray text-nex-blue focus:ring-nex-blue/30"
            />
            <span className="text-body-sm text-graphite/70">Lembrar de mim</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-body-sm text-nex-blue hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Entrar
        </Button>
      </form>

      <p className="text-caption text-graphite/50 text-center">
        Ao entrar, você concorda com nossos{' '}
        <Link href="/terms" className="text-nex-blue hover:underline">
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link href="/privacy" className="text-nex-blue hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  )
}

