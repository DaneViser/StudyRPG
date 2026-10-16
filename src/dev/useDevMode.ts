import { useCallback, useEffect, useState } from 'react'

const PREFS_KEY = 'studyrpg.dev'

interface DevPrefs {
  unlocked: boolean
  /** Game-clock multiplier for running phases */
  speed: number
}

function readPrefs(): DevPrefs {
  const prefs: DevPrefs = { unlocked: false, speed: 1 }
  try {
    Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}'))
  } catch {
    // ignore corrupt prefs
  }
  const param = new URLSearchParams(location.search).get('dev')
  if (param !== null) prefs.unlocked = param !== '0'
  // Local dev server: always available
  if (import.meta.env.DEV) prefs.unlocked = true
  return prefs
}

/**
 * Dev tools are hidden for normal players. They unlock on the local dev server,
 * or on the live site by opening it once with `?dev` (remembered in this browser; `?dev=0` hides them).
 */
export function useDevMode() {
  const [prefs, setPrefs] = useState(readPrefs)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }, [prefs])

  useEffect(() => {
    if (!prefs.unlocked) return
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (e.key === '`' && !typing) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prefs.unlocked])

  const setSpeed = useCallback((speed: number) => setPrefs((p) => ({ ...p, speed })), [])

  const lock = useCallback(() => {
    setPrefs({ unlocked: false, speed: 1 })
    setOpen(false)
    const url = new URL(location.href)
    url.searchParams.delete('dev')
    history.replaceState(null, '', url)
  }, [])

  return {
    unlocked: prefs.unlocked,
    open: prefs.unlocked && open,
    setOpen,
    speed: prefs.unlocked ? prefs.speed : 1,
    setSpeed,
    lock,
    canLock: !import.meta.env.DEV,
  }
}

export type DevMode = ReturnType<typeof useDevMode>
