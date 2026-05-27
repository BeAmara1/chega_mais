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
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-20 pt-4">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}
