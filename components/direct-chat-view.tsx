'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAblyClient, getChatChannel } from '@/lib/ably/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

interface DirectChatViewProps {
  otherUserId: string
  otherUsername: string
  userId: string
  onBack: () => void
}

export function DirectChatView({ otherUserId, otherUsername, userId, onBack }: DirectChatViewProps) {
  const supabase = useRef(createClient()).current
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastPolledAt = useRef<string>(new Date().toISOString())
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const ablyChannelRef = useRef<any>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!supabase) return

    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .is('group_id', null)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })
      if (data) setMessages(data as Message[])
    }
    load()

    const poll = async () => {
      const { data: newMsgs } = await supabase
        .from('messages')
        .select('*')
        .is('group_id', null)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .gte('created_at', lastPolledAt.current)
        .order('created_at', { ascending: true })
      if (newMsgs && newMsgs.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id))
          return [...prev, ...newMsgs.filter(m => !ids.has(m.id))] as Message[]
        })
        lastPolledAt.current = new Date().toISOString()
      }
    }
    const interval = setInterval(poll, 3000)

    const ably = getAblyClient()
    const channelName = getChatChannel(userId, otherUserId)
    const channel = ably.channels.get(channelName)
    ablyChannelRef.current = channel

    const handleMsg = (msg: any) => {
      const m = msg.data as Message
      setMessages(prev => prev.some(p => p.id === m.id) ? prev : [...prev, m])
      if (m.sender_id !== userId && supabase) {
        supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id)
      }
    }
    const handleTyping = (msg: any) => {
      if (msg.data.userId === otherUserId) {
        setIsTyping(true)
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setIsTyping(false), 3000)
      }
    }
    channel.subscribe('message', handleMsg)
    channel.subscribe('typing', handleTyping)

    return () => {
      clearInterval(interval)
      channel.unsubscribe('message', handleMsg)
      channel.unsubscribe('typing', handleTyping)
      clearTimeout(typingTimeout.current)
    }
  }, [userId, otherUserId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    if (ablyChannelRef.current) {
      ablyChannelRef.current.publish('typing', { userId })
    }
  }

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content || isSending || !supabase) return
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = { id: tempId, sender_id: userId, receiver_id: otherUserId, group_id: null, content, read_at: null, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])
    setNewMessage('')
    setIsSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: userId, receiver_id: otherUserId, content: content.trim() })
      .select('id')
      .single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m))
      const ably = getAblyClient()
      ably.channels.get(getChatChannel(userId, otherUserId)).publish('message', {
        id: data.id, sender_id: userId, receiver_id: otherUserId, group_id: null,
        content: content.trim(), read_at: null, created_at: new Date().toISOString(),
      })
    }
    setIsSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <Avatar className="h-8 w-8"><AvatarFallback>{otherUsername.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${otherUserId}`} className="font-medium text-foreground hover:underline truncate block">
            {otherUsername}
          </Link>
          {isTyping && <p className="text-xs text-muted-foreground">Digitando...</p>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId
          return (
            <div key={msg.id} className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
              <div className={cn('max-w-[80%] rounded-2xl px-3 py-2', isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card text-card-foreground rounded-bl-md')}>
                <p className="text-sm break-words">{msg.content}</p>
                <div className={cn('mt-0.5 flex items-center justify-end gap-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  <span className="text-[10px]">
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isOwn && (
                    msg.read_at ? (
                      <CheckCheck className="h-3 w-3 text-blue-400" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )
                  )}
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
