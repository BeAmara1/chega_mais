'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Plus, MessageCircle, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Conversation {
  id: string
  otherUser: { id: string; username: string; avatar_url: string | null }
  lastMessage: {
    content: string
    created_at: string
    sender_id: string
  }
  unreadCount: number
}

interface GroupEntry {
  id: string
  name: string
  description: string | null
  type: 'private' | 'event'
  event_id: string | null
  created_by: string
  created_at: string
  avatar_url: string | null
  lastMessage: { id: string; content: string; sender_id: string; created_at: string; sender?: { id: string; username: string; avatar_url: string | null } } | null
  unreadCount: number
  memberCount: number
}

interface ChatListClientProps {
  conversations: Conversation[]
  friends: { id: string; username: string; avatar_url: string | null }[]
  initialGroups: GroupEntry[]
  userId: string
}

export function ChatListClient({ conversations: initialConversations, friends, initialGroups, userId }: ChatListClientProps) {
  const supabase = useRef(createClient()).current
  const [conversations, setConversations] = useState(initialConversations)
  const [groups, setGroups] = useState(initialGroups)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tab, setTab] = useState<'conversas' | 'grupos'>('conversas')

  // Polling: atualiza a lista de conversas a cada 4s
  useEffect(() => {
    if (!supabase) return

    const fetchConversations = async () => {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .is('group_id', null)
        .order('created_at', { ascending: false })

      if (!messages) return

      const userIds = new Set<string>()
      messages.forEach(m => {
        if (m.sender_id) userIds.add(m.sender_id)
        if (m.receiver_id) userIds.add(m.receiver_id)
      })
      userIds.delete(userId)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(userIds))

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      const conversationsMap = new Map<string, Conversation>()
      messages.forEach(message => {
        const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id
        if (!otherUserId) return
        const otherUser = profilesMap.get(otherUserId)
        if (!otherUser) return

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            id: otherUserId,
            otherUser: { id: otherUser.id, username: otherUser.username, avatar_url: otherUser.avatar_url },
            lastMessage: {
              content: message.content,
              created_at: message.created_at,
              sender_id: message.sender_id,
            },
            unreadCount: 0,
          })
        }
        if (message.receiver_id === userId && !message.read_at) {
          conversationsMap.get(otherUserId)!.unreadCount++
        }
      })

      setConversations(Array.from(conversationsMap.values()))
    }

    const interval = setInterval(fetchConversations, 4000)
    return () => clearInterval(interval)
  }, [userId])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' })
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
    }
  }

  const friendsWithoutChat = friends.filter(
    friend => !conversations.some(c => c.otherUser.id === friend.id)
  )

  const filteredConversations = conversations.filter(c =>
    c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell title="Conversas">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas ou grupos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {tab === 'conversas' ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova conversa</DialogTitle>
                  <DialogDescription>
                    Selecione um amigo para iniciar uma conversa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {friendsWithoutChat.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Você já tem conversas com todos os seus amigos
                    </p>
                  ) : (
                    friendsWithoutChat.map((friend) => (
                      <Link
                        key={friend.id}
                        href={`/chat/${friend.id}`}
                        onClick={() => setIsDialogOpen(false)}
                        className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback>
                            {friend.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{friend.username}</span>
                      </Link>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button size="icon" asChild>
              <Link href="/chat/create-group">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setTab('conversas')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'conversas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Conversas
          </button>
          <button
            onClick={() => setTab('grupos')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'grupos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Grupos
          </button>
        </div>

        {tab === 'conversas' && (
          <>
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">Nenhuma conversa</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery ? 'Nenhuma conversa encontrada' : 'Inicie uma conversa com seus amigos'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/chat/${conversation.otherUser.id}`}
                    className="flex items-center gap-3 rounded-lg bg-card p-3 transition-colors hover:bg-muted"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.otherUser.avatar_url || undefined} />
                        <AvatarFallback>
                          {conversation.otherUser.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">{conversation.otherUser.username}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(conversation.lastMessage.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.sender_id === userId ? 'Você: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'grupos' && (
          <>
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">Nenhum grupo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery ? 'Nenhum grupo encontrado' : 'Crie ou entre em um grupo'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/chat/groups/${group.id}`}
                    className="flex items-center gap-3 rounded-lg bg-card p-3 transition-colors hover:bg-muted"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">{group.name}</p>
                        {group.lastMessage && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTime(group.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {group.lastMessage
                          ? `${group.lastMessage.sender_id === userId ? 'Você: ' : (group.lastMessage.sender?.username ? `${group.lastMessage.sender.username}: ` : '')}${group.lastMessage.content}`
                          : `${group.memberCount} membro${group.memberCount !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
