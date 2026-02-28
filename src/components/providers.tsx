'use client'

import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/tooltip'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={300}>
        {children}
      </TooltipProvider>
    </SessionProvider>
  )
}

