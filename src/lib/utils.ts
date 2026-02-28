import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = 'BRL',
  locale: string = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(dateObj)
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return 'agora mesmo'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min atrás`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`
  
  return formatDate(dateObj)
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Ocorreu um erro inesperado'
}

export function bytesToSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
}

/**
 * Verifica se uma assinatura está ativa e dentro do período válido
 * @param status - Status da assinatura (ACTIVE, PENDING, etc)
 * @param currentPeriodEnd - Data de fim do período atual
 * @returns true se a assinatura está ativa e dentro do período válido
 */
export function isSubscriptionActive(
  status: string,
  currentPeriodEnd: Date | string | null
): boolean {
  // Deve estar ativa
  if (status !== 'ACTIVE') {
    return false
  }

  // Deve ter uma data de fim de período
  if (!currentPeriodEnd) {
    return false
  }

  // Verificar se o período ainda não expirou
  const endDate = typeof currentPeriodEnd === 'string' 
    ? new Date(currentPeriodEnd) 
    : currentPeriodEnd
  const now = new Date()

  // Se a data de fim já passou, a assinatura não está mais válida
  return endDate > now
}

