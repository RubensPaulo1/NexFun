import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'NexFan - Conecte-se com seus criadores favoritos',
    template: '%s | NexFan',
  },
  description:
    'NexFan é a próxima geração de conexão e monetização entre criadores e fãs. Apoie criadores independentes e acesse conteúdo exclusivo.',
  keywords: [
    'criadores',
    'assinaturas',
    'conteúdo exclusivo',
    'monetização',
    'fãs',
    'apoio',
    'NexFan',
  ],
  authors: [{ name: 'NexFan' }],
  creator: 'NexFan',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    alternateLocale: 'en_US',
    url: 'https://nexfan.com',
    siteName: 'NexFan',
    title: 'NexFan - Conecte-se com seus criadores favoritos',
    description:
      'NexFan é a próxima geração de conexão e monetização entre criadores e fãs.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NexFan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexFan - Conecte-se com seus criadores favoritos',
    description:
      'NexFan é a próxima geração de conexão e monetização entre criadores e fãs.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-background font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}

