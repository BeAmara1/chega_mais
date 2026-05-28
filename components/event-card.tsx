'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Users, Heart, Share2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventWithAttendees } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface EventCardProps {
  event: EventWithAttendees
  onAttend?: (eventId: string) => void
  onUnattend?: (eventId: string) => void
  onLike?: (eventId: string) => void
  onUnlike?: (eventId: string) => void
}

export function EventCard({ event, onAttend, onUnattend, onLike, onUnlike }: EventCardProps) {
  const [isLiked, setIsLiked] = useState(event.is_liked)
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Data a definir'
    
    // Try parsing as ISO date
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    }
    
    // If not a valid date, return the string as-is (already formatted in DB)
    return dateString
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || price === 0) return 'Grátis'
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const handleAttendClick = () => {
    if (event.is_attending) {
      onUnattend?.(event.id)
    } else {
      onAttend?.(event.id)
    }
  }

  const handleLikeClick = () => {
    if (isLiked) {
      onUnlike?.(event.id)
    } else {
      onLike?.(event.id)
    }
    setIsLiked(!isLiked)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${event.id}`
    if (navigator.share) {
      await navigator.share({ url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <article className="group overflow-hidden rounded-xl bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:ring-1 hover:ring-primary/20 hover:-translate-y-0.5">
      <Link href={`/event/${event.id}`} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {event.category && (
            <Badge 
              variant="secondary" 
              className="absolute left-3 top-3 bg-background/90 backdrop-blur-sm"
            >
              {event.category}
            </Badge>
          )}
          {event.price !== null && (
            <Badge 
              className="absolute right-3 top-3 bg-primary text-primary-foreground"
            >
              {formatPrice(event.price)}
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/event/${event.id}`}>
          <h3 className="text-lg font-semibold leading-tight text-foreground hover:text-primary">
            {event.title}
          </h3>
        </Link>

        <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span suppressHydrationWarning>{formatDate(event.date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {event.friends_attending.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {event.friends_attending.slice(0, 3).map((friend) => (
                <div
                  key={friend.id}
                  className="h-6 w-6 overflow-hidden rounded-full border-2 border-card bg-muted"
                >
                  {friend.avatar_url ? (
                    <Image
                      src={friend.avatar_url}
                      alt={friend.username}
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {event.friends_attending.length === 1
                ? `${event.friends_attending[0].username} vai`
                : `${event.friends_attending[0].username} e +${event.friends_attending.length - 1} vão`}
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{event.attendee_count} confirmados</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleLikeClick}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  isLiked && 'fill-destructive text-destructive'
                )}
              />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {event.url_source && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={event.url_source} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <Button
          className={cn(
            'mt-3 w-full transition-all duration-300',
            event.is_attending
              ? 'bg-accent text-accent-foreground hover:bg-accent/90'
              : 'hover:shadow-[0_0_20px_-5px_var(--primary)]'
          )}
          onClick={handleAttendClick}
        >
          {event.is_attending ? 'Vou participar' : 'Quero ir'}
        </Button>
      </div>
    </article>
  )
}
