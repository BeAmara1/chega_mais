'use client'

import { cn } from '@/lib/utils'

interface MatchFilterProps {
  value: 'all' | 'events'
  onChange: (value: 'all' | 'events') => void
}

export function MatchFilter({ value, onChange }: MatchFilterProps) {
  return (
    <div className="flex rounded-lg bg-muted p-1">
      <button
        onClick={() => onChange('all')}
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'all'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Todos
      </button>
      <button
        onClick={() => onChange('events')}
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'events'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Nos meus eventos
      </button>
    </div>
  )
}
