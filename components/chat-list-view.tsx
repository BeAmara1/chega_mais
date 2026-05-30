'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, MessageCircle, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Conversation {
  id: string
  otherUser: { id: string; username: string; avatar_url: string | null }
  lastMessage: { content: string; created_at: string; sender_id: string }
  unreadCount: number
}

interface GroupEntry {
  id: string
  name: string
  lastMessage: { content: string; sender_id: string; created_at: string; sender?: { username: string } } | null
  memberCount: number
}

interface ChatListViewProps {
  userId: string | null
  friends: { id: string; username: string; avatar_url: string | null }[]
  onOpenDm: (userId: string, username: string) => void
  onOpenGroup: (groupId: string, groupName: string) => void
  onCreateGroup: () => void
  onClose: () => void
}

export function ChatListView({ userId, friends, onOpenDm, onOpenGroup, onCreateGroup, onClose }: ChatListViewProps) {
  const supabase = useRef(createClient()).current
  const [tab, setTab] = useState<'conversas' | 'grupos'>('conversas')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [groups, setGroups] = useState<GroupEntry[]>([])
  const [search, setSearch] = useState('')
  const [friendsWithoutChat, setFriendsWithoutChat] = useState<typeof friends>([])

  useEffect(() => {
    if (!supabase || !userId) return

    const fetchAll = async () => {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .is('group_id', null)
        .order('created_at', { ascending: false })
      if (!messages) return

      const userIds = new Set<string>()
      messages.forEach((m: any) => { if (m.sender_id) userIds.add(m.sender_id); if (m.receiver_id) userIds.add(m.receiver_id) })
      userIds.delete(userId)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(userIds))
      const profilesMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

      const convMap = new Map<string, Conversation>()
      messages.forEach((m: any) => {
        const otherUserId = m.sender_id === userId ? m.receiver_id : m.sender_id
        if (!otherUserId) return
        const otherUser = profilesMap.get(otherUserId)
        if (!otherUser) return
        if (!convMap.has(otherUserId)) {
          convMap.set(otherUserId, {
            id: otherUserId,
            otherUser: { id: otherUser.id, username: otherUser.username, avatar_url: otherUser.avatar_url },
            lastMessage: { content: m.content, created_at: m.created_at, sender_id: m.sender_id },
            unreadCount: 0,
          })
        }
        if (m.receiver_id === userId && !m.read_at) convMap.get(otherUserId)!.unreadCount++
      })
      setConversations(Array.from(convMap.values()))

      // Fetch groups
      const { data: groupIds } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)
      const gIds = (groupIds || []).map((g: any) => g.group_id)
      if (gIds.length > 0) {
        const { data: userGroups } = await supabase.from('groups').select('*').in('id', gIds)
        const groupsData = await Promise.all((userGroups || []).map(async (g: any) => {
          const { data: lastMsg } = await supabase
            .from('group_messages')
            .select('*, sender:profiles(username)')
            .eq('group_id', g.id)
            .order('created_at', { ascending: false })
            .limit(1)
          return { id: g.id, name: g.name, lastMessage: lastMsg?.[0] || null, memberCount: 0 }
        }))
        const { data: memberCounts } = await supabase
          .from('group_members')
          .select('group_id')
          .in('group_id', gIds)
        const countMap = new Map<string, number>()
        memberCounts?.forEach((m: any) => countMap.set(m.group_id, (countMap.get(m.group_id) || 0) + 1))
        setGroups(groupsData.map((g: any) => ({ ...g, memberCount: countMap.get(g.id) || 0 })))
      }
    }

    fetchAll()
    const interval = setInterval(fetchAll, 4000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    const usedIds = new Set(conversations.map(c => c.otherUser.id))
    setFriendsWithoutChat(friends.filter(f => !usedIds.has(f.id)))
  }, [conversations, friends])

  const filteredConversations = conversations.filter(c =>
    c.otherUser.username.toLowerCase().includes(search.toLowerCase())
  )
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Conversas</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button onClick={() => setTab('conversas')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'conversas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}>Conversas</button>
          <button onClick={() => setTab('grupos')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'grupos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}>Grupos</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {tab === 'conversas' && (
            <>
              {filteredConversations.map((c) => (
                <button key={c.id} onClick={() => onOpenDm(c.otherUser.id, c.otherUser.username)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors text-left">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={c.otherUser.avatar_url || undefined} />
                      <AvatarFallback>{c.otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {c.unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                        {c.unreadCount > 9 ? '9+' : c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-foreground text-sm truncate">{c.otherUser.username}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(c.lastMessage.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.lastMessage.sender_id === userId ? 'Você: ' : ''}{c.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  {search ? 'Nenhuma conversa' : 'Nenhuma conversa ainda'}
                </p>
              )}
            </>
          )}

          {tab === 'grupos' && (
            <>
              {filteredGroups.map((g) => (
                <button key={g.id} onClick={() => onOpenGroup(g.id, g.name)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors text-left">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{g.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-foreground text-sm truncate">{g.name}</span>
                      {g.lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(g.lastMessage.created_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {g.lastMessage
                        ? `${g.lastMessage.sender_id === userId ? 'Você: ' : (g.lastMessage.sender?.username ? `${g.lastMessage.sender.username}: ` : '')}${g.lastMessage.content}`
                        : `${g.memberCount} membro${g.memberCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </button>
              ))}
              {filteredGroups.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  {search ? 'Nenhum grupo' : 'Nenhum grupo ainda'}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="outline" className="flex-1" onClick={onCreateGroup}>
            <Plus className="h-4 w-4 mr-1" /> Criar Grupo
          </Button>
          {tab === 'conversas' && friendsWithoutChat.length > 0 && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onOpenDm(friendsWithoutChat[0].id, friendsWithoutChat[0].username)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Conversa
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
