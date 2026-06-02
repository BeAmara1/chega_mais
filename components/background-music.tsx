'use client'

import { useEffect, useRef, useState } from 'react'

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [interacted, setInteracted] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = new Audio('/musica-landing.mp3')
    el.loop = true
    el.volume = 0
    audioRef.current = el

    const start = () => {
      if (interacted) return
      setInteracted(true)
      el.play().catch(() => {})

      let vol = 0
      const fade = setInterval(() => {
        vol = Math.min(vol + 0.04, 1)
        el.volume = vol
        if (vol >= 1) clearInterval(fade)
      }, 100)
    }

    const events = ['scroll', 'click', 'touchstart', 'keydown']
    events.forEach((e) => window.addEventListener(e, start, { once: false }))

    return () => {
      el.pause()
      el.src = ''
      events.forEach((e) => window.removeEventListener(e, start))
    }
  }, [interacted])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
    } else {
      el.play().catch(() => {})
    }
    setPlaying(!playing)
  }

  if (!interacted) return null

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
