'use client'

import { useState, useEffect, useCallback } from 'react'

const PLUS_KEY = 'vibrante_plus'
const PLUS_EVENT = 'plusmodechange'

export function usePlusMode() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(localStorage.getItem(PLUS_KEY) === 'true')
  }, [])

  useEffect(() => {
    const handler = () => setActive(localStorage.getItem(PLUS_KEY) === 'true')
    window.addEventListener(PLUS_EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(PLUS_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const enable = useCallback(() => {
    localStorage.setItem(PLUS_KEY, 'true')
    window.dispatchEvent(new Event(PLUS_EVENT))
    setActive(true)
  }, [])

  const disable = useCallback(() => {
    localStorage.setItem(PLUS_KEY, 'false')
    window.dispatchEvent(new Event(PLUS_EVENT))
    setActive(false)
  }, [])

  return { isPlusMode: active, enablePlusMode: enable, disablePlusMode: disable }
}
