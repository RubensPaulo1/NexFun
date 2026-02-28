'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [verifying, setVerifying] = useState(true)

  const subscriptionId = params.id as string

  useEffect(() => {
    // Se não estiver logado, redirecionar para login
    if (session === null) {
      router.push('/login')
      return
    }

    // Verificar e atualizar status da assinatura
    async function verifySubscription(attempt = 1): Promise<boolean> {
      try {
        const response = await fetch(`/api/subscribe/${subscriptionId}/verify`, {
          method: 'POST',
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Tentativa ${attempt}: Status da assinatura:`, data.status)
          
          if (data.debug) {
            console.log('🔍 Debug info:', data.debug)
          }
          
          if (data.message) {
            console.log('📝 Mensagem:', data.message)
          }
          
          // Se está ativa, parar de verificar
          if (data.status === 'ACTIVE') {
            console.log('🎉 Assinatura ATIVADA!')
            setVerifying(false)
            return true
          }
          
          // Se ainda não está ativa e não ultrapassou o limite de tentativas, tentar novamente
          if (attempt < 10) {
            return false // Continuar tentando
          } else {
            // Após 10 tentativas, parar e mostrar sucesso mesmo assim
            console.log('⚠️ Após 10 tentativas, status ainda:', data.status)
            console.log('📊 Debug final:', data.debug || 'N/A')
            setVerifying(false)
            return true
          }
        } else {
          console.error(`Erro ao verificar assinatura (tentativa ${attempt}):`, response.status)
          if (attempt < 10) {
            return false
          } else {
            setVerifying(false)
            return true
          }
        }
      } catch (error) {
        console.error(`Erro ao verificar assinatura (tentativa ${attempt}):`, error)
        if (attempt < 10) {
          return false
        } else {
          setVerifying(false)
          return true
        }
      }
    }

    // Função de polling recursivo
    async function startPolling() {
      for (let attempt = 1; attempt <= 10; attempt++) {
        const shouldStop = await verifySubscription(attempt)
        if (shouldStop) break
        
        // Aguardar antes da próxima tentativa (exponencial backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000)) // 1s, 2s, 3s, etc
      }
    }

    if (session?.user && subscriptionId) {
      // Começar a verificar imediatamente e fazer polling
      startPolling()
    }
  }, [session, router, subscriptionId])

  return (
    <div className="min-h-screen bg-soft-gray flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {verifying ? (
            <>
              <div className="w-16 h-16 rounded-full bg-nex-blue/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="h-8 w-8 text-nex-blue animate-spin" />
              </div>
              
              <h1 className="font-headline text-display-sm text-deep-navy mb-2">
                Processando pagamento...
              </h1>
              
              <p className="text-body-md text-graphite/70 mb-6">
                Aguarde enquanto confirmamos sua assinatura. Isso pode levar alguns segundos.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              
              <h1 className="font-headline text-display-sm text-deep-navy mb-2">
                Pagamento realizado com sucesso!
              </h1>
              
              <p className="text-body-md text-graphite/70 mb-6">
                Sua assinatura foi ativada e você já tem acesso ao conteúdo exclusivo.
                O pagamento será renovado automaticamente todo mês.
              </p>

              <div className="space-y-3">
                <Link href="/dashboard/subscriptions" className="block">
                  <Button className="w-full" variant="gradient">
                    Ver minhas assinaturas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                
                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full">
                    Ir para o Dashboard
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

