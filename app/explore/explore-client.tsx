'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, TrendingUp, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { EventCard } from '@/components/event-card'
import { Input } from '@/components/ui/input'
import { PaginationBar } from '@/components/pagination-bar'
import type { EventWithAttendees } from '@/lib/types'

const ITEMS_PER_PAGE = 8

interface ExploreClientProps {
  events: EventWithAttendees[]
  userId: string
}

export function ExploreClient({ events: initialEvents, userId }: ExploreClientProps) {
  const [events, setEvents] = useState(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

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

    return filtered
  }, [events, searchQuery])

  // Featured events (most attendees)
  const featuredEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => b.attendee_count - a.attendee_count)
      .slice(0, 3)
  }, [events])

  // Upcoming this week
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= nextWeek
    })
  }, [events])

  const filteredTotalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
  const paginatedFilteredEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEvents, currentPage])

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

  const handleCardAttend = async (eventId: string) => {
    await handleAttend(eventId)
    setEvents(events.map(event =>
      event.id === eventId ? { ...event, is_attending: true, attendee_count: event.attendee_count + 1 } : event
    ))
  }

  const handleCardUnattend = async (eventId: string) => {
    await handleUnattend(eventId)
    setEvents(events.map(event =>
      event.id === eventId ? { ...event, is_attending: false, attendee_count: Math.max(0, event.attendee_count - 1) } : event
    ))
  }

  return (
    <AppShell title="Explorar">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos, locais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {!searchQuery && (
          <>
            {/* Featured */}
            {featuredEvents.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Em alta
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onAttend={handleCardAttend}
                      onUnattend={handleCardUnattend}
                      onLike={handleLike}
                      onUnlike={handleUnlike}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* This week */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  Esta semana
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingEvents.slice(0, 4).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onAttend={handleCardAttend}
                      onUnattend={handleCardUnattend}
                      onLike={handleLike}
                      onUnlike={handleUnlike}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Resultados</h2>

            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {events.length === 0 ? 'Nenhum evento disponivel ainda' : 'Nenhum evento encontrado'}
                </p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedFilteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onAttend={handleCardAttend}
                    onUnattend={handleCardUnattend}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                  />
                ))}
              </div>
              <PaginationBar
                currentPage={currentPage}
                totalPages={filteredTotalPages}
                onPageChange={setCurrentPage}
              />
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
