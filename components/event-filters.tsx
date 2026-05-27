'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface EventFiltersProps {
  onSearch: (query: string) => void
}

export function EventFilters({ onSearch }: EventFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar eventos..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
          onClick={() => handleSearch('')}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
