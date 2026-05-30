import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventDetailClient } from './event-detail-client'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch event
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !event) {
    notFound()
  }

  // Check if user is attending
  const { data: attendance } = await supabase
    .from('event_attendees')
    .select('id')
    .eq('event_id', id)
    .eq('user_id', user.id)
    .single()

  // Get attendee count
  const { count: attendeeCount } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id)

  // Get attendees with profiles
  const { data: attendees } = await supabase
    .from('event_attendees')
    .select(`
      id,
      user_id,
      profile:profiles(id, username, avatar_url)
    `)
    .eq('event_id', id)
    .limit(20)

  // Get comments with profiles
  const { data: comments } = await supabase
    .from('event_comments')
    .select(`
      *,
      profile:profiles(id, username, avatar_url)
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  // Get user's profile
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get event groups
  const { data: eventGroups } = await supabase
    .from('groups')
    .select('*')
    .eq('event_id', id)

  let isInEventGroup = false
  if (eventGroups && eventGroups.length > 0) {
    const { data: myMembership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', eventGroups[0].id)
      .eq('user_id', user.id)
      .single()
    isInEventGroup = !!myMembership
  }

  const eventWithDetails = {
    ...event,
    is_attending: !!attendance,
    attendee_count: attendeeCount || 0,
    friends_attending: [],
  }

  return (
    <EventDetailClient
      event={eventWithDetails}
      attendees={(attendees || []).map(a => a.profile).filter(Boolean) as { id: string; username: string; avatar_url: string | null }[]}
      comments={(comments || []).map(c => ({
        ...c,
        profile: c.profile as { id: string; username: string; avatar_url: string | null } | undefined
      }))}
      userId={user.id}
      userProfile={userProfile}
      eventGroup={eventGroups?.[0] || null}
      isInEventGroup={isInEventGroup}
    />
  )
}
