'use client'

import Link from 'next/link'
import { Bell, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AppHeaderProps {
  title?: string
  showNotifications?: boolean
  showSettings?: boolean
}

export function AppHeader({ 
  title = 'Chega+', 
  showNotifications = true,
  showSettings = true 
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">C+</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </Link>

        <div className="flex items-center gap-1">
          {showNotifications && (
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              </Link>
            </Button>
          )}
          {showSettings && (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
