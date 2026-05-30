import type { SupabaseClient } from '@supabase/supabase-js'
import type { MatchProfile, Match } from '@/lib/types'

export async function getInteractedIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('match_interactions')
    .select('target_id')
    .eq('user_id', userId)
  return data?.map(r => r.target_id) ?? []
}

export async function getMyEventIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('event_attendees')
    .select('event_id')
    .eq('user_id', userId)
  return data?.map(r => r.event_id) ?? []
}

export async function getAvailableProfiles(
  supabase: SupabaseClient,
  userId: string,
  interactedIds: string[],
  seenIds: string[] = []
): Promise<MatchProfile[]> {
  const excluded = [userId, ...interactedIds, ...seenIds]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio')
    .eq('is_premium', true)
    .limit(30)

  if (!profiles) return []

  const filtered = profiles.filter(p => !excluded.includes(p.id))

  return Promise.all(
    filtered.map(async (p) => {
      const { count } = await supabase
        .from('event_attendees')
        .select('*', { head: true, count: 'exact' })
        .eq('user_id', p.id)
      return { ...p, common_events: count ?? 0 }
    })
  )
}

export async function getAvailableProfilesAtEvents(
  supabase: SupabaseClient,
  userId: string,
  interactedIds: string[],
  seenIds: string[] = []
): Promise<MatchProfile[]> {
  const excluded = [...interactedIds, ...seenIds]
  const myEvents = await getMyEventIds(supabase, userId)
  if (myEvents.length === 0) return []

  const { data: attendees } = await supabase
    .from('event_attendees')
    .select('user_id')
    .in('event_id', myEvents)
    .neq('user_id', userId)

  const rawIds = [...new Set(attendees?.map(a => a.user_id) ?? [])]
  const availableIds = rawIds.filter(id => !excluded.includes(id))
  if (availableIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio')
    .eq('is_premium', true)
    .in('id', availableIds)

  if (!profiles) return []

  return Promise.all(
    profiles.map(async (p) => {
      const { count } = await supabase
        .from('event_attendees')
        .select('*', { head: true, count: 'exact' })
        .eq('user_id', p.id)
      return { ...p, common_events: count ?? 0 }
    })
  )
}

export async function handleLike(
  supabase: SupabaseClient,
  userId: string,
  targetId: string
): Promise<{ matched: boolean; matchId?: string }> {
  const { error } = await supabase
    .from('match_interactions')
    .insert({ user_id: userId, target_id: targetId, action: 'like' })
  if (error) {
    console.error('Erro ao dar like:', error)
    return { matched: false }
  }

  const { data: reciprocal } = await supabase
    .from('match_interactions')
    .select('id')
    .eq('user_id', targetId)
    .eq('target_id', userId)
    .eq('action', 'like')
    .maybeSingle()

  if (!reciprocal) return { matched: false }

  const { data: match } = await supabase
    .from('matches')
    .insert({ user1_id: userId, user2_id: targetId })
    .select('id')
    .single()

  return { matched: true, matchId: match?.id }
}

export async function handlePass(
  supabase: SupabaseClient,
  userId: string,
  targetId: string
): Promise<void> {
  await supabase
    .from('match_interactions')
    .insert({ user_id: userId, target_id: targetId, action: 'pass' })
}

export async function getUserMatches(
  supabase: SupabaseClient,
  userId: string
): Promise<(Match & { otherUser: { id: string; username: string; avatar_url: string | null }; common_events: number })[]> {
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (!matches) return []

  return Promise.all(
    matches.map(async (m) => {
      const otherId = m.user1_id === userId ? m.user2_id : m.user1_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', otherId)
        .single()

      const { count } = await supabase
        .from('event_attendees')
        .select('*', { head: true, count: 'exact' })
        .eq('user_id', otherId)

      return {
        ...m,
        otherUser: profile ?? { id: otherId, username: 'desconhecido', avatar_url: null },
        common_events: count ?? 0,
      }
    })
  )
}
