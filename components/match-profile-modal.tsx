'use client'

import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import type { MatchProfile } from '@/lib/types'

interface MatchProfileModalProps {
  profile: MatchProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MatchProfileModal({ profile, open, onOpenChange }: MatchProfileModalProps) {
  const router = useRouter()

  if (!profile) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-28 w-28">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-3xl">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <h3 className="text-xl font-bold text-foreground">
            {profile.username}
          </h3>

          {profile.bio && (
            <p className="text-sm text-muted-foreground max-w-xs whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {profile.common_events > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-brand-500">
              <Calendar className="h-4 w-4" />
              <span>{profile.common_events} evento{profile.common_events !== 1 ? 's' : ''} em comum</span>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => { onOpenChange(false); router.push(`/chat/${profile.id}`) }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar mensagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
