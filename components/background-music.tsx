'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function BackgroundMusic() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startedRef = useRef(false)
  const targetVolRef = useRef(0.5)
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fadeIn = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (fadeRef.current) clearInterval(fadeRef.current)
    el.volume = 0
    const target = targetVolRef.current
    fadeRef.current = setInterval(() => {
      if (!el) return
      const next = Math.min(el.volume + 0.04, target)
      el.volume = next
      if (next >= target && fadeRef.current) {
        clearInterval(fadeRef.current)
        fadeRef.current = null
      }
    }, 100)
  }, [])

  const createAndPlay = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true

    const el = new Audio('/musica-landing.mp3')
    el.loop = true
    el.volume = 0
    audioRef.current = el
    targetVolRef.current = 0.5

    el.play().then(() => {
      setPlaying(true)
      fadeIn()
    }).catch((err) => {
      console.error('Audio play failed:', err)
    })
  }, [fadeIn])

  useEffect(() => {
    const handler = () => createAndPlay()
    const events = ['click', 'touchstart', 'keydown'] as const
    events.forEach((e) => document.addEventListener(e, handler, { once: true }))

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler))
      if (fadeRef.current) clearInterval(fadeRef.current)
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [createAndPlay])

  const toggle = () => {
    if (!startedRef.current) {
      createAndPlay()
      return
    }
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play().then(() => setPlaying(true)).catch((err) => {
        console.error('Audio resume failed:', err)
      })
    }
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    targetVolRef.current = v
    if (audioRef.current && fadeRef.current === null) {
      audioRef.current.volume = v
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-center gap-1">
      {playing && (
        <div className="flex items-center gap-1 px-1 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 shrink-0">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolume}
            className="w-16 h-1 accent-white cursor-pointer appearance-none bg-white/20 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      )}
      <button
        onClick={toggle}
        title={playing ? 'Pausar' : 'Tocar música'}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all"
      >
        {playing ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>
    </div>
  )
}
