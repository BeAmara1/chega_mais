import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FriendsClient } from './friends-client'

export default async function FriendsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get all friendships for this user (simplified query)
  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, user_id, friend_id, status, created_at')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

  // Separate into accepted, pending received, pending sent
  const acceptedIds: string[] = []
  const pendingReceivedIds: string[] = []
  const pendingSentIds: string[] = []
  const friendshipMap = new Map<string, { id: string; status: string }>()

  friendships?.forEach(f => {
    if (f.status === 'accepted') {
      const otherId = f.user_id === user.id ? f.friend_id : f.user_id
      acceptedIds.push(otherId)
      friendshipMap.set(otherId, { id: f.id, status: f.status })
    } else if (f.status === 'pending') {
      if (f.friend_id === user.id) {
        // I received a request
        pendingReceivedIds.push(f.user_id)
        friendshipMap.set(f.user_id, { id: f.id, status: 'pending_received' })
      } else {
        // I sent a request
        pendingSentIds.push(f.friend_id)
        friendshipMap.set(f.friend_id, { id: f.id, status: 'pending_sent' })
      }
    }
  })

  // Get all profiles we need
  const allNeededIds = [...new Set([...acceptedIds, ...pendingReceivedIds, ...pendingSentIds])]
  
  let profilesMap = new Map<string, { id: string; username: string; avatar_url: string | null; bio: string | null }>()
  
  if (allNeededIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .in('id', allNeededIds)

    profiles?.forEach(p => profilesMap.set(p.id, p))
  }

  // Build arrays
  const friends = acceptedIds
    .map(id => {
      const profile = profilesMap.get(id)
      const friendship = friendshipMap.get(id)
      if (!profile || !friendship) return null
      return { ...profile, friendship_id: friendship.id }
    })
    .filter(Boolean) as { id: string; username: string; avatar_url: string | null; bio: string | null; friendship_id: string }[]

  const pendingReceived = pendingReceivedIds
    .map(id => {
      const profile = profilesMap.get(id)
      const friendship = friendshipMap.get(id)
      if (!profile || !friendship) return null
      return { ...profile, friendship_id: friendship.id }
    })
    .filter(Boolean) as { id: string; username: string; avatar_url: string | null; bio: string | null; friendship_id: string }[]

  const pendingSent = pendingSentIds
    .map(id => {
      const profile = profilesMap.get(id)
      const friendship = friendshipMap.get(id)
      if (!profile || !friendship) return null
      return { ...profile, friendship_id: friendship.id }
    })
    .filter(Boolean) as { id: string; username: string; avatar_url: string | null; bio: string | null; friendship_id: string }[]

  // Get suggested profiles (excluding self and existing connections)
  const excludeIds = [user.id, ...allNeededIds]
  
  const { data: suggestedProfiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio')
    .limit(20)

  const suggestedUsers = (suggestedProfiles || []).filter(p => !excludeIds.includes(p.id))

  return (
    <FriendsClient
      friends={friends}
      pendingReceived={pendingReceived}
      pendingSent={pendingSent}
      suggestedUsers={suggestedUsers}
      userId={user.id}
    />
  )
}
