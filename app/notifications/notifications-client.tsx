'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, UserPlus, MessageCircle, Calendar, Check, X, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface NotificationsClientProps {
  pendingRequests: {
    id: string
    user: { id: string; username: string; avatar_url: string | null }
    created_at: string
  }[]
  unreadMessagesCount: number
  upcomingEvents: {
    id: string
    title: string
    date: string
    location: string | null
    image_url: string | null
  }[]
  userId: string
}

export function NotificationsClient({
  pendingRequests: initialRequests,
  unreadMessagesCount,
  upcomingEvents,
  userId,
}: NotificationsClientProps) {
  const [pendingRequests, setPendingRequests] = useState(initialRequests)

  const handleAccept = async (friendshipId: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    if (!error) {
      setPendingRequests(pendingRequests.filter(r => r.id !== friendshipId))
    }
  }

  const handleReject = async (friendshipId: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (!error) {
      setPendingRequests(pendingRequests.filter(r => r.id !== friendshipId))
    }
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

  const hasNotifications = pendingRequests.length > 0 || unreadMessagesCount > 0 || upcomingEvents.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/feed">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Notificações</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {!hasNotifications ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">Tudo em dia!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Você não tem notificações no momento
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Friend Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  Solicitações de amizade
                </h2>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-3 rounded-lg bg-card p-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user.avatar_url || undefined} />
                        <AvatarFallback>
                          {request.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {request.user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(request.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" onClick={() => handleAccept(request.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unread Messages */}
            {unreadMessagesCount > 0 && (
              <Link
                href="/chat"
                className="flex items-center gap-3 rounded-lg bg-card p-4 transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {unreadMessagesCount} {unreadMessagesCount === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Toque para ver suas conversas
                  </p>
                </div>
              </Link>
            )}

            {/* Upcoming Events */}
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
                      className="flex items-center gap-3 rounded-lg bg-card p-3 transition-colors hover:bg-muted"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                        {event.image_url ? (
                          <Image
                            src={event.image_url}
                            alt={event.title}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
