import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExploreClient } from './explore-client'

export default async function ExplorePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch all events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  // Get user's attendance
  const { data: attendance } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('user_id', user.id)

  const attendingIds = new Set(attendance?.map(a => a.event_id) || [])

  // Fetch user's likes
  const { data: likes } = await supabase
    .from('event_likes')
    .select('event_id')
    .eq('user_id', user.id)

  const likedIds = new Set(likes?.map(l => l.event_id) || [])

  // Get attendee counts
  const { data: attendeeCounts } = await supabase
    .from('event_attendees')
    .select('event_id')

  const countMap = new Map<string, number>()
  attendeeCounts?.forEach(a => {
    countMap.set(a.event_id, (countMap.get(a.event_id) || 0) + 1)
  })

  const eventsWithDetails = events?.map(event => ({
    ...event,
    is_attending: attendingIds.has(event.id),
    is_liked: likedIds.has(event.id),
    attendee_count: countMap.get(event.id) || 0,
    friends_attending: [],
  })) || []

  return (
    <ExploreClient
      events={eventsWithDetails}
      userId={user.id}
    />
  )
}
