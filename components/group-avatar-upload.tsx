'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface GroupAvatarUploadProps {
  groupId: string
  currentUrl: string | null
  groupName: string
  onUploaded: (url: string) => void
}

export function GroupAvatarUpload({ groupId, currentUrl, groupName, onUploaded }: GroupAvatarUploadProps) {
  const supabase = useRef(createClient()).current
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !supabase) return

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida (PNG, JPG, GIF ou WebP)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB')
      return
    }

    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${groupId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('group-avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError.message)
      setPreview(null)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('group-avatars')
      .getPublicUrl(path)

    const publicUrl = urlData?.publicUrl
    if (publicUrl) {
      await supabase
        .from('groups')
        .update({ avatar_url: publicUrl })
        .eq('id', groupId)
      onUploaded(publicUrl)
    }
    setUploading(false)
  }

  const handleRemove = async () => {
    if (!supabase) return
    await supabase.from('groups').update({ avatar_url: null }).eq('id', groupId)
    setPreview(null)
    onUploaded('')
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-16 w-16">
          <AvatarImage src={preview || currentUrl || undefined} />
          <AvatarFallback className="text-lg">{groupName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Camera className="h-4 w-4 mr-1" />
          {uploading ? 'Enviando...' : 'Alterar foto'}
        </Button>
        {(preview || currentUrl) && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove} className="text-destructive block">
            <X className="h-3 w-3 mr-1 inline" />
            Remover
          </Button>
        )}
      </div>
    </div>
  )
}
