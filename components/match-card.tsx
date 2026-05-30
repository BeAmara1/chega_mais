'use client'

import { useState } from 'react'
import TinderCard from 'react-tinder-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar } from 'lucide-react'
import type { MatchProfile } from '@/lib/types'

interface MatchCardProps {
  profile: MatchProfile
  onSwipe: (direction: 'left' | 'right') => void
  onTap: () => void
}

export function MatchCard({ profile, onSwipe, onTap }: MatchCardProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleSwipe = (direction: string) => {
    if (direction === 'left') onSwipe('left')
    else if (direction === 'right') onSwipe('right')
  }

  return (
    <TinderCard
      onSwipe={handleSwipe}
      onCardLeftScreen={handleSwipe}
      preventSwipe={['up', 'down']}
      className="absolute inset-0"
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl cursor-grab active:cursor-grabbing select-none"
        onClick={(e) => { if (Math.abs(offset.x) < 10 && Math.abs(offset.y) < 10) onTap() }}
      >
        <div className="h-[68%] w-full overflow-hidden bg-muted">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="h-full w-full object-cover pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-6xl font-bold text-muted-foreground/30">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            {profile.username}
          </h3>

          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {profile.bio}
            </p>
          )}

          {profile.common_events > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-brand-500">
              <Calendar className="h-4 w-4" />
              <span>{profile.common_events} evento{profile.common_events !== 1 ? 's' : ''} em comum</span>
            </div>
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2 transition-all duration-150"
          style={{
            borderColor: offset.x > 20 ? 'rgb(34 197 94)' : offset.x < -20 ? 'rgb(239 68 68)' : 'transparent',
            opacity: Math.min(Math.abs(offset.x) / 100, 1),
          }}
        />
      </div>
    </TinderCard>
  )
}
