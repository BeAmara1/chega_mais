import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatListClient } from './chat-list-client'

export default async function ChatPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get all messages for this user (simplified query without foreign key issues)
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .is('group_id', null)
    .order('created_at', { ascending: false })

  // Get all profiles we need
  const userIds = new Set<string>()
  messages?.forEach(m => {
    if (m.sender_id) userIds.add(m.sender_id)
    if (m.receiver_id) userIds.add(m.receiver_id)
  })
  userIds.delete(user.id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', Array.from(userIds))

  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Group messages by conversation
  const conversationsMap = new Map<string, {
    id: string
    otherUser: { id: string; username: string; avatar_url: string | null }
    lastMessage: { content: string; created_at: string; sender_id: string }
    unreadCount: number
  }>()

  messages?.forEach(message => {
    const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id
    if (!otherUserId) return
    
    const otherUser = profilesMap.get(otherUserId)
    if (!otherUser) return

    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, {
        id: otherUserId,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar_url: otherUser.avatar_url,
        },
        lastMessage: {
          content: message.content,
          created_at: message.created_at,
          sender_id: message.sender_id,
        },
        unreadCount: 0,
      })
    }

    if (message.receiver_id === user.id && !message.read_at) {
      const conv = conversationsMap.get(otherUserId)!
      conv.unreadCount++
    }
  })

  const conversations = Array.from(conversationsMap.values())

  // Get friends for new conversations
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

  const friends = friendProfiles || []

  // Get user's groups
  const { data: groupIds } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const userGroupIds = (groupIds || []).map(g => g.group_id)

  let groupsWithLastMessage: any[] = []
  if (userGroupIds.length > 0) {
    const { data: userGroups } = await supabase
      .from('groups')
      .select('*')
      .in('id', userGroupIds)

    // Get last message for each group and unread count
    const groupsData = await Promise.all((userGroups || []).map(async (g) => {
      const { data: lastMsg } = await supabase
        .from('group_messages')
        .select('*, sender:profiles(id, username, avatar_url)')
        .eq('group_id', g.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const unreadCount = 0
      return { ...g, lastMessage: lastMsg?.[0] || null, unreadCount }
    }))

    // Get member counts
    const { data: memberCounts } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', userGroupIds)

    const countMap = new Map<string, number>()
    memberCounts?.forEach(m => {
      countMap.set(m.group_id, (countMap.get(m.group_id) || 0) + 1)
    })

    groupsWithLastMessage = groupsData.map(g => ({
      ...g,
      memberCount: countMap.get(g.id) || 0,
    }))
  }

  return (
    <ChatListClient
      conversations={conversations}
      friends={friends}
      initialGroups={groupsWithLastMessage}
      userId={user.id}
    />
  )
}
