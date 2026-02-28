'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CreditCard, QrCode, Loader2, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import Link from 'next/link'

interface Subscription {
  id: string
  status: string
  plan: {
    id: string
    name: string
    description: string | null
    price: number
    currency: string
  }
  creator: {
    displayName: string
    slug: string
  }
}

export default function PaymentSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const subscriptionId = params.id as string

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [subscriptionId])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscribe/${subscriptionId}`)
      
      if (!response.ok) {
        throw new Error('Assinatura não encontrada')
      }

      const data = await response.json()
      setSubscription(data.subscription)
    } catch (error: any) {
      console.error('Error fetching subscription:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar a assinatura',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentMethod = async (method: 'pix' | 'card') => {
    if (!subscription) return

    try {
      setProcessing(method)

      if (method === 'pix') {
        // Redirecionar para pagamento PIX via Mercado Pago
        const response = await fetch(`/api/subscribe/${subscriptionId}/payment/pix`, {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar pagamento PIX')
        }

        if (data.redirectUrl) {
          router.push(data.redirectUrl)
        } else if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        } else {
          throw new Error('URL de pagamento não retornada')
        }
      } else {
        // Redirecionar para pagamento via cartão no Stripe
        const response = await fetch(`/api/subscribe/${subscriptionId}/payment/card`, {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar sessão de checkout')
        }

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        } else {
          throw new Error('URL de checkout não retornada')
        }
      }
    } catch (error: any) {
      console.error('Error processing payment:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar o pagamento',
        variant: 'destructive',
      })
      setProcessing(null)
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

  const priceInReais = subscription.plan.price / 100

  return (
    <div className="min-h-screen bg-soft-gray py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <Link href={`/c/${subscription.creator.slug}`}>
          <Button variant="ghost" className="mb-6" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Voltar
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Selecione a forma de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-soft-gray rounded-nex p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-deep-navy">{subscription.plan.name}</p>
                  <p className="text-body-sm text-graphite/60">
                    {subscription.creator.displayName}
                  </p>
                </div>
                <p className="font-headline text-heading-lg text-nex-blue">
                  {formatCurrency(priceInReais)}/mês
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* PIX Option */}
              <Card
                interactive
                className={processing === 'pix' ? 'opacity-50 cursor-not-allowed' : ''}
                onClick={() => !processing && handlePaymentMethod('pix')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-nex-blue/10 flex items-center justify-center mx-auto mb-4">
                    <QrCode className="h-8 w-8 text-nex-blue" />
                  </div>
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                    PIX
                  </h3>
                  <p className="text-body-sm text-graphite/60 mb-4">
                    Pagamento instantâneo via QR Code
                  </p>
                  {processing === 'pix' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-nex-blue mx-auto" />
                  ) : (
                    <Button className="w-full">Pagar com PIX</Button>
                  )}
                </CardContent>
              </Card>

              {/* Credit Card Option */}
              <Card
                interactive
                className={processing === 'card' ? 'opacity-50 cursor-not-allowed' : ''}
                onClick={() => !processing && handlePaymentMethod('card')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-nex-blue/10 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-nex-blue" />
                  </div>
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                    Cartão de Crédito
                  </h3>
                  <p className="text-body-sm text-graphite/60 mb-4">
                    Pagamento seguro via Stripe
                  </p>
                  {processing === 'card' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-nex-blue mx-auto" />
                  ) : (
                    <Button className="w-full">Pagar com Cartão</Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <p className="text-caption text-graphite/50 text-center">
              Você será redirecionado para a plataforma de pagamento selecionada
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

