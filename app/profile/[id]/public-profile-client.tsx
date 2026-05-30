'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, MapPin, UserPlus, UserCheck, Clock, MessageCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/types'

interface PublicProfileClientProps {
  profile: Profile
  events: { id: string; title: string; date: string; image_url: string | null; location: string | null }[]
  friendsCount: number
  eventsCount: number
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends'
  currentUserId: string
}

export function PublicProfileClient({
  profile,
  events,
  friendsCount,
  eventsCount,
  friendshipStatus: initialStatus,
  currentUserId,
}: PublicProfileClientProps) {
  const router = useRouter()
  const [friendshipStatus, setFriendshipStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  const handleAddFriend = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('friendships').insert({ user_id: currentUserId, friend_id: profile.id, status: 'pending' })
    setFriendshipStatus('pending_sent')
    setLoading(false)
  }

  const handleCancelRequest = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('friendships').delete().eq('user_id', currentUserId).eq('friend_id', profile.id)
    setFriendshipStatus('none')
    setLoading(false)
  }

  const handleAcceptRequest = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', profile.id).eq('friend_id', currentUserId)
    setFriendshipStatus('friends')
    setLoading(false)
  }

  const handleRejectRequest = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('friendships').delete().eq('user_id', profile.id).eq('friend_id', currentUserId)
    setFriendshipStatus('none')
    setLoading(false)
  }

  const handleRemoveFriend = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUserId})`)
    setFriendshipStatus('none')
    setLoading(false)
  }

  const handleMessage = () => {
    router.push(`/chat/${profile.id}`)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Data a definir'
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' })
    }
    return dateString
  }

  const FriendButton = () => {
    if (friendshipStatus === 'friends') {
      return (
        <div className="flex gap-2">
          <Button onClick={handleMessage} size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />
            Mensagem
          </Button>
          <Button variant="outline" size="sm" onClick={handleRemoveFriend} disabled={loading}>
            <UserCheck className="h-4 w-4 mr-1" />
            Amigos
          </Button>
        </div>
      )
    }
    if (friendshipStatus === 'pending_sent') {
      return (
        <Button variant="outline" size="sm" onClick={handleCancelRequest} disabled={loading}>
          <Clock className="h-4 w-4 mr-1" />
          Cancelar solicitação
        </Button>
      )
    }
    if (friendshipStatus === 'pending_received') {
      return (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAcceptRequest} disabled={loading}>
            <UserCheck className="h-4 w-4 mr-1" />
            Aceitar
          </Button>
          <Button variant="outline" size="sm" onClick={handleRejectRequest} disabled={loading}>
            Recusar
          </Button>
        </div>
      )
    }
    return (
      <Button size="sm" onClick={handleAddFriend} disabled={loading}>
        <UserPlus className="h-4 w-4 mr-1" />
        Adicionar amigo
      </Button>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h2 className="mt-4 text-xl font-bold text-foreground">@{profile.username}</h2>
          {profile.bio && (
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">{profile.bio}</p>
          )}

          <div className="mt-4 flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{eventsCount}</p>
              <p className="text-xs text-muted-foreground">Eventos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{friendsCount}</p>
              <p className="text-xs text-muted-foreground">Amigos</p>
            </div>
          </div>

          <div className="mt-4">
            <FriendButton />
          </div>
        </div>

        {/* Events */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Eventos que vai participar</h3>
          {events.length === 0 ? (
            <div className="rounded-lg bg-card p-6 text-center">
              <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum evento ainda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {events.slice(0, 6).map((event) => (
                <Link
                  key={event.id}
                  href={`/event/${event.id}`}
                  className="flex items-center gap-3 rounded-lg bg-card p-3 transition-colors hover:bg-muted"
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(event.date)}</span>
                      {event.location && (
                        <>
                          <span>•</span>
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
