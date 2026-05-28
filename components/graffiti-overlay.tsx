'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { usePlusMode } from '@/hooks/use-plus-mode'

const PHRASES = [
  'VIBRANTE',
  'A VIDA É UMA FESTA',
  'CHEGA+',
  'VIVA AGORA',
  'RESPIRA',
  'TUDO PASSA',
  'ALEGRIA',
  'SEM MEDO',
  'O AGORA É ETERNO',
  'SEJA LUZ',
  'CAOS CRIATIVO',
  'ENERGIA',
  'SENTIR',
  'MOMENTO ÚNICO',
  'LIBERDADE',
  'TUDO É RITMO',
  'PAIXÃO',
  'RESISTA',
  'FAÇA ACONTECER',
  'TÔ DE BOA',
  'SIGA O FLUXO',
]

const PLACEMENTS = [
  { top: '2%', left: '3%', rotate: -12 },
  { top: '5%', right: '10%', rotate: 8 },
  { top: '12%', left: '55%', rotate: -5 },
  { top: '18%', left: '35%', rotate: 15 },
  { top: '25%', right: '8%', rotate: -8 },
  { top: '35%', left: '12%', rotate: 3 },
  { top: '42%', left: '60%', rotate: -14 },
  { top: '50%', right: '5%', rotate: 11 },
  { top: '58%', left: '8%', rotate: -7 },
  { top: '65%', left: '70%', rotate: 6 },
  { top: '72%', left: '30%', rotate: -10 },
  { top: '78%', left: '50%', rotate: 9 },
  { top: '85%', right: '15%', rotate: -4 },
  { top: '92%', left: '15%', rotate: 13 },
  { top: '98%', left: '40%', rotate: -6 },
  { top: '110%', left: '25%', rotate: -11 },
  { top: '120%', left: '60%', rotate: 5 },
  { top: '130%', left: '10%', rotate: -9 },
  { top: '140%', left: '45%', rotate: 7 },
  { top: '150%', left: '70%', rotate: -13 },
  { top: '160%', left: '20%', rotate: 4 },
  { top: '170%', left: '55%', rotate: -15 },
  { top: '180%', left: '5%', rotate: 10 },
  { top: '190%', left: '65%', rotate: -3 },
  { top: '200%', left: '35%', rotate: 8 },
]

function hashCode(s: string) {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + c
    hash |= 0
  }
  return Math.abs(hash)
}

export function GraffitiOverlay() {
  const { isPlusMode } = usePlusMode()
  const pathname = usePathname()

  const items = useMemo(() => {
    const pathSeed = hashCode(pathname)
    return PHRASES.map((phrase, i) => {
      const idx = (i + pathSeed) % PLACEMENTS.length
      const p = PLACEMENTS[idx]
      const seed = hashCode(phrase + pathname) % 100
      const opacity = 0.2 + (seed / 100) * 0.25
      const size = 0.7 + (seed / 100) * 0.6
      const delay = (seed % 5) * 0.3
      return { phrase, placement: p, opacity, size, delay }
    })
  }, [pathname])

  if (!isPlusMode) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {items.map(({ phrase, placement, opacity, size, delay }) => (
        <div
          key={phrase}
          className="absolute"
          style={{
            top: placement.top,
            left: (placement as any).left,
            right: (placement as any).right,
            transform: `rotate(${placement.rotate}deg)`,
          }}
        >
          <span
            className="block whitespace-nowrap leading-none select-none"
            style={{
              fontFamily: "'Gochi Hand', cursive",
              fontSize: `${1.25 * size}rem`,
              color: '#00ffff',
              textShadow: '3px 3px 0 #74279e, -1px -1px 0 #74279e',
              opacity,
              animation: `graffitiFadeIn 0.5s ease-out ${delay}s both`,
              lineHeight: 1,
            }}
          >
            {phrase}
          </span>
        </div>
      ))}
    </div>
  )
}
