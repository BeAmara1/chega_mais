'use client'

import { useState } from 'react'
import { Search, UserPlus, UserMinus, Check, X, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ProfileWithFriendship {
  id: string
  username: string
  avatar_url: string | null
  bio?: string | null
  friendship_id?: string
}

interface FriendsClientProps {
  friends: ProfileWithFriendship[]
  pendingReceived: ProfileWithFriendship[]
  pendingSent: ProfileWithFriendship[]
  suggestedUsers: ProfileWithFriendship[]
  userId: string
}

export function FriendsClient({
  friends: initialFriends,
  pendingReceived: initialPendingReceived,
  pendingSent: initialPendingSent,
  suggestedUsers: initialSuggested,
  userId,
}: FriendsClientProps) {
  const [friends, setFriends] = useState(initialFriends)
  const [pendingReceived, setPendingReceived] = useState(initialPendingReceived)
  const [pendingSent, setPendingSent] = useState(initialPendingSent)
  const [suggested, setSuggested] = useState(initialSuggested)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSuggested = suggested.filter(s =>
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendRequest = async (profileId: string) => {
    const supabase = createClient()
    if (!supabase) return
    
    const { data, error } = await supabase
      .from('friendships')
      .insert({ user_id: userId, friend_id: profileId, status: 'pending' })
      .select('id')
      .single()

    if (!error && data) {
      const user = suggested.find(s => s.id === profileId)
      if (user) {
        setSuggested(suggested.filter(s => s.id !== profileId))
        setPendingSent([...pendingSent, { ...user, friendship_id: data.id }])
      }
    }
  }

  const handleCancelRequest = async (friendshipId: string, profileId: string) => {
    const supabase = createClient()
    if (!supabase) return
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (!error) {
      const user = pendingSent.find(p => p.friendship_id === friendshipId)
      setPendingSent(pendingSent.filter(p => p.friendship_id !== friendshipId))
      if (user) {
        setSuggested([...suggested, { ...user, friendship_id: undefined }])
      }
    }
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    const supabase = createClient()
    if (!supabase) return
    
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    if (!error) {
      const user = pendingReceived.find(p => p.friendship_id === friendshipId)
      if (user) {
        setPendingReceived(pendingReceived.filter(p => p.friendship_id !== friendshipId))
        setFriends([...friends, user])
      }
    }
  }

  const handleRejectRequest = async (friendshipId: string, profileId: string) => {
    const supabase = createClient()
    if (!supabase) return
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (!error) {
      setPendingReceived(pendingReceived.filter(p => p.friendship_id !== friendshipId))
    }
  }

  const handleRemoveFriend = async (friendshipId: string) => {
    const supabase = createClient()
    if (!supabase) return
    
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (!error) {
      const user = friends.find(f => f.friendship_id === friendshipId)
      setFriends(friends.filter(f => f.friendship_id !== friendshipId))
      if (user) {
        setSuggested([...suggested, { ...user, friendship_id: undefined }])
      }
    }
  }

  return (
    <AppShell title="Amigos">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar amigos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Amigos
              {friends.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Solicitações
              {pendingReceived.length > 0 && (
                <Badge className="ml-1.5 h-5 px-1.5 bg-primary text-primary-foreground">
                  {pendingReceived.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="discover">Descobrir</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4 space-y-3">
            {filteredFriends.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'Nenhum amigo encontrado' : 'Você ainda não tem amigos'}
                </p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-lg bg-card p-3"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={friend.avatar_url || undefined} />
                    <AvatarFallback>
                      {friend.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {friend.username}
                    </p>
                    {friend.bio && (
                      <p className="text-sm text-muted-foreground truncate">
                        {friend.bio}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/chat/${friend.id}`}>
                        <MessageCircle className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFriend(friend.friendship_id!)}
                    >
                      <UserMinus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-4">
            {pendingReceived.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Solicitações recebidas
                </h3>
                {pendingReceived.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 rounded-lg bg-card p-3"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.avatar_url || undefined} />
                      <AvatarFallback>
                        {request.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {request.username}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        onClick={() => handleAcceptRequest(request.friendship_id!)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRejectRequest(request.friendship_id!, request.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingSent.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Solicitações enviadas
                </h3>
                {pendingSent.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 rounded-lg bg-card p-3"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.avatar_url || undefined} />
                      <AvatarFallback>
                        {request.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {request.username}
                      </p>
                      <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelRequest(request.friendship_id!, request.id)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {pendingReceived.length === 0 && pendingSent.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover" className="mt-4 space-y-3">
            {filteredSuggested.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhuma sugestão disponível'}
                </p>
              </div>
            ) : (
              filteredSuggested.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg bg-card p-3"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground truncate">
                        {user.bio}
                      </p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleSendRequest(user.id)}>
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
