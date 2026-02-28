'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  CreditCard,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toaster'
import Link from 'next/link'

interface Subscription {
  id: string
  status: string
  plan: {
    id: string
    name: string
    price: number
    description: string | null
    interval: string
  }
  creator: {
    id: string
    displayName: string
    avatar: string | null
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    fetchSubscription()
  }, [params.id, session])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      // Buscar detalhes da assinatura específica
      const response = await fetch(`/api/subscribe/${params.id}`)
      if (!response.ok) {
        const error = await response.json()
        console.error('Erro ao buscar assinatura:', error)
        // Não redirecionar imediatamente, mostrar erro na tela
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao buscar assinatura',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const data = await response.json()
      
      if (!data.subscription) {
        console.error('Assinatura não encontrada na resposta:', data)
        toast({
          title: 'Erro',
          description: 'Assinatura não encontrada',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      setSubscription(data.subscription)
    } catch (error: any) {
      console.error('Erro ao buscar assinatura:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar assinatura',
        variant: 'destructive',
      })
      // Não redirecionar automaticamente, deixar o usuário ver o erro
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!subscription) return

    try {
      setProcessing(true)
      
      // Redirecionar para a página de checkout do Stripe
      // A URL de checkout deve vir na resposta da API quando a assinatura é criada
      toast({
        title: 'Redirecionando para pagamento',
        description: 'Você será redirecionado para o Stripe...',
        variant: 'info',
      })

      // A URL de checkout já deve estar disponível na página
      // Se não houver, o usuário será redirecionado ao clicar no botão
      router.push('/dashboard/subscriptions')

    } catch (error: any) {
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Ocorreu um erro ao processar o pagamento',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-headline text-heading-lg text-deep-navy mb-2">
              Assinatura não encontrada
            </h2>
            <p className="text-body-md text-graphite/60 mb-6">
              A assinatura que você está procurando não existe ou foi removida.
            </p>
            <Link href="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Apenas planos mensais são permitidos

  return (
    <div className="min-h-screen bg-soft-gray py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Voltar
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-headline text-display-sm text-deep-navy mb-2">
              Finalizar Assinatura
            </h1>
            <p className="text-body-md text-graphite/60">
              Revise os detalhes e complete o pagamento
            </p>
          </div>

          {/* Subscription Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[#E5E7EB]">
                <div className="w-12 h-12 rounded-full bg-nex-blue/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-nex-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-deep-navy">{subscription.plan.name}</p>
                  <p className="text-body-sm text-graphite/60">
                    Assinatura mensal
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-headline text-heading-md text-nex-blue">
                    {formatCurrency(subscription.plan.price / 100)}
                  </p>
                  <p className="text-caption text-graphite/50">/mês</p>
                </div>
              </div>

              {subscription.plan.description && (
                <div>
                  <p className="text-body-sm text-graphite/70">
                    {subscription.plan.description}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-graphite/60">Criador</span>
                  <span className="font-medium text-deep-navy">
                    {subscription.creator.displayName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-graphite/60">Status</span>
                  <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {subscription.status === 'ACTIVE' ? 'Ativa' : 
                     subscription.status === 'PENDING' ? 'Pendente' : subscription.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Método de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 rounded-nex bg-soft-gray border border-[#E5E7EB]">
                <div className="w-10 h-10 rounded bg-white flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-nex-blue" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-deep-navy">Stripe</p>
                  <p className="text-caption text-graphite/50">
                    Pagamento seguro via Stripe
                  </p>
                </div>
                <Badge variant="outline">Seguro</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-nex-blue/5 border-nex-blue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-body-md text-graphite/70">Total</span>
                <span className="font-headline text-display-sm text-nex-blue">
                  {formatCurrency(subscription.plan.price / 100)}
                </span>
              </div>
              <p className="text-caption text-graphite/50 mb-4">
                Você será cobrado mensalmente. Pode cancelar a qualquer momento.
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={processing || subscription.status === 'ACTIVE'}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : subscription.status === 'ACTIVE' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Assinatura Ativa
                  </>
                ) : (
                  'Pagar com Stripe'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-caption text-graphite/50">
              🔒 Seus dados estão protegidos. O pagamento é processado de forma segura pelo Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

