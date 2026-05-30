'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { EventCard } from '@/components/event-card'
import { EventFilters } from '@/components/event-filters'
import { PaginationBar } from '@/components/pagination-bar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { EventWithAttendees } from '@/lib/types'

const ITEMS_PER_PAGE = 8

interface FeedClientProps {
  initialEvents: EventWithAttendees[]
  userId: string
}

export function FeedClient({ initialEvents, userId }: FeedClientProps) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [tab, setTab] = useState('explorar')

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, tab])

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

    if (tab === 'amigos') {
      filtered = filtered.filter(event => event.friends_attending.length > 0)
    }

    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return filtered
  }, [events, searchQuery, tab])

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
  const paginatedEvents = useMemo(() => {
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

  const renderEvents = (eventList: EventWithAttendees[]) => (
    <>
      {eventList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-foreground">
            {tab === 'amigos' && events.length > 0
              ? 'Nenhum evento com amigos ainda'
              : events.length === 0
                ? 'Nenhum evento disponivel ainda'
                : 'Nenhum evento encontrado'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === 'amigos' && events.length > 0
              ? 'Quando seus amigos confirmarem presenca em eventos, eles aparecerao aqui'
              : events.length === 0
                ? 'Novos eventos serao adicionados em breve'
                : 'Tente ajustar os filtros ou buscar por outros termos'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventList.map(event => (
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
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </>
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <EventFilters onSearch={setSearchQuery} />

        <Tabs value={tab} onValueChange={v => setTab(v)}>
          <TabsList>
            <TabsTrigger value="explorar">Explorar</TabsTrigger>
            <TabsTrigger value="amigos">
              Amigos
              {events.some(e => e.friends_attending.length > 0) && (
                <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                  {events.reduce((acc, e) => acc + (e.friends_attending.length > 0 ? 1 : 0), 0)}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="explorar" className="mt-4">
            {renderEvents(paginatedEvents)}
          </TabsContent>
          <TabsContent value="amigos" className="mt-4">
            {renderEvents(paginatedEvents)}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
