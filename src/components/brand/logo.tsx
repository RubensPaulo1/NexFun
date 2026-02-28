'use client'

import { cn } from '@/lib/utils'

interface NexFanLogoProps {
  className?: string
  variant?: 'default' | 'light' | 'dark'
  showSymbol?: boolean
}

export function NexFanLogo({
  className,
  variant = 'default',
  showSymbol = true,
}: NexFanLogoProps) {
  const colors = {
    default: {
      nex: '#3366FF',
      fan: '#0A0D1A',
    },
    light: {
      nex: '#3366FF',
      fan: '#FFFFFF',
    },
    dark: {
      nex: '#3366FF',
      fan: '#0A0D1A',
    },
  }

  const { nex, fan } = colors[variant]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showSymbol && (
        <div className="relative w-8 h-8">
          {/* NexFan Symbol - Circle with flow lines */}
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" stroke={nex} strokeWidth="2.5" />
            <path
              d="M10 22L22 10"
              stroke={nex}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M10 10L22 22"
              stroke={nex}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.5"
            />
            <circle cx="10" cy="10" r="2" fill={nex} />
            <circle cx="22" cy="22" r="2" fill={nex} />
          </svg>
        </div>
      )}
      <span className="font-headline font-semibold text-xl tracking-tight">
        <span style={{ color: nex }}>NEX</span>
        <span style={{ color: fan }}>FAN</span>
      </span>
    </div>
  )
}

// Monogram version
export function NexFanMonogram({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#3366FF" />
        <text
          x="50%"
          y="52%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontFamily="Montserrat, sans-serif"
          fontWeight="600"
        >
          NF
        </text>
      </svg>
    </div>
  )
}

// NEXI Mascot - Minimalist geometric style
export function NexiMascot({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  }

  return (
    <div className={cn(sizes[size], className)}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="24" cy="20" r="14" stroke="#3366FF" strokeWidth="2" fill="none" />
        {/* Eyes */}
        <circle cx="19" cy="18" r="2" fill="#3366FF" />
        <circle cx="29" cy="18" r="2" fill="#3366FF" />
        {/* Smile */}
        <path
          d="M19 24C19 24 21 27 24 27C27 27 29 24 29 24"
          stroke="#3366FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Antenna */}
        <path
          d="M24 6V2"
          stroke="#3366FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="2" r="1.5" fill="#00E0D6" />
        {/* Body hint */}
        <path
          d="M18 34C18 34 20 36 24 36C28 36 30 34 30 34"
          stroke="#3366FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

