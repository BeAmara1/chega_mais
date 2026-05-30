'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface MatchOverlayProps {
  myAvatar: string | null
  myName: string
  targetAvatar: string | null
  targetName: string
  targetId: string
  onClose: () => void
}

export function MatchOverlay({ myAvatar, myName, targetAvatar, targetName, targetId, onClose }: MatchOverlayProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    color: ['#FF4D6D', '#FF8C42', '#8B5CF6', '#FFD166', '#FF6B6B'][Math.floor(Math.random() * 5)],
    size: 6 + Math.random() * 8,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-brand-500/20 to-background p-8 text-center max-w-sm w-full mx-4">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <div className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Avatar className="h-20 w-20 ring-4 ring-brand-500">
              <AvatarImage src={myAvatar || undefined} />
              <AvatarFallback className="text-2xl">{myName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Heart className="h-8 w-8 text-brand-500 fill-brand-500 animate-pulse" />
            <Avatar className="h-20 w-20 ring-4 ring-brand-500">
              <AvatarImage src={targetAvatar || undefined} />
              <AvatarFallback className="text-2xl">{targetName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">É um Match!</h2>
          <p className="text-muted-foreground mb-6">
            Vocês dois vão aos mesmos eventos — que tal se conhecer?
          </p>

          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={(e) => { e.stopPropagation(); router.push(`/chat/${targetId}`) }}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Enviar mensagem
            </Button>
            <Button variant="ghost" className="w-full" onClick={(e) => { e.stopPropagation(); onClose() }}>
              Continuar vendo perfis
            </Button>
          </div>
        </div>
      </div>

      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )
}
