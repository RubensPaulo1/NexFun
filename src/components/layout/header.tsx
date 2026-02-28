'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Search, Plus, LogOut, Settings, User, LayoutDashboard, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NexFanLogo } from '@/components/brand/logo'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

export function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <NexFanLogo className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {status === 'authenticated' && session?.user && (
              <>
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-nex-blue/30 px-3 py-1.5 hover:bg-soft-gray transition-colors">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="text-body-sm font-medium">Dashboard</span>
                  </button>
                </Link>
                <Link href="/explore">
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-nex-blue/30 px-3 py-1.5 hover:bg-soft-gray transition-colors">
                    <Users className="h-4 w-4" />
                    <span className="text-body-sm font-medium">Pesquisar Criadores</span>
                  </button>
                </Link>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-2 animate-fade-in">
                <Input
                  type="text"
                  placeholder="Buscar criadores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    // Close search if clicking outside and query is empty
                    if (!searchQuery.trim()) {
                      setTimeout(() => setSearchOpen(false), 200)
                    }
                  }}
                  autoFocus
                  className="w-64 h-9"
                  leftIcon={<Search className="h-4 w-4" />}
                />
                <Button type="submit" size="sm">
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchQuery('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {status === 'authenticated' && session?.user ? (
              <>
                {/* Notifications */}
                <NotificationDropdown />

                {/* Create Button (for creators) */}
                {session.user.role === 'CREATOR' && (
                  <Link href="/dashboard/posts/new">
                    <Button size="sm" className="hidden sm:flex">
                      <Plus className="h-4 w-4 mr-1" />
                      Criar
                    </Button>
                  </Link>
                )}

                {/* User Menu */}
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
                      <Link href="/profile" className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
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
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Criar Conta</Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E7EB] py-4 animate-fade-in">
            <div className="px-4 mb-4">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Buscar criadores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  leftIcon={<Search className="h-4 w-4" />}
                />
                <Button type="submit" size="sm">
                  Buscar
                </Button>
              </form>
            </div>
            <nav className="flex flex-col gap-2">
              {status === 'authenticated' && session?.user && (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-nex-blue/30 w-full px-4 py-2 hover:bg-soft-gray transition-colors text-left">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="text-body-sm font-medium">Dashboard</span>
                    </button>
                  </Link>
                  <Link href="/explore" onClick={() => setMobileMenuOpen(false)}>
                    <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-nex-blue/30 w-full px-4 py-2 hover:bg-soft-gray transition-colors text-left">
                      <Users className="h-4 w-4" />
                      <span className="text-body-sm font-medium">Pesquisar Criadores</span>
                    </button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

