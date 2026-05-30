'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Plus, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function CreateGroupClient({ friends, userId }: { friends: { id: string; username: string; avatar_url: string | null }[]; userId: string }) {
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase()) && !selectedIds.includes(f.id)
  )

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    if (!name.trim() || !supabase) return
    setCreating(true)

    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name: name.trim(), description: description.trim() || null, type: 'private', created_by: userId })
      .select('id')
      .single()

    if (error || !group) {
      console.error('Erro ao criar grupo:', error?.message)
      setCreating(false)
      return
    }

    const membersToInsert = [
      { group_id: group.id, user_id: userId, role: 'admin' },
      ...selectedIds.map(id => ({ group_id: group.id, user_id: id, role: 'member' as const })),
    ]

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(membersToInsert)

    if (membersError) {
      console.error('Erro ao adicionar membros:', membersError.message)
    }

    setCreating(false)
    router.push(`/chat/groups/${group.id}`)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Criar Grupo</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome do grupo</label>
          <Input placeholder="Ex: Festa de Sexta" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
          <Input placeholder="O que o grupo vai discutir?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Adicionar membros</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar amigos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {friends.filter(f => selectedIds.includes(f.id)).map((friend) => (
              <div key={friend.id} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
                <span>{friend.username}</span>
                <button onClick={() => toggleMember(friend.id)} className="ml-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {filteredFriends.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              {search ? 'Nenhum amigo encontrado' : 'Nenhum amigo disponível'}
            </p>
          ) : (
            filteredFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => toggleMember(friend.id)}
                className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={friend.avatar_url || undefined} />
                  <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="flex-1 font-medium text-foreground">{friend.username}</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card p-4">
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="w-full"
        >
          {creating ? 'Criando...' : `Criar Grupo${selectedIds.length > 0 ? ` (${selectedIds.length} membro${selectedIds.length !== 1 ? 's' : ''})` : ''}`}
        </Button>
      </div>
    </div>
  )
}
