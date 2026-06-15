'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Shield, UserMinus, LogOut, Search, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ChatGroup, ChatGroupMember } from '@/lib/types'

interface GroupMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: ChatGroup
  members: ChatGroupMember[]
  currentUserId: string
  isAdmin: boolean
  onMembersChange: (members: ChatGroupMember[]) => void
}

export function GroupMembersDialog({
  open,
  onOpenChange,
  group,
  members,
  currentUserId,
  isAdmin,
  onMembersChange,
}: GroupMembersDialogProps) {
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const [addMode, setAddMode] = useState(false)
  const [search, setSearch] = useState('')
  const [friends, setFriends] = useState<{ id: string; username: string; avatar_url: string | null }[]>([])
  const [loading, setLoading] = useState(false)

  const handleRemove = async (userId: string) => {
    if (!supabase) return
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group.id)
      .eq('user_id', userId)

    if (!error) {
      onMembersChange(members.filter(m => m.user_id !== userId))
    } else {
      console.error('Erro ao remover membro:', error.message)
    }
  }

  const handleLeave = async () => {
    if (!supabase) return
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group.id)
      .eq('user_id', currentUserId)

    if (!error) {
      onOpenChange(false)
      router.push('/chat')
    } else {
      console.error('Erro ao sair do grupo:', error.message)
    }
  }

  const handlePromote = async (userId: string) => {
    if (!supabase) return
    const { error } = await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', group.id)
      .eq('user_id', userId)

    if (!error) {
      onMembersChange(members.map(m => m.user_id === userId ? { ...m, role: 'admin' } : m))
    } else {
      console.error('Erro ao promover membro:', error.message)
    }
  }

  const openAddMode = async () => {
    setAddMode(true)
    setSearch('')
    if (!supabase) return
    setLoading(true)

    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
      .eq('status', 'accepted')

    const friendIds = (friendships || []).map(f =>
      f.user_id === currentUserId ? f.friend_id : f.user_id
    ).filter(id => !members.some(m => m.user_id === id))

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', friendIds)

    setFriends(profiles || [])
    setLoading(false)
  }

  const handleAddMember = async (friendId: string) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: friendId, role: 'member' })
      .select('*, profile:profiles(id, username, avatar_url)')
      .single()

    if (!error && data) {
      onMembersChange([...members, data as unknown as ChatGroupMember])
      setFriends(friends.filter(f => f.id !== friendId))
    } else {
      console.error('Erro ao adicionar membro:', error?.message)
    }
  }

  const admins = members.filter(m => m.role === 'admin')
  const regulars = members.filter(m => m.role === 'member')

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{group.name}</DialogTitle>
          <DialogDescription>{members.length} membro{members.length !== 1 ? 's' : ''}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1">
          {admins.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground px-1 py-2 font-medium">Administradores</p>
              {admins.map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 rounded-lg p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>{(member.profile?.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${member.user_id}`} className="text-sm font-medium text-foreground truncate hover:underline block">
                      {member.profile?.username || 'Usuário'}
                    </Link>
                  </div>
                  <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {regulars.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground px-1 py-2 font-medium">Membros</p>
              {regulars.map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 rounded-lg p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>{(member.profile?.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${member.user_id}`} className="text-sm font-medium text-foreground truncate hover:underline block">
                      {member.profile?.username || 'Usuário'}
                    </Link>
                  </div>
                  {isAdmin && member.user_id !== currentUserId && (
                    <button onClick={() => handlePromote(member.user_id)} className="text-xs text-muted-foreground hover:text-primary mr-2" title="Promover a admin">
                      <Shield className="h-4 w-4" />
                    </button>
                  )}
                  {isAdmin && member.user_id !== currentUserId && (
                    <button onClick={() => handleRemove(member.user_id)} className="text-xs text-destructive hover:text-destructive/80" title="Remover">
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {addMode && isAdmin && (
          <div className="border-t border-border pt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar amigos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-4">Carregando...</p>
              ) : filteredFriends.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhum amigo disponível</p>
              ) : (
                filteredFriends.map((friend) => (
                  <button key={friend.id} onClick={() => handleAddMember(friend.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors text-left">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm text-foreground">{friend.username}</span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 border-t border-border pt-3">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={addMode ? () => setAddMode(false) : openAddMode} className="flex-1">
              {addMode ? 'Cancelar' : 'Adicionar Membros'}
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleLeave} className="flex-1">
            <LogOut className="h-4 w-4 mr-1" />
            Sair do Grupo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
