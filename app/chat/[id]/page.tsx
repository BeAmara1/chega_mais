import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatClient } from './chat-client'

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: otherUserId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get other user's profile
  const { data: otherUser, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', otherUserId)
    .single()

  if (error || !otherUser) {
    notFound()
  }

  // Get messages between users
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .is('group_id', null)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  // Mark messages as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', user.id)
    .is('read_at', null)

  return (
    <ChatClient
      otherUser={otherUser}
      initialMessages={messages || []}
      userId={user.id}
    />
  )
}
