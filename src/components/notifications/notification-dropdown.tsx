'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, Trash2, Loader2, FileText, UserPlus, CreditCard, AlertCircle, CheckCircle2, MessageSquare, DollarSign, XCircle, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/utils'
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

interface NotificationDropdownProps {
  unreadCount?: number
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

export function NotificationDropdown({ unreadCount: initialUnreadCount = 0 }: NotificationDropdownProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  // Poll for new notifications every 30 seconds when dropdown is open
  useEffect(() => {
    if (!open) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [open])

  // Initial fetch for unread count
  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for unread count every 60 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
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

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
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
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
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

    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-nex-blue text-[10px] text-white flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <div className="p-2">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[#E5E7EB]">
            <h3 className="font-headline text-heading-sm text-deep-navy">
              Notificações
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-caption"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-nex-blue" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-graphite/20 mx-auto mb-3" />
              <p className="text-body-sm text-graphite/60">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-3 rounded-nex cursor-pointer transition-colors
                      ${notification.isRead 
                        ? 'hover:bg-soft-gray' 
                        : 'bg-nex-blue/5 hover:bg-nex-blue/10'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-nex flex-shrink-0
                        ${notification.isRead 
                          ? 'bg-soft-gray' 
                          : 'bg-nex-blue/10'
                        }
                      `}>
                        <Icon className={`
                          h-4 w-4
                          ${notification.isRead 
                            ? 'text-graphite/60' 
                            : 'text-nex-blue'
                          }
                        `} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`
                              font-medium text-body-sm mb-1
                              ${notification.isRead 
                                ? 'text-graphite/70' 
                                : 'text-deep-navy'
                              }
                            `}>
                              {notification.title}
                            </p>
                            <p className="text-caption text-graphite/60 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-caption text-graphite/40 mt-1">
                              {formatRelativeTime(new Date(notification.createdAt))}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-nex-blue flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#E5E7EB]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  router.push('/dashboard/notifications')
                  setOpen(false)
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

