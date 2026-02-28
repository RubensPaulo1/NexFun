'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Plus,
  Menu,
  X,
  Heart,
  Bookmark,
  Shield,
  User,
  LogOut,
  Search,
} from 'lucide-react'
import { NexFanLogo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Providers } from '@/components/providers'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

const creatorNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Posts', href: '/dashboard/posts', icon: FileText },
  { name: 'Assinantes', href: '/dashboard/subscribers', icon: Users },
  { name: 'Ganhos', href: '/dashboard/earnings', icon: CreditCard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Verificação', href: '/dashboard/verification', icon: Shield },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

const subscriberNavItems = [
  { name: 'Feed', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Assinaturas', href: '/dashboard/subscriptions', icon: Heart },
  { name: 'Salvos', href: '/dashboard/saved', icon: Bookmark },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

// Inner component that uses useSession (must be inside SessionProvider)
function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isCreator = session?.user?.role === 'CREATOR'
  const navItems = isCreator ? creatorNavItems : subscriberNavItems

  return (
    <div className="min-h-screen bg-soft-gray">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-deep-navy/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-[#E5E7EB] transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-[#E5E7EB]">
            <Link href="/">
              <NexFanLogo className="h-7" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md hover:bg-soft-gray"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Create button (creators only) */}
          {isCreator && (
            <div className="p-4">
              <Link href="/dashboard/posts/new">
                <Button className="w-full" leftIcon={<Plus className="h-4 w-4" />}>
                  Novo Post
                </Button>
              </Link>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-nex text-body-sm font-medium transition-colors',
                    isActive
                      ? 'bg-nex-blue/10 text-nex-blue'
                      : 'text-graphite/70 hover:bg-soft-gray hover:text-graphite'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                {session?.user?.avatar ? (
                  <AvatarImage src={session.user.avatar} alt={session.user.name || ''} />
                ) : null}
                <AvatarFallback name={session?.user?.name || 'User'} />
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-deep-navy truncate">
                  {session?.user?.name}
                </p>
                <p className="text-caption text-graphite/50 truncate">
                  {isCreator ? 'Criador' : 'Assinante'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-[#E5E7EB] lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-soft-gray lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <Link href="/explore">
              <Button variant="ghost" size="sm" leftIcon={<Search className="h-4 w-4" />}>
                Pesquisar Criadores
              </Button>
            </Link>
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-nex-blue/30">
                    <Avatar size="sm">
                      {session.user.avatar ? (
                        <AvatarImage src={session.user.avatar} alt={session.user.name || ''} />
                      ) : null}
                      <AvatarFallback name={session.user.name || 'User'} />
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{session.user.name}</span>
                      <span className="text-caption text-graphite/60">{session.user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

// Main layout wrapper with Providers
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <DashboardContent>{children}</DashboardContent>
    </Providers>
  )
}
