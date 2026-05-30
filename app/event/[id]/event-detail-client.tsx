'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Star,
  ExternalLink,
  Share2,
  Send,
  MessageCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { EventWithAttendees, EventComment, Profile } from '@/lib/types'

interface EventDetailClientProps {
  event: EventWithAttendees
  attendees: { id: string; username: string; avatar_url: string | null }[]
  comments: (EventComment & { profile?: { id: string; username: string; avatar_url: string | null } })[]
  userId: string
  userProfile: Profile | null
  eventGroup: { id: string; name: string; type: string } | null
  isInEventGroup: boolean
}

export function EventDetailClient({
  event: initialEvent,
  attendees: initialAttendees,
  comments: initialComments,
  userId,
  userProfile,
  eventGroup,
  isInEventGroup: initialIsInGroup,
}: EventDetailClientProps) {
  const router = useRouter()
  const [event, setEvent] = useState(initialEvent)
  const [attendees, setAttendees] = useState(initialAttendees)
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Data a definir'
    
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    }
    
    return dateString
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || price === 0) return 'Grátis'
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const handleAttend = async () => {
    const supabase = createClient()
    if (!supabase) return
    
    if (event.is_attending) {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', userId)

      if (!error) {
        setEvent({ ...event, is_attending: false, attendee_count: event.attendee_count - 1 })
        setAttendees(attendees.filter(a => a.id !== userId))
      }
    } else {
      const { error } = await supabase
        .from('event_attendees')
        .insert({ event_id: event.id, user_id: userId })

      if (!error) {
        setEvent({ ...event, is_attending: true, attendee_count: event.attendee_count + 1 })
        if (userProfile) {
          setAttendees([...attendees, { id: userProfile.id, username: userProfile.username, avatar_url: userProfile.avatar_url }])
        }
      }
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() && rating === 0) return
    
    setIsSubmitting(true)
    const supabase = createClient()
    if (!supabase) {
      setIsSubmitting(false)
      return
    }

    const { data, error } = await supabase
      .from('event_comments')
      .insert({
        event_id: event.id,
        user_id: userId,
        content: newComment.trim() || null,
        rating: rating > 0 ? rating : null,
      })
      .select('*')
      .single()

    if (!error && data) {
      setComments([
        {
          ...data,
          profile: userProfile ? {
            id: userProfile.id,
            username: userProfile.username,
            avatar_url: userProfile.avatar_url,
          } : undefined,
        },
        ...comments,
      ])
      setNewComment('')
      setRating(0)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Image */}
      <div className="relative h-64 w-full">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Calendar className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        
        {/* Back button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-4 top-4 bg-background/80 backdrop-blur-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Share button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-4 top-4 bg-background/80 backdrop-blur-sm"
          onClick={async () => {
            const url = `${window.location.origin}/event/${event.id}`
            if (navigator.share) {
              await navigator.share({ url })
            } else {
              await navigator.clipboard.writeText(url)
            }
          }}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="mx-auto w-full max-w-lg md:max-w-4xl lg:max-w-6xl px-4">
        {/* Event Info */}
        <div className="-mt-12 md:-mt-20 relative space-y-4 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {event.category && (
                <Badge variant="secondary" className="mb-2">
                  {event.category}
                </Badge>
              )}
              <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              {formatPrice(event.price)}
            </Badge>
          </div>

          <div className="space-y-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="capitalize">{formatDate(event.date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {event.source_platform && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span>Via {event.source_platform}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-foreground leading-relaxed">{event.description}</p>
          )}

          {/* Attendees */}
          <div className="space-y-3 rounded-lg bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Quem vai</h3>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {event.attendee_count} confirmados
              </span>
            </div>
            
            {attendees.length > 0 && (
              <div className="flex -space-x-2">
                {attendees.slice(0, 8).map((attendee) => (
                  <Link key={attendee.id} href={`/profile/${attendee.id}`}>
                    <Avatar className="h-10 w-10 border-2 border-card hover:opacity-80 transition-opacity">
                      <AvatarImage src={attendee.avatar_url || undefined} />
                      <AvatarFallback>
                        {attendee.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ))}
                {attendees.length > 8 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                    +{attendees.length - 8}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className={cn(
                'flex-1',
                event.is_attending && 'bg-accent text-accent-foreground hover:bg-accent/90'
              )}
              onClick={handleAttend}
            >
              {event.is_attending ? 'Vou participar' : 'Quero ir'}
            </Button>
            {event.url_source && (
              <Button variant="outline" asChild>
                <a href={event.url_source} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Comprar
                </a>
              </Button>
            )}
          </div>

          {/* Event Group Section */}
          <div className="space-y-3 rounded-lg bg-card p-4">
            <h3 className="font-semibold text-foreground">Grupo do Evento</h3>
            {eventGroup ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{eventGroup.name}</p>
                    <p className="text-xs text-muted-foreground">Grupo público</p>
                  </div>
                </div>
                {initialIsInGroup ? (
                  <Button asChild>
                    <Link href={`/chat/groups/${eventGroup.id}`}>Abrir Grupo</Link>
                  </Button>
                ) : (
                  <Button onClick={async () => {
                    const supabase = createClient()
                    const { error } = await supabase
                      .from('group_members')
                      .insert({ group_id: eventGroup.id, user_id: userId, role: 'member' })
                    if (!error) router.push(`/chat/groups/${eventGroup.id}`)
                  }}>
                    Entrar no Grupo
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Nenhum grupo para este evento ainda</p>
                <Button size="sm" onClick={async () => {
                  const supabase = createClient()
                  const { data: group } = await supabase
                    .from('groups')
                    .insert({
                      name: `Grupo - ${event.title}`,
                      type: 'event',
                      event_id: event.id,
                      created_by: userId,
                    })
                    .select('id')
                    .single()
                  if (group) {
                    await supabase
                      .from('group_members')
                      .insert({ group_id: group.id, user_id: userId, role: 'admin' })
                    router.push(`/chat/groups/${group.id}`)
                  }
                }}>
                  Criar Grupo
                </Button>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-8 md:col-span-2">
            <h3 className="text-lg font-semibold text-foreground">
              Comentários ({comments.length})
            </h3>

            {/* New Comment */}
            <div className="space-y-3 rounded-lg bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sua avaliação:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? 0 : star)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          'h-5 w-5 transition-colors',
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground hover:text-yellow-400'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Deixe seu comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmitting || (!newComment.trim() && rating === 0)}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                Publicar
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg bg-card p-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${comment.user_id}`}>
                      <Avatar className="h-10 w-10 hover:opacity-80 transition-opacity">
                        <AvatarImage src={comment.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {comment.profile?.username.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${comment.user_id}`} className="font-medium text-foreground hover:underline">
                          {comment.profile?.username || 'Usuário'}
                        </Link>
                        {comment.rating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'h-3 w-3',
                                  star <= comment.rating!
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted'
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {comment.content && (
                        <p className="mt-1 text-sm text-foreground">{comment.content}</p>
                      )}
                      <span className="mt-1 text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Seja o primeiro a comentar!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
