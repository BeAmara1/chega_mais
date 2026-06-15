'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAblyClient, getChatChannel } from '@/lib/ably/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Profile, Message } from '@/lib/types'

interface ChatClientProps {
  otherUser: Profile
  initialMessages: Message[]
  userId: string
}

export function ChatClient({ otherUser, initialMessages, userId }: ChatClientProps) {
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastPolledAt = useRef<string>(new Date().toISOString())
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!supabase) return

    const poll = async () => {
      const { data: newMessages } = await supabase
        .from('messages')
        .select('*')
        .is('group_id', null)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${userId})`)
        .gte('created_at', lastPolledAt.current)
        .order('created_at', { ascending: true })

      if (!newMessages || newMessages.length === 0) return

      setMessages((prev) => {
        const existingIds = new Set(prev.map(m => m.id))
        const toAdd = newMessages.filter(m => !existingIds.has(m.id))
        if (toAdd.length === 0) return prev

        for (const msg of toAdd) {
          if (msg.sender_id === otherUser.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', msg.id)
          }
        }

        return [...prev, ...toAdd]
      })

      lastPolledAt.current = new Date().toISOString()
    }

    const interval = setInterval(poll, 3000)

    const ably = getAblyClient()
    const channelName = getChatChannel(userId, otherUser.id)
    const channel = ably?.channels.get(channelName)

    const handleMessage = (msg: any) => {
      const newMsg = msg.data as Message
      setMessages((prev) => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
      if (newMsg.sender_id === otherUser.id && supabase) {
        supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', newMsg.id)
      }
    }
    const handleTyping = (msg: any) => {
      if (msg.data.userId === otherUser.id) {
        setIsTyping(true)
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setIsTyping(false), 3000)
      }
    }

    channel?.subscribe('message', handleMessage)
    channel?.subscribe('typing', handleTyping)

    return () => {
      clearInterval(interval)
      channel?.unsubscribe('message', handleMessage)
      channel?.unsubscribe('typing', handleTyping)
      clearTimeout(typingTimeout.current)
    }
  }, [userId, otherUser.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    const ably = getAblyClient()
    ably?.channels.get(getChatChannel(userId, otherUser.id)).publish('typing', { userId })
  }

  const handleSendMessage = async () => {
    const content = newMessage.trim()
    if (!content || isSending || !supabase) return

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: userId,
      receiver_id: otherUser.id,
      group_id: null,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage('')
    setIsSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: userId, receiver_id: otherUser.id, content: content.trim() })
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao enviar mensagem:', error.message)
      setMessages((prev) => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    } else {
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m))

      const ably = getAblyClient()
      if (ably) {
        const channelName = getChatChannel(userId, otherUser.id)
        const channel = ably.channels.get(channelName)
        channel.publish('message', {
          id: data.id,
          sender_id: userId,
          receiver_id: otherUser.id,
          group_id: null,
          content: content.trim(),
          read_at: null,
          created_at: new Date().toISOString(),
        })
      }

      router.refresh()
    }

    setIsSending(false)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Hoje'
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Sao_Paulo',
    })
  }

  const groupedMessages: { date: string; messages: Message[] }[] = []
  let currentDate = ''
  messages.forEach((message) => {
    const messageDate = new Date(message.created_at).toDateString()
    if (messageDate !== currentDate) {
      currentDate = messageDate
      groupedMessages.push({ date: message.created_at, messages: [message] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message)
    }
  })

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.avatar_url || undefined} />
          <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${otherUser.id}`} className="font-medium text-foreground hover:underline truncate block">
            {otherUser.username}
          </Link>
          {isTyping && <p className="text-xs text-muted-foreground">Digitando...</p>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <div className="flex justify-center">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground capitalize">
                {formatDateHeader(group.date)}
              </span>
            </div>
            {group.messages.map((message) => {
              const isOwn = message.sender_id === userId
              return (
                <div key={message.id} className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                  <div className={cn('max-w-[75%] rounded-2xl px-4 py-2', isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card text-card-foreground rounded-bl-md')}>
                    <p className="text-sm break-words">{message.content}</p>
                    <div className={cn('mt-1 flex items-center justify-end gap-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      <span className="text-[10px]">{formatTime(message.created_at)}</span>
                      {isOwn && (
                        message.read_at ? (
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
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage() }} className="flex items-center gap-2">
          <Input placeholder="Digite uma mensagem..." value={newMessage} onChange={handleInputChange} className="flex-1" />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
