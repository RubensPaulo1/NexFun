'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Flag,
  Settings,
  Menu,
  X,
  Shield,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { NexFanLogo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Providers } from '@/components/providers'
import { cn } from '@/lib/utils'

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Criadores', href: '/admin/creators', icon: FileText },
  { name: 'Verificações', href: '/admin/verifications', icon: Shield },
  { name: 'Denúncias', href: '/admin/reports', icon: Flag },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
]

// Inner component that uses useSession (must be inside SessionProvider)
function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-deep-navy flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nex-blue" />
      </div>
    )
  }

  // Redirect if not admin
  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-deep-navy">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-graphite transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-2">
              <NexFanLogo variant="light" className="h-7" />
              <Badge variant="destructive" className="text-[10px]">Admin</Badge>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-white/70 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-nex text-body-sm font-medium transition-colors',
                    isActive
                      ? 'bg-nex-blue text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </div>
                  {item.badge && (
                    <Badge variant="destructive" className="text-[10px] px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Admin info */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-nex-blue flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-white">
                  {session?.user?.name}
                </p>
                <p className="text-caption text-white/50">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-deep-navy border-b border-white/10 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-white/70 hover:bg-white/10 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
              Ver Site
            </Button>
          </Link>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

// Main layout wrapper with Providers
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <AdminContent>{children}</AdminContent>
    </Providers>
  )
}
