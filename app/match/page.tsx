import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInteractedIds, getAvailableProfiles, getAvailableProfilesAtEvents } from '@/lib/match'
import { MatchClient } from './match-client'

export default async function MatchPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_premium) redirect('/match/upgrade')

  const interactedIds = await getInteractedIds(supabase, user.id)
  const allProfiles = await getAvailableProfiles(supabase, user.id, interactedIds)
  const eventProfiles = await getAvailableProfilesAtEvents(supabase, user.id, interactedIds)

  return (
    <MatchClient
      userId={user.id}
      myAvatar={profile.avatar_url}
      myName={profile.username}
      initialProfiles={allProfiles}
      initialEventProfiles={eventProfiles}
    />
  )
}
