'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return // Wait for session to load
    
    if (session?.user) {
      // If user is logged in, redirect to dashboard
      router.replace('/dashboard')
    } else {
      // If user is not logged in, redirect to login
      router.replace('/login')
    }
  }, [session, status, router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-gray">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue mx-auto mb-4" />
        <p className="text-body-md text-graphite/60">Carregando...</p>
      </div>
    </div>
  )
}
