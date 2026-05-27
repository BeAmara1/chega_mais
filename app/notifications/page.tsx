import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsClient } from './notifications-client'

export default async function NotificationsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get pending friend requests (simplified query)
  const { data: pendingFriendships } = await supabase
    .from('friendships')
    .select('id, user_id, created_at')
    .eq('friend_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Get profiles for pending requests
  const requesterIds = pendingFriendships?.map(f => f.user_id) || []
  const { data: requesterProfiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', requesterIds)

  const profilesMap = new Map(requesterProfiles?.map(p => [p.id, p]) || [])

  const pendingRequests = (pendingFriendships || []).map(f => ({
    id: f.id,
    user: profilesMap.get(f.user_id) || { id: f.user_id, username: 'Usuário', avatar_url: null },
    created_at: f.created_at,
  }))

  // Get recent unread messages count (simple count query)
  const { data: unreadData } = await supabase
    .from('messages')
    .select('id')
    .eq('receiver_id', user.id)
    .is('read_at', null)

  const unreadMessagesCount = unreadData?.length || 0

  // Get events user is attending that are happening soon (next 3 days)
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  
  const { data: attendances } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('user_id', user.id)

  const eventIds = attendances?.map(a => a.event_id) || []
  
  let upcomingEvents: { id: string; title: string; date: string; location: string | null; image_url: string | null }[] = []
  
  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from('events')
      .select('id, title, date, location, image_url')
      .in('id', eventIds)
      .gte('date', now.toISOString())
      .lte('date', threeDaysFromNow.toISOString())
      .order('date', { ascending: true })

    upcomingEvents = events || []
  }

  return (
    <NotificationsClient
      pendingRequests={pendingRequests}
      unreadMessagesCount={unreadMessagesCount}
      upcomingEvents={upcomingEvents}
      userId={user.id}
    />
  )
}
