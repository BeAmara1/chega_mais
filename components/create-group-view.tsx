'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Search, X, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CreateGroupViewProps {
  userId: string
  friends: { id: string; username: string; avatar_url: string | null }[]
  onBack: () => void
  onCreated: (groupId: string) => void
}

export function CreateGroupView({ userId, friends, onBack, onCreated }: CreateGroupViewProps) {
  const supabase = useRef(createClient()).current
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleMember = (id: string) => {
    if (creating) return
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase()) && !selectedIds.includes(f.id)
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Selecione uma imagem valida'); return }
    if (file.size > 2 * 1024 * 1024) { setError('A imagem deve ter no maximo 2MB'); return }
    setError(null)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCreate = async () => {
    if (!name.trim() || !supabase) return
    setError(null)
    setCreating(true)

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: name.trim(), description: description.trim() || null, type: 'private', created_by: userId })
      .select('id')
      .single()
    if (groupError || !group) {
      console.error('Erro ao criar grupo:', groupError)
      setError(groupError?.message || 'Erro ao criar grupo')
      setCreating(false)
      return
    }

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${group.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('group-avatars')
        .upload(path, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('group-avatars')
          .getPublicUrl(path)
        if (urlData?.publicUrl) {
          const { error: updateError } = await supabase.from('groups').update({ avatar_url: urlData.publicUrl }).eq('id', group.id)
          if (updateError) console.error('Erro ao atualizar avatar do grupo:', updateError)
        }
      } else {
        console.error('Erro ao fazer upload do avatar:', uploadError)
      }
    }

    const { error: membersError } = await supabase.from('group_members').insert([
      { group_id: group.id, user_id: userId, role: 'admin' },
      ...selectedIds.map(id => ({ group_id: group.id, user_id: id, role: 'member' as const })),
    ])
    if (membersError) {
      console.error('Erro ao adicionar membros:', membersError)
      setError(membersError.message || 'Erro ao adicionar membros')
      setCreating(false)
      return
    }

    setCreating(false)
    onCreated(group.id)
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="text-lg font-semibold">Criar Grupo</h2>
      </header>

      {error && (
        <div className="mx-4 mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-lg">{name.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={handleFileSelect} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4 mr-1" />
              {avatarPreview ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            {avatarPreview && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setAvatarPreview(null); setAvatarFile(null) }} className="text-destructive block">
                <X className="h-3 w-3 mr-1 inline" />Remover
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do grupo</label>
          <Input placeholder="Ex: Festa de Sexta" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Descricao (opcional)</label>
          <Input placeholder="O que o grupo vai discutir?" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Adicionar membros</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar amigos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {friends.filter(f => selectedIds.includes(f.id)).map(f => (
              <div key={f.id} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm">
                <span>{f.username}</span>
                <button onClick={() => toggleMember(f.id)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="max-h-[250px] overflow-y-auto space-y-1">
          {filteredFriends.map(f => (
            <button key={f.id} onClick={() => toggleMember(f.id)}
              className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors text-left">
              <Avatar className="h-9 w-9">
                <AvatarImage src={f.avatar_url || undefined} />
                <AvatarFallback>{f.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm font-medium text-foreground">{f.username}</span>
            </button>
          ))}
          {filteredFriends.length === 0 && search && (
            <p className="text-center text-sm text-muted-foreground py-4">Nenhum amigo encontrado</p>
          )}
        </div>
      </div>

      <div className="border-t border-border p-4">
        <Button onClick={handleCreate} disabled={!name.trim() || creating} className="w-full">
          {creating ? 'Criando...' : `Criar Grupo${selectedIds.length > 0 ? ` (${selectedIds.length} membro${selectedIds.length !== 1 ? 's' : ''})` : ''}`}
        </Button>
      </div>
    </div>
  )
}
