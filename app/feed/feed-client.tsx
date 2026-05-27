'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { EventCard } from '@/components/event-card'
import { EventFilters } from '@/components/event-filters'
import type { EventWithAttendees } from '@/lib/types'

interface FeedClientProps {
  initialEvents: EventWithAttendees[]
  userId: string
}

export function FeedClient({ initialEvents, userId }: FeedClientProps) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = useMemo(() => {
    let filtered = [...events]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        event =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
      )
    }

    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return filtered
  }, [events, searchQuery])

  const handleAttend = async (eventId: string) => {
    const supabase = createClient()
    if (!supabase) return
    
    const { error } = await supabase
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: userId })

    if (!error) {
      setEvents(events.map(event =>
        event.id === eventId
          ? { ...event, is_attending: true, attendee_count: event.attendee_count + 1 }
          : event
      ))
    }
  }

  const handleUnattend = async (eventId: string) => {
    const supabase = createClient()
    if (!supabase) return
    
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (!error) {
      setEvents(events.map(event =>
        event.id === eventId
          ? { ...event, is_attending: false, attendee_count: Math.max(0, event.attendee_count - 1) }
          : event
      ))
    }
  }

  const handleLike = async (eventId: string) => {
    const supabase = createClient()
    if (!supabase) return

    await supabase
      .from('event_likes')
      .insert({ event_id: eventId, user_id: userId })
  }

  const handleUnlike = async (eventId: string) => {
    const supabase = createClient()
    if (!supabase) return

    await supabase
      .from('event_likes')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <EventFilters onSearch={setSearchQuery} />

        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-foreground">
              {events.length === 0 ? 'Nenhum evento disponivel ainda' : 'Nenhum evento encontrado'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length === 0 
                ? 'Novos eventos serao adicionados em breve'
                : 'Tente ajustar os filtros ou buscar por outros termos'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onAttend={handleAttend}
                onUnattend={handleUnattend}
                onLike={handleLike}
                onUnlike={handleUnlike}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
