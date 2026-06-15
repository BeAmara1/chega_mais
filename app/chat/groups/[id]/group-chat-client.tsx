'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Users, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAblyClient, getGroupChannel } from '@/lib/ably/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { GroupSettingsView } from '@/components/group-settings-view'
import { GroupMembersDialog } from '@/components/group-members-dialog'
import type { ChatGroup, ChatGroupMember, GroupMessage, Profile } from '@/lib/types'

interface GroupChatClientProps {
  group: ChatGroup
  initialMessages: GroupMessage[]
  members: ChatGroupMember[]
  currentMember: ChatGroupMember | null
  userId: string
}

export function GroupChatClient({ group, initialMessages, members: initialMembers, currentMember, userId }: GroupChatClientProps) {
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages)
  const [members, setMembers] = useState<ChatGroupMember[]>(initialMembers)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [groupInfo, setGroupInfo] = useState(group)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastPolledAt = useRef<string>(new Date().toISOString())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const isAdmin = currentMember?.role === 'admin'

  // Polling fallback
  useEffect(() => {
    if (!supabase) return

    const poll = async () => {
      const { data: newMessages } = await supabase
        .from('group_messages')
        .select('*, sender:profiles(id, username, avatar_url)')
        .eq('group_id', group.id)
        .gte('created_at', lastPolledAt.current)
        .order('created_at', { ascending: true })

      if (!newMessages || newMessages.length === 0) return

      setMessages((prev) => {
        const existingIds = new Set(prev.map(m => m.id))
        const toAdd = newMessages.filter(m => !existingIds.has(m.id))
        if (toAdd.length === 0) return prev
        return [...prev, ...toAdd] as GroupMessage[]
      })

      lastPolledAt.current = new Date().toISOString()
    }

    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [group.id])

  // Ably subscription
  useEffect(() => {
    const ably = getAblyClient()
    const channelName = getGroupChannel(group.id)
    const channel = ably.channels.get(channelName)

    const handleMessage = (msg: any) => {
      const newMsg = msg.data as GroupMessage
      setMessages((prev) => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])

      if (newMsg.sender_id !== userId && supabase) {
        if (!newMsg.read_by.includes(userId)) {
          supabase
            .from('group_messages')
            .update({ read_by: [...newMsg.read_by, userId] })
            .eq('id', newMsg.id)
        }
      }
    }

    channel.subscribe('message', handleMessage)

    return () => {
      channel.unsubscribe('message', handleMessage)
    }
  }, [group.id, userId])

  const handleSendMessage = async () => {
    const content = newMessage.trim()
    if (!content || isSending || !supabase) return

    const tempId = `temp-${Date.now()}`
    const senderProfile = members.find(m => m.user_id === userId)?.profile
    const optimisticMessage: GroupMessage = {
      id: tempId,
      group_id: group.id,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      read_by: [userId],
      sender: senderProfile ? senderProfile as Profile : undefined,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage('')
    setIsSending(true)

    const { data, error } = await supabase
      .from('group_messages')
      .insert({ group_id: group.id, sender_id: userId, content: content.trim(), read_by: [userId] })
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao enviar mensagem:', error.message)
      setMessages((prev) => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    } else {
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m))

      const ably = getAblyClient()
      const channel = ably.channels.get(getGroupChannel(group.id))
      channel.publish('message', {
        id: data.id,
        group_id: group.id,
        sender_id: userId,
        content: content.trim(),
        read_by: [userId],
        created_at: new Date().toISOString(),
      sender: senderProfile ? { ...senderProfile } : undefined,
      })
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
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })
  }

  const groupedMessages: { date: string; messages: GroupMessage[] }[] = []
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
          <AvatarImage src={groupInfo.avatar_url || undefined} />
          <AvatarFallback>{groupInfo.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{groupInfo.name}</p>
          <p className="text-xs text-muted-foreground">{members.length} membro{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} title="Configuracoes">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowMembers(true)} title="Membros">
          <Users className="h-5 w-5" />
        </Button>
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
                <div key={message.id} className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                  {!isOwn && (
                    <Avatar className="mt-1 h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.sender?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(message.sender?.username || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('max-w-[75%]')}>
                    {!isOwn && (
                      <p className="mb-0.5 text-xs text-muted-foreground ml-1">
                        {message.sender?.username || 'Usuário'}
                      </p>
                    )}
                    <div className={cn(
                      'rounded-2xl px-4 py-2',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card text-card-foreground rounded-bl-md'
                    )}>
                      <p className="text-sm break-words">{message.content}</p>
                      <p className={cn('mt-1 text-[10px]', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {formatTime(message.created_at)}
                      </p>
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
          <Input
            placeholder="Digite uma mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <GroupMembersDialog
        open={showMembers}
        onOpenChange={setShowMembers}
        group={groupInfo}
        members={members}
        currentUserId={userId}
        isAdmin={isAdmin}
        onMembersChange={setMembers}
      />

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="flex flex-col p-0 gap-0 max-w-full md:max-w-2xl h-[100dvh] md:max-h-[80vh]" showCloseButton={false}>
          <GroupSettingsView
            groupId={group.id}
            currentUserId={userId}
            onBack={() => setShowSettings(false)}
            onGroupUpdated={(data) => {
              setGroupInfo(prev => ({ ...prev, ...data }))
            }}
            onGroupDeleted={() => {
              setShowSettings(false)
              router.push('/chat')
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
