'use client'

import { useRef, useState, useCallback } from 'react'
import { Calendar } from 'lucide-react'
import type { MatchProfile } from '@/lib/types'

const SWIPE_THRESHOLD = 100

interface MatchCardProps {
  profile: MatchProfile
  onSwipe: (direction: 'left' | 'right') => void
  onTap: () => void
}

export function MatchCard({ profile, onSwipe, onTap }: MatchCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startX: 0, currentX: 0, isDragging: false })
  const [translateX, setTranslateX] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current.startX = e.clientX
    dragRef.current.currentX = e.clientX
    dragRef.current.isDragging = true
    setIsAnimating(false)
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId)
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return
    dragRef.current.currentX = e.clientX
    const dx = dragRef.current.currentX - dragRef.current.startX
    setTranslateX(dx)
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return
    dragRef.current.isDragging = false

    const dx = dragRef.current.currentX - dragRef.current.startX
    const absDx = Math.abs(dx)

    if (absDx > SWIPE_THRESHOLD) {
      const direction = dx > 0 ? 'right' : 'left'
      setTranslateX(dx > 0 ? window.innerWidth : -window.innerWidth)
      setIsAnimating(true)
      setTimeout(() => onSwipe(direction), 300)
    } else {
      setTranslateX(0)
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }, [onSwipe])

  const handleClick = useCallback(() => {
    const dx = Math.abs(dragRef.current.currentX - dragRef.current.startX)
    if (dx < 5) onTap()
  }, [onTap])

  const rotation = translateX * 0.05
  const opacity = Math.min(Math.abs(translateX) / SWIPE_THRESHOLD, 0.5)

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        style={{
          transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
          transition: isAnimating ? 'transform 0.3s ease' : 'none',
        }}
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

        {translateX > 0 && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-l from-transparent to-green-500/20"
            style={{ opacity }}
          />
        )}
        {translateX < 0 && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent to-red-500/20"
            style={{ opacity }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-2"
          style={{
            borderColor: translateX > 0 ? 'rgb(34 197 94)' : translateX < 0 ? 'rgb(239 68 68)' : 'transparent',
            opacity,
          }}
        />

        {translateX > SWIPE_THRESHOLD / 2 && (
          <div className="pointer-events-none absolute top-8 left-6 -rotate-12 rounded-lg border-2 border-green-500 px-3 py-1">
            <span className="text-lg font-bold text-green-500">CURTIR</span>
          </div>
        )}
        {translateX < -SWIPE_THRESHOLD / 2 && (
          <div className="pointer-events-none absolute top-8 right-6 rotate-12 rounded-lg border-2 border-red-500 px-3 py-1">
            <span className="text-lg font-bold text-red-500">DISPENSAR</span>
          </div>
        )}
      </div>
    </div>
  )
}
