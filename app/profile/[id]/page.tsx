import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicProfileClient } from './public-profile-client'

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) redirect('/feed')

  const { data: attendance } = await supabase
    .from('event_attendees')
    .select('event:events(id, title, date, image_url, location)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const { count: friendsCount } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${id},friend_id.eq.${id}`)
    .eq('status', 'accepted')

  const { count: eventsCount } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)

  let friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' = 'none'
  const { data: friendship } = await supabase
    .from('friendships')
    .select('user_id, friend_id, status')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${user.id})`)
    .single()

  if (friendship) {
    if (friendship.status === 'accepted') {
      friendshipStatus = 'friends'
    } else if (friendship.user_id === user.id) {
      friendshipStatus = 'pending_sent'
    } else {
      friendshipStatus = 'pending_received'
    }
  }

  const events = (attendance || [])
    .map(a => a.event)
    .filter(Boolean) as { id: string; title: string; date: string; image_url: string | null; location: string | null }[]

  return (
    <PublicProfileClient
      profile={profile}
      events={events}
      friendsCount={friendsCount || 0}
      eventsCount={eventsCount || 0}
      friendshipStatus={friendshipStatus}
      currentUserId={user.id}
    />
  )
}
