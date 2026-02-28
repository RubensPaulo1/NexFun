'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Filter, MoreVertical, CheckCircle2, XCircle, Shield, Loader2, Eye, Trash2, AlertTriangle, FileText, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { toast } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  email: string
  avatar: string | null
  role: string
  isActive: boolean
  createdAt: string
  _count: {
    subscriptions: number
  }
  creatorProfile: {
    id: string
    displayName: string
    slug: string
    isVerified: boolean
    _count: {
      subscribers: number
      posts: number
    }
  } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [downloadingContract, setDownloadingContract] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [page, search, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar usuários')

      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, updates: { isActive?: boolean; role?: string }) => {
    try {
      setUpdating(userId)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar usuário')
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso.',
        variant: 'success',
      })

      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeleting(userToDelete.id)
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir usuário')
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso.',
        variant: 'success',
      })

      setDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o usuário.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(null)
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDownloadContract = async (userId: string) => {
    try {
      setDownloadingContract(userId)
      const response = await fetch(`/api/admin/users/${userId}/contract`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao baixar contrato')
      }

      // Get filename from Content-Disposition header or create one
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'contrato.html'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Get HTML content
      const htmlContent = await response.text()

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Sucesso',
        description: 'Contrato baixado com sucesso',
        variant: 'success',
      })
    } catch (error: any) {
      console.error('Error downloading contract:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível baixar o contrato',
        variant: 'destructive',
      })
    } finally {
      setDownloadingContract(null)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-display-sm text-white">Gerenciar Usuários</h1>
        <p className="text-body-md text-white/60">
          Controle completo de usuários, criadores e administradores
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-graphite border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                leftIcon={<Search className="h-4 w-4" />}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-nex bg-white/5 border border-white/10 text-white text-body-sm focus:outline-none focus:ring-2 focus:ring-nex-blue"
              >
                <option value="all">Todos os roles</option>
                <option value="USER">Usuário</option>
                <option value="CREATOR">Criador</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-graphite border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-body-md text-white/40">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-body-sm font-medium text-white/60">Usuário</th>
                    <th className="text-left py-3 px-4 text-body-sm font-medium text-white/60">Email</th>
                    <th className="text-left py-3 px-4 text-body-sm font-medium text-white/60">Role</th>
                    <th className="text-left py-3 px-4 text-body-sm font-medium text-white/60">Status</th>
                    <th className="text-left py-3 px-4 text-body-sm font-medium text-white/60">Criado em</th>
                    <th className="text-left py-3 px-4 text-body-sm font-medium text-white/60">Estatísticas</th>
                    <th className="text-right py-3 px-4 text-body-sm font-medium text-white/60">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="bg-nex-blue/20 text-nex-blue">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-body-sm font-medium text-white">
                              {user.name || 'Sem nome'}
                            </p>
                            {user.creatorProfile && (
                              <p className="text-caption text-white/40">
                                @{user.creatorProfile.slug}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-body-sm text-white/70">{user.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            user.role === 'ADMIN' ? 'destructive' :
                            user.role === 'CREATOR' ? 'gradient' : 'outline'
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            user.isActive ? 'bg-emerald-400' : 'bg-red-400'
                          }`} />
                          <span className="text-body-sm text-white/70">
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-caption text-white/50">
                          {formatDate(user.createdAt)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {user.creatorProfile ? (
                            <>
                              <p className="text-caption text-white/50">
                                {user.creatorProfile._count.subscribers} assinantes
                              </p>
                              <p className="text-caption text-white/50">
                                {user.creatorProfile._count.posts} posts
                              </p>
                            </>
                          ) : (
                            <p className="text-caption text-white/50">
                              {user._count.subscriptions} assinaturas
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/70 hover:text-white hover:bg-white/10"
                                disabled={updating === user.id}
                              >
                                {updating === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-graphite border-white/10">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  handleUpdateUser(user.id, { isActive: !user.isActive })
                                }}
                                className="text-white/70 hover:text-white hover:bg-white/10"
                              >
                                {user.isActive ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              {user.role !== 'ADMIN' && (
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    const newRole = user.role === 'CREATOR' ? 'USER' : 'CREATOR'
                                    handleUpdateUser(user.id, { role: newRole })
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Alterar Role
                                </DropdownMenuItem>
                              )}
                              {user.creatorProfile && (
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    handleDownloadContract(user.id)
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-white/10"
                                  disabled={downloadingContract === user.id}
                                >
                                  {downloadingContract === user.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Baixando...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-4 w-4 mr-2" />
                                      Baixar Contrato
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {user.role !== 'ADMIN' && (
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    openDeleteDialog(user)
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir Usuário
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <p className="text-body-sm text-white/60">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-graphite border-white/10 text-white sm:max-w-[500px] [&>button]:text-white/70 [&>button]:hover:text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Esta ação não pode ser desfeita. Todos os dados relacionados a este usuário serão permanentemente removidos, incluindo assinaturas, posts, planos e mídia.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="space-y-2 py-4">
              <p className="text-white font-medium">
                Tem certeza que deseja excluir o usuário:
              </p>
              <div className="bg-white/5 p-4 rounded-nex border border-white/10">
                <p className="text-white font-semibold">
                  {userToDelete.name || 'Sem nome'}
                </p>
                <p className="text-white/60 text-sm">{userToDelete.email}</p>
                {userToDelete.creatorProfile && (
                  <p className="text-white/60 text-sm mt-1">
                    Criador: @{userToDelete.creatorProfile.slug}
                  </p>
                )}
                <p className="text-white/60 text-sm">
                  Role: {userToDelete.role}
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-nex">
                <p className="text-amber-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Serão excluídos: assinaturas, posts, planos, mídia e todos os dados relacionados.
                  </span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setUserToDelete(null)
              }}
              disabled={deleting !== null}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting !== null}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


