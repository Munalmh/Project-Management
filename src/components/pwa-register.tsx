'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silently ignore — the app works fine without it, this only
        // enables installability and the offline fallback page.
      })
    }
  }, [])

  return null
}
