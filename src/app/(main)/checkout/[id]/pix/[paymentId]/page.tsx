'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QrCode, CheckCircle2, XCircle, Loader2, Copy, ArrowLeft, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import Link from 'next/link'

interface PaymentInfo {
  paymentId: string
  qrCode: string | null
  qrCodeBase64: string | null
  paymentUrl: string | null
  amount: number
  status: string
}

export default function PixPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const subscriptionId = params.id as string
  const paymentId = params.paymentId as string

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchPaymentInfo()
    // Poll payment status every 5 seconds
    const interval = setInterval(checkPaymentStatus, 5000)
    return () => clearInterval(interval)
  }, [subscriptionId, paymentId])

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscribe/${subscriptionId}/payment/pix/${paymentId}`)
      
      if (!response.ok) {
        throw new Error('Não foi possível carregar informações do pagamento')
      }

      const data = await response.json()
      setPaymentInfo({
        paymentId: data.paymentId || paymentId,
        qrCode: data.qrCode || null,
        qrCodeBase64: data.qrCodeBase64 || null,
        paymentUrl: data.ticketUrl || null,
        amount: data.amount || 0,
        status: data.status || 'pending',
      })
    } catch (error: any) {
      console.error('Error fetching payment info:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar informações do pagamento',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`/api/subscribe/${subscriptionId}/payment/pix/${paymentId}/status`)
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'approved') {
          router.push(`/checkout/${subscriptionId}/success`)
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
  }

  const copyPixCode = () => {
    if (paymentInfo?.qrCode) {
      navigator.clipboard.writeText(paymentInfo.qrCode)
      setCopied(true)
      toast({
        title: 'Código copiado!',
        description: 'Código PIX copiado para a área de transferência',
        variant: 'success',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-gray flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft-gray py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href={`/checkout/${subscriptionId}/payment`}>
          <Button variant="ghost" className="mb-6" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Voltar
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Pagamento via PIX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-nex-blue/5 border border-nex-blue/20 rounded-nex p-4 text-center">
              <p className="text-body-sm text-graphite/60 mb-2">Valor a pagar</p>
              {paymentInfo && (
                <p className="font-headline text-display-md text-nex-blue">
                  {formatCurrency(paymentInfo.amount)}
                </p>
              )}
            </div>

            {paymentInfo?.qrCodeBase64 && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-nex">
                  <img
                    src={`data:image/png;base64,${paymentInfo.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>

                <Button
                  onClick={copyPixCode}
                  variant="outline"
                  leftIcon={copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                >
                  {copied ? 'Copiado!' : 'Copiar código PIX'}
                </Button>
              </div>
            )}

            {paymentInfo?.qrCode && !paymentInfo.qrCodeBase64 && (
              <div className="space-y-4">
                <div>
                  <label className="text-body-sm text-graphite/60 mb-2 block">
                    Código PIX (copie e cole no seu app de pagamento):
                  </label>
                  <div className="bg-soft-gray rounded-nex p-4 font-mono text-body-sm break-all">
                    {paymentInfo.qrCode}
                  </div>
                </div>

                <Button
                  onClick={copyPixCode}
                  variant="outline"
                  className="w-full"
                  leftIcon={copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                >
                  {copied ? 'Copiado!' : 'Copiar código PIX'}
                </Button>
              </div>
            )}

            <div className="bg-soft-gray rounded-nex p-4">
              <p className="text-body-sm text-graphite/60">
                <strong>Instruções:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 text-body-sm text-graphite/60 mt-2">
                <li>Abra o app do seu banco ou carteira digital</li>
                <li>Escaneie o QR Code ou cole o código PIX</li>
                <li>Confirme o pagamento</li>
                <li>Aguarde a confirmação (pode levar alguns segundos)</li>
              </ol>
            </div>

            <div className="flex items-center justify-center gap-2 text-body-sm text-graphite/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aguardando pagamento...</span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={checkPaymentStatus}
            >
              Verificar pagamento
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

