'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Eye, Heart, MessageCircle, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface AnalyticsStats {
  views: number
  newSubscribers: number
  likes: number
  comments: number
}

interface TopPost {
  id: string
  title: string
  views: number
  likes: number
  comments: number
}

interface PlanDistribution {
  name: string
  subscribers: number
  percentage: number
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([])
  const [totalSubscribers, setTotalSubscribers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/creator/analytics?period=${period}`)
      if (!response.ok) throw new Error('Erro ao buscar analytics')

      const data = await response.json()
      setStats(data.stats)
      setTopPosts(data.topPosts || [])
      setPlanDistribution(data.planDistribution || [])
      setTotalSubscribers(data.totalSubscribers || 0)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const overviewStats = stats ? [
    { label: 'Interações', value: stats.views, change: 0, icon: Eye },
    { label: 'Novos Assinantes', value: stats.newSubscribers, change: 0, icon: Users },
    { label: 'Curtidas', value: stats.likes, change: 0, icon: Heart },
    { label: 'Comentários', value: stats.comments, change: 0, icon: MessageCircle },
  ] : []
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-display-sm text-deep-navy">Analytics</h1>
        <p className="text-body-md text-graphite/60">
          Acompanhe o desempenho do seu conteúdo
        </p>
      </div>

      {/* Period Selector */}
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList>
          <TabsTrigger value="7d">7 dias</TabsTrigger>
          <TabsTrigger value="30d">30 dias</TabsTrigger>
          <TabsTrigger value="90d">90 dias</TabsTrigger>
          <TabsTrigger value="all">Todo período</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Overview Stats */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-nex-blue" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-nex bg-nex-blue/10">
                  <stat.icon className="h-5 w-5 text-nex-blue" />
                </div>
                <div className={`flex items-center gap-1 text-caption ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <p className="text-body-sm text-graphite/60 mb-1">{stat.label}</p>
              <p className="font-headline text-display-sm text-deep-navy">
                {stat.value.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Visualizações ao longo do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-soft-gray rounded-nex flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-graphite/20 mx-auto mb-2" />
                <p className="text-graphite/40">Gráfico de visualizações</p>
                <p className="text-caption text-graphite/30">Em breve</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planDistribution.length === 0 ? (
                <p className="text-center text-graphite/50 py-8">
                  Nenhum assinante ainda
                </p>
              ) : (
                planDistribution.map((plan, index) => {
                  const colors = ['bg-nex-blue', 'bg-purple-glow', 'bg-aqua-neon']
                  const color = colors[index % colors.length]
                  return (
                    <div key={plan.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-body-sm font-medium text-deep-navy">{plan.name}</span>
                        <span className="text-body-sm text-graphite/60">
                          {plan.subscribers} ({plan.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-soft-gray rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${plan.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-medium text-deep-navy">Total de Assinantes</span>
                <span className="font-headline text-heading-md text-nex-blue">{totalSubscribers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Posts Mais Populares</CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length === 0 ? (
            <p className="text-center text-graphite/50 py-8">
              Nenhum post ainda
            </p>
          ) : (
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 rounded-nex bg-soft-gray"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-nex-blue/10 flex items-center justify-center text-nex-blue font-semibold">
                      {index + 1}
                    </div>
                    <p className="font-medium text-deep-navy">{post.title}</p>
                  </div>
                  <div className="flex items-center gap-6 text-body-sm text-graphite/60">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


