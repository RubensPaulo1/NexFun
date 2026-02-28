'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Trash2, Loader2, FileText, UserPlus, CreditCard, AlertCircle, Inbox, MessageSquare, DollarSign, XCircle, UserMinus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  isRead: boolean
  createdAt: string
}

const notificationIcons: Record<string, any> = {
  NEW_SUBSCRIBER: UserPlus,
  NEW_COMMENT: MessageSquare,
  NEW_POST: FileText,
  PAYMENT_SUCCESS: CreditCard,
  PAYMENT_FAILED: AlertCircle,
  PAYMENT_RECEIVED: DollarSign,
  PAYOUT_COMPLETED: CheckCircle2,
  PAYOUT_FAILED: XCircle,
  SUBSCRIPTION_CANCELED: AlertCircle,
  SUBSCRIBER_CANCELED: UserMinus,
  REPORT_UPDATE: AlertCircle,
  SYSTEM: Bell,
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const url = filter === 'unread' 
        ? '/api/notifications?unreadOnly=true&limit=100'
        : '/api/notifications?limit=100'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notificações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como lida.',
        variant: 'destructive',
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast({
          title: 'Sucesso',
          description: 'Todas as notificações foram marcadas como lidas.',
          variant: 'success',
        })
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar todas como lidas.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId)
        setNotifications(notifications.filter(n => n.id !== notificationId))
        if (notification && !notification.isRead) {
          setUnreadCount(Math.max(0, unreadCount - 1))
        }
        toast({
          title: 'Notificação excluída',
          variant: 'success',
        })
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a notificação.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAllRead = async () => {
    if (!confirm('Tem certeza que deseja excluir todas as notificações lidas?')) {
      return
    }

    try {
      const response = await fetch('/api/notifications?deleteAllRead=true', {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(notifications.filter(n => !n.isRead))
        toast({
          title: 'Sucesso',
          description: `${data.deletedCount || 0} notificação(ões) excluída(s).`,
          variant: 'success',
        })
      }
    } catch (error) {
      console.error('Error deleting read notifications:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir as notificações.',
        variant: 'destructive',
      })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.data) {
      if (notification.data.postId && notification.data.creatorSlug) {
        router.push(`/c/${notification.data.creatorSlug}`)
      } else if (notification.data.subscriptionId) {
        router.push('/dashboard/subscriptions')
      }
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)
  const readNotifications = notifications.filter(n => n.isRead)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-nex-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-display-sm text-deep-navy">Notificações</h1>
          <p className="text-body-md text-graphite/60">
            {unreadCount > 0 
              ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          {readNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAllRead}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir lidas
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Não lidas ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 text-graphite/20 mx-auto mb-4" />
            <h3 className="font-headline text-heading-md text-deep-navy mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-body-sm text-graphite/60">
              Você não tem notificações {filter === 'unread' ? 'não lidas' : ''}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {unreadNotifications.length > 0 && filter === 'all' && (
            <>
              <h2 className="text-body-sm font-semibold text-deep-navy mb-2">
                Não lidas
              </h2>
              {unreadNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell
                return (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    Icon={Icon}
                    onRead={() => handleMarkAsRead(notification.id)}
                    onDelete={() => handleDelete(notification.id)}
                    onClick={() => handleNotificationClick(notification)}
                  />
                )
              })}
            </>
          )}

          {readNotifications.length > 0 && filter !== 'unread' && (
            <>
              {unreadNotifications.length > 0 && (
                <h2 className="text-body-sm font-semibold text-deep-navy mb-2 mt-6">
                  Lidas
                </h2>
              )}
              {readNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell
                return (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    Icon={Icon}
                    onRead={() => handleMarkAsRead(notification.id)}
                    onDelete={() => handleDelete(notification.id)}
                    onClick={() => handleNotificationClick(notification)}
                  />
                )
              })}
            </>
          )}

          {filter === 'unread' && unreadNotifications.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCheck className="h-12 w-12 text-graphite/20 mx-auto mb-4" />
                <h3 className="font-headline text-heading-md text-deep-navy mb-2">
                  Nenhuma notificação não lida
                </h3>
                <p className="text-body-sm text-graphite/60">
                  Todas as suas notificações foram lidas.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  Icon,
  onRead,
  onDelete,
  onClick,
}: {
  notification: Notification
  Icon: any
  onRead: () => void
  onDelete: () => void
  onClick: () => void
}) {
  return (
    <Card 
      className={`
        cursor-pointer transition-all hover:shadow-nex-md
        ${!notification.isRead ? 'border-nex-blue/30 bg-nex-blue/5' : ''}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`
            p-3 rounded-nex flex-shrink-0
            ${notification.isRead 
              ? 'bg-soft-gray' 
              : 'bg-nex-blue/10'
            }
          `}>
            <Icon className={`
              h-5 w-5
              ${notification.isRead 
                ? 'text-graphite/60' 
                : 'text-nex-blue'
              }
            `} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`
                font-medium text-body-md
                ${notification.isRead 
                  ? 'text-graphite/70' 
                  : 'text-deep-navy'
                }
              `}>
                {notification.title}
              </h3>
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-nex-blue flex-shrink-0 mt-1.5" />
              )}
            </div>
            <p className="text-body-sm text-graphite/60 mb-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-caption text-graphite/40">
                {formatRelativeTime(new Date(notification.createdAt))}
              </span>
              <span className="text-caption text-graphite/40">•</span>
              <span className="text-caption text-graphite/40">
                {formatDate(new Date(notification.createdAt))}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRead()
                }}
                title="Marcar como lida"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              title="Excluir"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

