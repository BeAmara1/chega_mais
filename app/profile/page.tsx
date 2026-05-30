import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './profile-client'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's events (attending)
  const { data: attendance } = await supabase
    .from('event_attendees')
    .select(`
      event:events(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get user's liked events
  const { data: likedEventIds } = await supabase
    .from('event_likes')
    .select('event_id')
    .eq('user_id', user.id)

  let likedEvents: { id: string; title: string; date: string; image_url: string | null; location: string | null }[] = []
  if (likedEventIds && likedEventIds.length > 0) {
    const { data: liked } = await supabase
      .from('events')
      .select('id, title, date, image_url, location')
      .in('id', likedEventIds.map(l => l.event_id))
      .order('date', { ascending: true })

    likedEvents = liked || []
  }

  // Get friends count
  const { count: friendsCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted')

  // Get events count
  const { count: eventsCount } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const events = (attendance || [])
    .map(a => a.event)
    .filter(Boolean) as {
      id: string
      title: string
      date: string
      image_url: string | null
      location: string | null
    }[]

  return (
    <ProfileClient
      profile={profile}
      events={events}
      likedEvents={likedEvents}
      friendsCount={friendsCount || 0}
      eventsCount={eventsCount || 0}
      userEmail={user.email || ''}
      isPremium={profile?.is_premium ?? false}
    />
  )
}
