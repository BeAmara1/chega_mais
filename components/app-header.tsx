'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Users, MessageCircle, User, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SettingsDialog } from '@/components/settings-dialog'
import { NotificationsDialog } from '@/components/notifications-dialog'
import { ChatDialog } from '@/components/chat-dialog'

interface AppHeaderProps {
  title?: string
  showNotifications?: boolean
  showSettings?: boolean
}

const desktopNavItems = [
  { href: '/feed', icon: Home, label: 'Inicio' },
  { href: '/friends', icon: Users, label: 'Amigos' },
  { href: '/match', icon: Heart, label: 'Match' },
  { href: '/profile', icon: User, label: 'Perfil' },
]

export function AppHeader({
  title = 'Chega+',
  showNotifications = true,
  showSettings = true
}: AppHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 md:h-16 max-w-lg md:max-w-4xl lg:max-w-6xl items-center justify-between px-4">
        <Link href="/feed" className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/logo-sem-fundo.png"
            alt="Chega+"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <h1 className="text-xl font-bold text-foreground hidden md:block">{title}</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {desktopNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <ChatDialog />
        </nav>

        <div className="flex items-center gap-1">
          {showNotifications && <NotificationsDialog />}
          {showSettings && <SettingsDialog />}
        </div>
      </div>
    </header>
  )
}
