'use client'

import { ReactNode } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { AppHeader } from '@/components/app-header'

interface AppShellProps {
  children: ReactNode
  title?: string
  showHeader?: boolean
  showNav?: boolean
  showNotifications?: boolean
  showSettings?: boolean
}

export function AppShell({ 
  children, 
  title,
  showHeader = true,
  showNav = true,
  showNotifications = true,
  showSettings = true
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {showHeader && (
        <AppHeader 
          title={title} 
          showNotifications={showNotifications}
          showSettings={showSettings}
        />
      )}
      <main className="mx-auto w-full max-w-lg md:max-w-4xl lg:max-w-6xl flex-1 px-4 pb-20 md:pb-12 pt-4 md:pt-6">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
