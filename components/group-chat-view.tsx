'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAblyClient, getGroupChannel } from '@/lib/ably/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { GroupMessage } from '@/lib/types'

interface GroupChatViewProps {
  groupId: string
  groupName: string
  userId: string
  onBack: () => void
  onSettings?: (groupId: string) => void
}

export function GroupChatView({ groupId, groupName, userId, onBack, onSettings }: GroupChatViewProps) {
  const supabase = useRef(createClient()).current
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastPolledAt = useRef<string>(new Date().toISOString())
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!supabase) return

    const load = async () => {
      const [msgRes, cntRes, grpRes] = await Promise.all([
        supabase
          .from('group_messages')
          .select('*, sender:profiles(id, username, avatar_url)')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true }),
        supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', groupId),
        supabase
          .from('groups')
          .select('avatar_url')
          .eq('id', groupId)
          .single(),
      ])
      if (msgRes.data) setMessages(msgRes.data as unknown as GroupMessage[])
      setMemberCount(cntRes.count || 0)
      if (grpRes.data) setAvatarUrl(grpRes.data.avatar_url)
    }
    load()

    const poll = async () => {
      const { data: newMsgs } = await supabase
        .from('group_messages')
        .select('*, sender:profiles(id, username, avatar_url)')
        .eq('group_id', groupId)
        .gte('created_at', lastPolledAt.current)
        .order('created_at', { ascending: true })
      if (newMsgs && newMsgs.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id))
          return [...prev, ...newMsgs.filter(m => !ids.has(m.id))] as GroupMessage[]
        })
        lastPolledAt.current = new Date().toISOString()
      }
    }
    const interval = setInterval(poll, 3000)

    const ably = getAblyClient()
    const channelName = getGroupChannel(groupId)
    const channel = ably?.channels.get(channelName)
    const handleMsg = (msg: any) => {
      const m = msg.data as GroupMessage
      setMessages(prev => prev.some(p => p.id === m.id) ? prev : [...prev, m])
      if (m.sender_id !== userId && supabase && !m.read_by.includes(userId)) {
        supabase.from('group_messages').update({ read_by: [...m.read_by, userId] }).eq('id', m.id)
      }
    }
    const handleTyping = (msg: any) => {
      const { userId: typingUserId, username } = msg.data
      if (typingUserId !== userId) {
        setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username])
        clearTimeout(typingTimeouts.current.get(username))
        typingTimeouts.current.set(username, setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== username))
          typingTimeouts.current.delete(username)
        }, 3000))
      }
    }
    channel?.subscribe('message', handleMsg)
    channel?.subscribe('typing', handleTyping)

    return () => {
      clearInterval(interval)
      channel?.unsubscribe('message', handleMsg)
      channel?.unsubscribe('typing', handleTyping)
      typingTimeouts.current.forEach(t => clearTimeout(t))
    }
  }, [groupId, userId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    const ably = getAblyClient()
    ably?.channels.get(getGroupChannel(groupId)).publish('typing', { userId, username: 'Você' })
  }

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content || isSending || !supabase) return
    const tempId = `temp-${Date.now()}`
    const optimistic: GroupMessage = { id: tempId, group_id: groupId, sender_id: userId, content, created_at: new Date().toISOString(), read_by: [userId] }
    setMessages(prev => [...prev, optimistic])
    setNewMessage('')
    setIsSending(true)

    const { data, error } = await supabase
      .from('group_messages')
      .insert({ group_id: groupId, sender_id: userId, content: content.trim(), read_by: [userId] })
      .select('id')
      .single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m))
      const ably = getAblyClient()
      if (ably) {
        ably.channels.get(getGroupChannel(groupId)).publish('message', {
          id: data.id, group_id: groupId, sender_id: userId, content: content.trim(),
          read_by: [userId], created_at: new Date().toISOString(),
        })
      }
    }
    setIsSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{groupName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate">{groupName}</p>
          <p className="text-xs text-muted-foreground">
            {typingUsers.length > 0
              ? `${typingUsers.join(', ')} ${typingUsers.length === 1 ? 'esta' : 'estao'} digitando...`
              : `${memberCount} membro${memberCount !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        {onSettings && (
          <Button variant="ghost" size="icon" onClick={() => onSettings(groupId)} title="Configuracoes">
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId
          return (
            <div key={msg.id} className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
              {!isOwn && (
                <Link href={`/profile/${msg.sender_id}`}>
                  <Avatar className="mt-1 h-7 w-7 flex-shrink-0">
                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{(msg.sender?.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
              )}
              <div className={cn('max-w-[80%]')}>
                {!isOwn && (
                  <Link href={`/profile/${msg.sender_id}`} className="mb-0.5 text-xs text-muted-foreground hover:underline block">
                    {msg.sender?.username || 'Usuário'}
                  </Link>
                )}
                <div className={cn('rounded-2xl px-3 py-2', isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card text-card-foreground rounded-bl-md')}>
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className={cn('mt-0.5 text-[10px]', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-3">
        <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
          <Input value={newMessage} onChange={handleInputChange} placeholder="Digite uma mensagem..." className="flex-1" />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  )
}
