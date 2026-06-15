import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FeedClient } from './feed-client'

export default async function FeedPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  // Fetch user's attendance
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

  // Fetch friend's attendance
  const { data: friendships } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', user.id)
    .eq('status', 'accepted')

  const friendIds = friendships?.map(f => f.friend_id) || []

  // Get profiles of friends who are attending events
  const { data: friendAttendees } = await supabase
    .from('event_attendees')
    .select(`
      event_id,
      profile:profiles(id, username, avatar_url)
    `)
    .in('user_id', friendIds.length > 0 ? friendIds : [''])

  // Get attendee counts
  const { data: attendeeCounts } = await supabase
    .from('event_attendees')
    .select('event_id')

  const countMap = new Map<string, number>()
  attendeeCounts?.forEach(a => {
    countMap.set(a.event_id, (countMap.get(a.event_id) || 0) + 1)
  })

  // Map friends to events
  const friendsMap = new Map<string, typeof friendAttendees>()
  friendAttendees?.forEach(fa => {
    if (!friendsMap.has(fa.event_id)) {
      friendsMap.set(fa.event_id, [])
    }
    friendsMap.get(fa.event_id)?.push(fa)
  })

  const eventsWithAttendees = events?.map(event => ({
    ...event,
    is_attending: attendingIds.has(event.id),
    is_liked: likedIds.has(event.id),
    attendee_count: countMap.get(event.id) || 0,
    friends_attending: ((friendsMap.get(event.id) || [])
      .map(fa => fa.profile)
      .filter(Boolean)) as unknown as { id: string; username: string; avatar_url: string | null }[],
  })) || []

  return <FeedClient initialEvents={eventsWithAttendees} userId={user.id} />
}
