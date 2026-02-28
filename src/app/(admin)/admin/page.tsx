'use client'

import { useState, useEffect } from 'react'
import { Users, DollarSign, FileText, Flag, TrendingUp, ArrowUpRight, Shield, Activity, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalUsers: number
  totalCreators: number
  totalRevenue: number
  pendingReports: number
  pendingVerifications: number
  activeSubscriptions: number
  totalPosts: number
  recentUsers: Array<{
    id: string
    name: string | null
    email: string
    role: string
    isActive: boolean
    createdAt: string
  }>
  recentReports: Array<{
    id: string
    type: string
    status: string
    createdAt: string
  }>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [usersRes, creatorsRes, reportsRes, verificationsRes] = await Promise.all([
        fetch('/api/admin/users?limit=5'),
        fetch('/api/creator?limit=5'),
        fetch('/api/admin/reports?limit=5&status=PENDING'),
        fetch('/api/admin/verifications?status=PENDING'),
      ])

      const usersData = await usersRes.json()
      const creatorsData = await creatorsRes.json()
      const reportsData = await reportsRes.json()
      const verificationsData = await verificationsRes.json()

      // Calculate stats
      const totalUsers = usersData.pagination?.total || 0
      const totalCreators = creatorsData.pagination?.total || 0
      const pendingReports = reportsData.pagination?.total || 0
      const pendingVerifications = verificationsData.requests?.length || verificationsData.pagination?.total || 0

      setStats({
        totalUsers,
        totalCreators,
        totalRevenue: 0, // TODO: Calculate from payments
        pendingReports,
        pendingVerifications,
        activeSubscriptions: 0, // TODO: Calculate from subscriptions
        totalPosts: 0, // TODO: Calculate from posts
        recentUsers: usersData.users || [],
        recentReports: reportsData.reports || [],
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  const statsCards = [
    { 
      name: 'Total de Usuários', 
      value: stats?.totalUsers || 0, 
      change: 0, 
      icon: Users 
    },
    { 
      name: 'Criadores Ativos', 
      value: stats?.totalCreators || 0, 
      change: 0, 
      icon: FileText 
    },
    { 
      name: 'Receita Total', 
      value: stats?.totalRevenue || 0, 
      change: 0, 
      icon: DollarSign, 
      format: 'currency' 
    },
    { 
      name: 'Denúncias Pendentes', 
      value: stats?.pendingReports || 0, 
      change: 0, 
      icon: Flag 
    },
    { 
      name: 'Verificações Pendentes', 
      value: stats?.pendingVerifications || 0, 
      change: 0, 
      icon: Shield 
    },
    { 
      name: 'Assinaturas Ativas', 
      value: stats?.activeSubscriptions || 0, 
      change: 0, 
      icon: Activity 
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-display-sm text-white">Admin Dashboard</h1>
        <p className="text-body-md text-white/60">
          Visão geral técnica da plataforma NexFan
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.name} className="bg-graphite border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-nex bg-nex-blue/20">
                  <stat.icon className="h-5 w-5 text-nex-blue" />
                </div>
                {stat.change !== 0 && (
                  <div className={`flex items-center gap-1 text-caption ${stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <ArrowUpRight className={`h-3 w-3 ${stat.change < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <p className="text-body-sm text-white/60 mb-1">{stat.name}</p>
              <p className="font-headline text-display-sm text-white">
                {stat.format === 'currency'
                  ? formatCurrency(stat.value)
                  : stat.value.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card className="bg-graphite border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Denúncias Recentes</CardTitle>
            <Badge variant="destructive">{stats?.pendingReports || 0} pendentes</Badge>
          </CardHeader>
          <CardContent>
            {stats?.recentReports && stats.recentReports.length > 0 ? (
              <div className="space-y-4">
                {stats.recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-nex bg-white/5"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            report.type === 'SPAM' ? 'warning' :
                            report.type === 'HARASSMENT' ? 'destructive' : 'default'
                          }
                          className="text-[10px]"
                        >
                          {report.type}
                        </Badge>
                        <span className="text-caption text-white/40">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                      <p className="text-body-sm text-white/70">
                        Status: <span className="text-white">{report.status}</span>
                      </p>
                    </div>
                    <Badge
                      variant={report.status === 'PENDING' ? 'warning' : 'default'}
                    >
                      {report.status === 'PENDING' ? 'Pendente' : report.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-white/40 text-center py-8">
                Nenhuma denúncia pendente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="bg-graphite border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Usuários Recentes</CardTitle>
            <Badge variant="default">Total: {stats?.totalUsers || 0}</Badge>
          </CardHeader>
          <CardContent>
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <div className="space-y-4">
                {stats.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-nex bg-white/5"
                  >
                    <div>
                      <p className="text-body-sm font-medium text-white">{user.name || 'Sem nome'}</p>
                      <p className="text-caption text-white/40">{user.email}</p>
                      <p className="text-caption text-white/30 mt-1">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'CREATOR' ? 'gradient' : 'outline'}>
                        {user.role}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${
                        user.isActive ? 'bg-emerald-400' : 'bg-red-400'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-white/40 text-center py-8">
                Nenhum usuário encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Health */}
      <Card className="bg-graphite border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-nex bg-white/5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="font-headline text-heading-lg text-white mb-1">Online</p>
              <p className="text-caption text-white/40">Sistema Operacional</p>
            </div>
            <div className="text-center p-4 rounded-nex bg-white/5">
              <div className="w-12 h-12 rounded-full bg-nex-blue/20 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-nex-blue" />
              </div>
              <p className="font-headline text-heading-lg text-white mb-1">{stats?.totalUsers || 0}</p>
              <p className="text-caption text-white/40">Usuários Registrados</p>
            </div>
            <div className="text-center p-4 rounded-nex bg-white/5">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-amber-400" />
              </div>
              <p className="font-headline text-heading-lg text-white mb-1">{stats?.totalCreators || 0}</p>
              <p className="text-caption text-white/40">Criadores Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
