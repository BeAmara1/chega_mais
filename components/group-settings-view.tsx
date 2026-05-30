'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Search, Plus, Shield, UserMinus, LogOut, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GroupAvatarUpload } from '@/components/group-avatar-upload'
import type { ChatGroup, ChatGroupMember } from '@/lib/types'

interface GroupSettingsViewProps {
  groupId: string
  currentUserId: string
  onBack: () => void
  onGroupUpdated: (data: { name?: string; description?: string | null; avatar_url?: string | null }) => void
  onGroupDeleted: () => void
}

export function GroupSettingsView({ groupId, currentUserId, onBack, onGroupUpdated, onGroupDeleted }: GroupSettingsViewProps) {
  const supabase = useRef(createClient()).current
  const [group, setGroup] = useState<ChatGroup | null>(null)
  const [members, setMembers] = useState<ChatGroupMember[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [search, setSearch] = useState('')
  const [friends, setFriends] = useState<{ id: string; username: string; avatar_url: string | null }[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const isAdmin = members.find(m => m.user_id === currentUserId)?.role === 'admin'
  const admins = members.filter(m => m.role === 'admin')
  const regulars = members.filter(m => m.role === 'member')

  useEffect(() => {
    if (!supabase) return
    Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('group_members').select('*, profile:profiles(id, username, avatar_url)').eq('group_id', groupId),
    ]).then(([gRes, mRes]) => {
      if (gRes.data) {
        setGroup(gRes.data)
        setName(gRes.data.name)
        setDescription(gRes.data.description || '')
      }
      if (mRes.data) setMembers(mRes.data as unknown as ChatGroupMember[])
    })
  }, [groupId])

  const handleSave = async () => {
    if (!name.trim() || saving || !supabase) return
    setSaving(true)
    const { error } = await supabase
      .from('groups')
      .update({ name: name.trim(), description: description.trim() || null })
      .eq('id', groupId)
    if (!error) {
      onGroupUpdated({ name: name.trim(), description: description.trim() || null })
    }
    setSaving(false)
  }

  const handleRemove = async (userId: string) => {
    if (!supabase) return
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  const handlePromote = async (userId: string) => {
    if (!supabase) return
    await supabase.from('group_members').update({ role: 'admin' }).eq('group_id', groupId).eq('user_id', userId)
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: 'admin' } : m))
  }

  const handleLeave = async () => {
    if (!supabase) return
    setLeaving(true)
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', currentUserId)
    onGroupDeleted()
  }

  const handleDelete = async () => {
    if (!supabase) return
    setDeleting(true)
    await supabase.from('group_members').delete().eq('group_id', groupId)
    await supabase.from('group_messages').delete().eq('group_id', groupId)
    await supabase.from('groups').delete().eq('id', groupId)
    onGroupDeleted()
  }

  const openAddMode = async () => {
    setAddMode(true)
    setSearch('')
    if (!supabase) return
    setLoadingFriends(true)
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
    setLoadingFriends(false)
  }

  const handleAddMember = async (friendId: string) => {
    if (!supabase) return
    const { data } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: friendId, role: 'member' })
      .select('*, profile:profiles(id, username, avatar_url)')
      .single()
    if (data) {
      setMembers(prev => [...prev, data as unknown as ChatGroupMember])
      setFriends(prev => prev.filter(f => f.id !== friendId))
    }
  }

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase())
  )

  if (!group) return null

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="text-lg font-semibold">Configurar Grupo</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isAdmin && (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Foto do Grupo</h3>
              <GroupAvatarUpload
                groupId={groupId}
                currentUrl={group.avatar_url}
                groupName={group.name}
                onUploaded={(url) => onGroupUpdated({ avatar_url: url || null })}
              />
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Informacoes</h3>
              <div className="space-y-2">
                <Input placeholder="Nome do grupo" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="Descricao (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <Button onClick={handleSave} disabled={!name.trim() || saving} size="sm">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </section>
          </>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Membros ({members.length})</h3>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={addMode ? () => setAddMode(false) : openAddMode}>
                {addMode ? 'Cancelar' : 'Adicionar'}
              </Button>
            )}
          </div>

          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {admins.map(m => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-lg p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={m.profile?.avatar_url || undefined} />
                  <AvatarFallback>{(m.profile?.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.profile?.username || 'Usuário'}</p>
                </div>
                <Shield className="h-4 w-4 text-primary flex-shrink-0" />
              </div>
            ))}
            {regulars.map(m => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-lg p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={m.profile?.avatar_url || undefined} />
                  <AvatarFallback>{(m.profile?.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.profile?.username || 'Usuário'}</p>
                </div>
                {isAdmin && m.user_id !== currentUserId && (
                  <div className="flex gap-1">
                    <button onClick={() => handlePromote(m.user_id)} className="text-xs text-muted-foreground hover:text-primary p-1" title="Promover a admin">
                      <Shield className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleRemove(m.user_id)} className="text-xs text-destructive hover:text-destructive/80 p-1" title="Remover">
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {addMode && isAdmin && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar amigos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="max-h-[180px] overflow-y-auto space-y-1">
                {loadingFriends ? (
                  <p className="text-center text-sm text-muted-foreground py-4">Carregando...</p>
                ) : filteredFriends.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">Nenhum amigo disponivel</p>
                ) : (
                  filteredFriends.map(f => (
                    <button key={f.id} onClick={() => handleAddMember(f.id)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors text-left">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={f.avatar_url || undefined} />
                        <AvatarFallback>{f.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm">{f.username}</span>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          {!isAdmin && (
            <Button variant="destructive" className="w-full" onClick={handleLeave} disabled={leaving}>
              <LogOut className="h-4 w-4 mr-2" />
              {leaving ? 'Saindo...' : 'Sair do Grupo'}
            </Button>
          )}
          {isAdmin && (
            <Button variant="destructive" className="w-full" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Grupo
            </Button>
          )}
        </section>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. Todas as mensagens e membros serao removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Sim, excluir grupo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
