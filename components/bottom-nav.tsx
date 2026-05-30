'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Heart, MessageCircle, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/feed', icon: Home, label: 'Início' },
  { href: '/friends', icon: Users, label: 'Amigos' },
  { href: '/match', icon: Heart, label: 'Match' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      if (data?.is_premium) setIsPremium(true)
    }
    check()
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const isMatch = item.href === '/match'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-2 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
              <span className="font-medium">{item.label}</span>
              {isMatch && isPremium && (
                <span className="absolute -right-1 -top-0.5 text-[10px] text-[#FFD166] drop-shadow">✦</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
