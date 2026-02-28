import { NexFanLogo, NexiMascot } from '@/components/brand/logo'
import Link from 'next/link'
import { Providers } from '@/components/providers'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <NexFanLogo className="h-8" />
            </Link>
            {children}
          </div>
        </div>

        {/* Right side - Branding */}
        <div className="hidden lg:flex lg:flex-1 bg-deep-navy relative overflow-hidden">
          {/* Background patterns */}
          <div className="absolute inset-0 bg-nex-mesh opacity-40" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-nex-blue/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-purple-glow/20 rounded-full blur-3xl" />

          <div className="relative flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-8 animate-float">
              <NexiMascot size="lg" />
            </div>

            <h2 className="font-headline text-display-sm text-white mb-4">
              Bem-vindo à <span className="text-gradient">NexFan</span>
            </h2>

            <p className="text-body-lg text-white/60 max-w-md">
              A próxima geração de conexão e monetização entre criadores e fãs.
              Construa sua comunidade e transforme sua paixão em renda.
            </p>

            {/* Decorative elements */}
            <div className="absolute bottom-12 left-12 right-12">
              <div className="flex justify-between items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-nex-gradient border-2 border-deep-navy"
                    />
                  ))}
                </div>
                <p className="text-caption text-white/40">
                  +10.000 criadores confiam na NexFan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Providers>
  )
}

