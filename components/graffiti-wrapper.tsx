'use client'

import dynamic from 'next/dynamic'

const GraffitiOverlay = dynamic(() => import('@/components/graffiti-overlay'), { ssr: false })

export default function GraffitiWrapper() {
  return <GraffitiOverlay />
}
