import { useEffect, useMemo, useState } from 'react'
import { guessLocation, skyState, type SkyState } from './sky'
import type { Settings } from './types'

/** Today's local time at a given hour (e.g. 6.5 = 06:30), used by the dev sky preview. */
function atHour(now: number, hour: number): number {
  const d = new Date(now)
  d.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0)
  return d.getTime()
}

/** Current sky, refreshed every minute. `previewHour` (dev tools) pins the clock to that hour of today. */
export function useSky(settings: Settings, previewHour: number | null = null): SkyState {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    const at = previewHour === null ? now : atHour(now, previewHour)
    const mode = previewHour === null ? settings.skyMode : 'live'
    return skyState(at, settings.location ?? guessLocation(at), mode)
  }, [now, previewHour, settings.skyMode, settings.location])
}
