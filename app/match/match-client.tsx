'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { X, Heart, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/app-shell'
import { MatchCard } from '@/components/match-card'
import { MatchOverlay } from '@/components/match-overlay'
import { MatchFilter } from '@/components/match-filter'
import { MatchProfileModal } from '@/components/match-profile-modal'
import { handleLike, handlePass, getAvailableProfiles, getAvailableProfilesAtEvents } from '@/lib/match'
import type { MatchProfile } from '@/lib/types'

interface MatchClientProps {
  userId: string
  myAvatar: string | null
  myName: string
  initialProfiles: MatchProfile[]
  initialEventProfiles: MatchProfile[]
}

export function MatchClient({ userId, myAvatar, myName, initialProfiles, initialEventProfiles }: MatchClientProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [filter, setFilter] = useState<'all' | 'events'>('all')
  const [profiles, setProfiles] = useState<MatchProfile[]>(initialProfiles)
  const [eventProfiles, setEventProfiles] = useState<MatchProfile[]>(initialEventProfiles)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [matchOverlay, setMatchOverlay] = useState<{
    targetId: string
    targetName: string
    targetAvatar: string | null
  } | null>(null)
  const [modalProfile, setModalProfile] = useState<MatchProfile | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const allSeenIds = useRef(new Set<string>())

  useEffect(() => {
    initialProfiles.forEach(p => allSeenIds.current.add(p.id))
    initialEventProfiles.forEach(p => allSeenIds.current.add(p.id))
  }, [initialProfiles, initialEventProfiles])

  const currentProfiles = filter === 'all' ? profiles : eventProfiles
  const currentProfile = currentProfiles[currentIndex]

  const fetchMore = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const seen = Array.from(allSeenIds.current)
    if (filter === 'all') {
      const more = await getAvailableProfiles(supabase, userId, [], seen)
      more.forEach(p => allSeenIds.current.add(p.id))
      setProfiles(prev => [...prev, ...more])
    } else {
      const more = await getAvailableProfilesAtEvents(supabase, userId, [], seen)
      more.forEach(p => allSeenIds.current.add(p.id))
      setEventProfiles(prev => [...prev, ...more])
    }
    setLoading(false)
  }, [supabase, userId, filter])

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!supabase || !currentProfile) return

    if (direction === 'right') {
      const result = await handleLike(supabase, userId, currentProfile.id)
      if (result.matched) {
        setMatchOverlay({
          targetId: currentProfile.id,
          targetName: currentProfile.username,
          targetAvatar: currentProfile.avatar_url,
        })
      }
    } else {
      await handlePass(supabase, userId, currentProfile.id)
    }

    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)

    if (nextIndex >= currentProfiles.length - 3) {
      fetchMore()
    }
  }, [supabase, userId, currentProfile, currentIndex, currentProfiles.length, fetchMore])

  const handleFilterChange = (value: 'all' | 'events') => {
    setFilter(value)
    setCurrentIndex(0)
  }

  const handleTapProfile = () => {
    if (currentProfile) {
      setModalProfile(currentProfile)
      setModalOpen(true)
    }
  }

  return (
    <AppShell title="Chega+ Match" showNotifications showSettings>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">Chega+ Match</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD166] px-2 py-0.5 text-xs font-bold text-[#7A3800]">
              <Sparkles className="h-3 w-3" />
              PREMIUM
            </span>
          </div>
          <MatchFilter value={filter} onChange={handleFilterChange} />
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0">
          {currentProfile ? (
            <div className="relative w-full max-w-sm h-[55vh] min-h-[380px]">
              <MatchCard
                key={currentProfile.id}
                profile={currentProfile}
                onSwipe={handleSwipe}
                onTap={handleTapProfile}
              />
            </div>
          ) : loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-lg text-muted-foreground">Nenhum perfil por enquanto</p>
              <p className="text-sm text-muted-foreground">Volte mais tarde para ver novos perfis</p>
            </div>
          )}
        </div>

        {currentProfile && (
          <div className="flex items-center justify-center gap-6 pt-4 pb-2">
            <button
              onClick={() => handleSwipe('left')}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <X className="h-7 w-7" />
            </button>
            <button
              onClick={() => handleSwipe('right')}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-colors"
            >
              <Heart className="h-7 w-7 fill-brand-500" />
            </button>
          </div>
        )}
      </div>

      {matchOverlay && (
        <MatchOverlay
          myAvatar={myAvatar}
          myName={myName}
          targetAvatar={matchOverlay.targetAvatar}
          targetName={matchOverlay.targetName}
          targetId={matchOverlay.targetId}
          onClose={() => setMatchOverlay(null)}
        />
      )}

      <MatchProfileModal
        profile={modalProfile}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </AppShell>
  )
}
