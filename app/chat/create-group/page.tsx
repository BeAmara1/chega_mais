import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateGroupClient } from './create-group-client'

export default async function CreateGroupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const friendIds = (friendships || []).map(f =>
    f.user_id === user.id ? f.friend_id : f.user_id
  )

  const { data: friendProfiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', friendIds)

  return <CreateGroupClient friends={friendProfiles || []} userId={user.id} />
}
