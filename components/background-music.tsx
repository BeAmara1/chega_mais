'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function BackgroundMusic() {
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const start = useCallback(() => {
    if (started) return
    setStarted(true)

    const el = new Audio('/musica-landing.mp3')
    el.loop = true
    el.volume = 0
    audioRef.current = el
    el.play().then(() => {
      setPlaying(true)
      let vol = 0
      const fade = setInterval(() => {
        vol = Math.min(vol + 0.04, 1)
        el.volume = vol
        if (vol >= 1) clearInterval(fade)
      }, 100)
    }).catch(() => {})
  }, [started])

  useEffect(() => {
    const events = ['scroll', 'click', 'touchstart', 'keydown'] as const
    const handler = () => { if (!started) start() }
    events.forEach((e) => window.addEventListener(e, handler, { once: false }))
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      audioRef.current?.pause()
    }
  }, [start, started])

  const toggle = () => {
    if (!started) { start(); return }
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  return (
    <button
      onClick={toggle}
      title={playing ? 'Parar música' : 'Ouvir música'}
      className="fixed bottom-24 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20 transition-all"
    >
      {playing ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="5" y2="19" /><line x1="12" y1="12" x2="12" y2="19" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )}
    </button>
  )
}
