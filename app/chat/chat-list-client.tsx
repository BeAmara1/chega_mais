'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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

interface ChatListClientProps {
  conversations: Conversation[]
  friends: { id: string; username: string; avatar_url: string | null }[]
  userId: string
}

export function ChatListClient({ conversations, friends, userId }: ChatListClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredConversations = conversations.filter(c =>
    c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  // Friends who don't have a conversation yet
  const friendsWithoutChat = friends.filter(
    friend => !conversations.some(c => c.otherUser.id === friend.id)
  )

  return (
    <AppShell title="Conversas">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

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
        </div>

        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">Nenhuma conversa</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? 'Nenhuma conversa encontrada'
                : 'Inicie uma conversa com seus amigos'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
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
                    <p className="font-medium text-foreground truncate">
                      {conversation.otherUser.username}
                    </p>
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
      </div>
    </AppShell>
  )
}
