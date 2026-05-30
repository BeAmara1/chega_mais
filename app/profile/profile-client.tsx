'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Settings, LogOut, Calendar, Users, MapPin, Loader2, Camera, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AvatarCropDialog } from '@/components/avatar-crop-dialog'
import type { Profile } from '@/lib/types'

interface ProfileClientProps {
  profile: Profile | null
  events: { id: string; title: string; date: string; image_url: string | null; location: string | null }[]
  likedEvents: { id: string; title: string; date: string; image_url: string | null; location: string | null }[]
  friendsCount: number
  eventsCount: number
  userEmail: string
  isPremium?: boolean
}

export function ProfileClient({
  profile,
  events,
  likedEvents: initialLikedEvents,
  friendsCount,
  eventsCount,
  userEmail,
  isPremium = false,
}: ProfileClientProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [isUploading, setIsUploading] = useState(false)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState<string>('')
  const [likedEvents, setLikedEvents] = useState(initialLikedEvents)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    if (!supabase) {
      setIsLoggingOut(false)
      return
    }
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas imagens (png, jpg, gif, webp)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCropImageUrl(reader.result as string)
      setIsCropOpen(true)
    }
    reader.readAsDataURL(file)

    e.target.value = ''
  }

  const handleCropComplete = async (blob: Blob) => {
    if (!profile) return

    setIsUploading(true)
    const supabase = createClient()

    const filePath = `${profile.id}/${Date.now()}.webp`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, { upsert: true })

    if (uploadError) {
      alert('Erro ao fazer upload da imagem')
      setIsUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id)

    setIsUploading(false)
    setCropImageUrl('')
    router.refresh()
  }

  const handleUnlike = async (eventId: string) => {
    const supabase = createClient()
    if (!supabase) return

    await supabase
      .from('event_likes')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', profile?.id)

    setLikedEvents(likedEvents.filter(e => e.id !== eventId))
  }

  const handleSaveProfile = async () => {
    if (!username.trim()) return
    
    setIsSaving(true)
    const supabase = createClient()
    if (!supabase) {
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        bio: bio.trim() || null,
      })
      .eq('id', profile?.id)

    if (!error) {
      setIsEditOpen(false)
      router.refresh()
    }

    setIsSaving(false)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Data a definir'
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        timeZone: 'America/Sao_Paulo',
      })
    }
    return dateString
  }

  return (
    <AppShell title="Perfil" showSettings>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.username.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <AvatarCropDialog
              open={isCropOpen}
              onOpenChange={setIsCropOpen}
              imageUrl={cropImageUrl}
              onCropComplete={handleCropComplete}
            />
          </div>

          <h2 className="mt-4 text-xl font-bold text-foreground flex items-center gap-2">
            @{profile?.username || 'usuario'}
            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD166] px-2 py-0.5 text-xs font-bold text-[#7A3800]">
                <Sparkles className="h-3 w-3" />
                PREMIUM
              </span>
            )}
          </h2>
          {profile?.bio && (
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{eventsCount}</p>
              <p className="text-xs text-muted-foreground">Eventos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{friendsCount}</p>
              <p className="text-xs text-muted-foreground">Amigos</p>
            </div>
          </div>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4">
                Editar perfil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar perfil</DialogTitle>
                <DialogDescription>
                  Atualize suas informações de perfil
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="seunome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !username.trim()}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Seus próximos eventos</h3>
          
          {events.length === 0 ? (
            <div className="rounded-lg bg-card p-6 text-center">
              <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Você ainda não confirmou presença em nenhum evento
              </p>
              <Button asChild className="mt-4">
                <Link href="/feed">Explorar eventos</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {events.slice(0, 6).map((event) => (
                <Link
                  key={event.id}
                  href={`/event/${event.id}`}
                  className="flex items-center gap-3 rounded-lg bg-card p-3 transition-colors hover:bg-muted"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                    {event.image_url ? (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(event.date)}</span>
                      {event.location && (
                        <>
                          <span>•</span>
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Liked Events */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Eventos curtidos</h3>
          
          {likedEvents.length === 0 ? (
            <div className="rounded-lg bg-card p-6 text-center">
              <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Você ainda não curtiu nenhum evento
              </p>
              <Button asChild className="mt-4">
                <Link href="/feed">Explorar eventos</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {likedEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 rounded-lg bg-card p-3">
                  <Link
                    href={`/event/${event.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                      {event.image_url ? (
                        <Image
                          src={event.image_url}
                          alt={event.title}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{event.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(event.date)}</span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="truncate">{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handleUnlike(event.id)}
                  >
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Conta</h3>
          
          <div className="rounded-lg bg-card">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sair da conta
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
