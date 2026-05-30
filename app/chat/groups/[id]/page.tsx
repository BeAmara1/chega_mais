import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupChatClient } from './group-chat-client'
import type { ChatGroup, ChatGroupMember, GroupMessage, Profile } from '@/lib/types'

export default async function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  const { data: membership } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    if (group.type === 'event' && group.event_id) {
      const { data: attends } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', group.event_id)
        .eq('user_id', user.id)
        .single()
      if (attends) {
        await supabase
          .from('group_members')
          .insert({ group_id: groupId, user_id: user.id, role: 'member' })
      } else {
        notFound()
      }
    } else {
      notFound()
    }
  }

  const { data: members } = await supabase
    .from('group_members')
    .select('*, profile:profiles(id, username, avatar_url)')
    .eq('group_id', groupId)

  const { data: messages } = await supabase
    .from('group_messages')
    .select('*, sender:profiles(id, username, avatar_url)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })

  const currentMember = members?.find(m => m.user_id === user.id) || null

  return (
    <GroupChatClient
      group={group as ChatGroup}
      initialMessages={(messages || []) as unknown as GroupMessage[]}
      members={(members || []) as unknown as ChatGroupMember[]}
      currentMember={currentMember as ChatGroupMember | null}
      userId={user.id}
    />
  )
}
