'use client'

import dynamic from 'next/dynamic'

const GraffitiOverlay = dynamic(() => import('@/components/graffiti-overlay').then(m => ({ default: m.GraffitiOverlay })), { ssr: false })

export default function GraffitiWrapper() {
  return <GraffitiOverlay />
}
