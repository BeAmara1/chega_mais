'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, UserPlus, MessageCircle, Calendar, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface FriendRequest {
  id: string
  user: { id: string; username: string; avatar_url: string | null }
  created_at: string
}

interface UpcomingEvent {
  id: string
  title: string
  date: string
  location: string | null
  image_url: string | null
}

export function NotificationsDialog() {
  const [open, setOpen] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      if (!supabase) { setLoading(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [requestsRes, messagesCount, eventsRes] = await Promise.all([
        supabase
          .from('friendships')
          .select('id, created_at, requester:profiles!friendships_requester_id_fkey(id, username, avatar_url)')
          .eq('receiver_id', user.id)
          .eq('status', 'pending'),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false),
        supabase
          .from('event_participants')
          .select('event:events(id, title, date, location, image_url)')
          .eq('user_id', user.id)
          .gte('event.date', new Date().toISOString())
          .order('event.date', { ascending: true })
          .limit(5),
      ])

      if (requestsRes.data) {
        setPendingRequests(
          requestsRes.data
            .filter((r: any) => r.requester)
            .map((r: any) => ({
              id: r.id,
              user: {
                id: (r.requester as any).id,
                username: (r.requester as any).username,
                avatar_url: (r.requester as any).avatar_url,
              },
              created_at: r.created_at,
            }))
        )
      }

      setUnreadMessagesCount(messagesCount.count ?? 0)

      if (eventsRes.data) {
        setUpcomingEvents(
          eventsRes.data
            .filter((ep: any) => ep.event)
            .map((ep: any) => ({
              id: (ep.event as any).id,
              title: (ep.event as any).title,
              date: (ep.event as any).date,
              location: (ep.event as any).location,
              image_url: (ep.event as any).image_url,
            }))
        )
      }

      setLoading(false)
    }
    load()
  }, [open])

  const handleAccept = async (friendshipId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    if (!error) setPendingRequests(pendingRequests.filter(r => r.id !== friendshipId))
  }

  const handleReject = async (friendshipId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
    if (!error) setPendingRequests(pendingRequests.filter(r => r.id !== friendshipId))
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `há ${diffMins}min`
    if (diffHours < 24) return `há ${diffHours}h`
    return `há ${diffDays}d`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  }

  const totalNotifications = pendingRequests.length + unreadMessagesCount + upcomingEvents.length
  const hasNotifications = totalNotifications > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notificações</DialogTitle>
          <DialogDescription>Suas notificações e lembretes</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !hasNotifications ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma notificação no momento</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  Solicitações de amizade
                </h2>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user.avatar_url || undefined} />
                        <AvatarFallback>{request.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{request.user.username}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(request.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" onClick={() => handleAccept(request.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleReject(request.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unreadMessagesCount > 0 && (
              <Link href="/chat" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {unreadMessagesCount} {unreadMessagesCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
                  </p>
                  <p className="text-sm text-muted-foreground">Toque para ver suas conversas</p>
                </div>
              </Link>
            )}

            {upcomingEvents.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Eventos chegando
                </h2>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/event/${event.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                        {event.image_url ? (
                          <Image src={event.image_url} alt={event.title} width={48} height={48} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{formatDate(event.date)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
