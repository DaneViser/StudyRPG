// Live sky: sun/moon positions and the day/night phase from the player's local clock.
// Sunrise/sunset need a location; without permission we estimate one from the time zone.

import type { SkyLocation, SkyMode } from './types'

export type SkyPhase = 'night' | 'dawn' | 'day' | 'dusk'

export interface SkyState {
  phase: SkyPhase
  /** 0 at sunrise → 1 at sunset (only meaningful when the sun is up) */
  sunProgress: number
  /** 0 at sunset → 1 at the next sunrise (only meaningful at night) */
  moonProgress: number
  /** Lunar phase: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter */
  moonPhase: number
  sunrise: number | null
  sunset: number | null
}

const DAY_MS = 86_400_000
/** Dawn and dusk last this long on each side of sunrise/sunset */
const TWILIGHT_MS = 40 * 60_000
const SYNODIC_MONTH = 29.530588853
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

const SOUTHERN_TZ =
  /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham|Fiji|Tongatapu|Noumea)|^America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|La_Paz|Lima|Punta_Arenas)|^Africa\/(Johannesburg|Maputo|Harare|Windhoek|Gaborone|Maseru|Mbabane|Lusaka)|^Indian\/(Mauritius|Reunion)/

/**
 * Rough location from the browser's time zone: longitude from the *standard* (non-DST)
 * UTC offset, latitude 45° (or -30° for southern time zones).
 */
export function guessLocation(now: number): SkyLocation {
  const year = new Date(now).getFullYear()
  const standardOffsetMin = -Math.max(new Date(year, 0, 1).getTimezoneOffset(), new Date(year, 6, 1).getTimezoneOffset())
  let tz = ''
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
  } catch {
    // ignore
  }
  return { lat: SOUTHERN_TZ.test(tz) ? -30 : 45, lon: (standardOffsetMin / 60) * 15 }
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** Sunrise/sunset (epoch ms) for the local calendar day containing `now` (NOAA approximation). */
export function sunTimes(now: number, loc: SkyLocation): { sunrise: number; sunset: number } | { polar: 'day' | 'night' } {
  const d = new Date(now)
  const utcMidnight = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const dayOfYear = Math.round((utcMidnight - Date.UTC(d.getFullYear(), 0, 0)) / DAY_MS)
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1)
  const eqTime =
    229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g)
  const lat = rad(loc.lat)
  const cosH = Math.cos(rad(90.833)) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)
  if (cosH > 1) return { polar: 'night' }
  if (cosH < -1) return { polar: 'day' }
  const ha = (Math.acos(cosH) * 180) / Math.PI
  const sunriseMin = 720 - 4 * (loc.lon + ha) - eqTime
  const sunsetMin = 720 - 4 * (loc.lon - ha) - eqTime
  return { sunrise: utcMidnight + sunriseMin * 60_000, sunset: utcMidnight + sunsetMin * 60_000 }
}

export function moonPhase(now: number): number {
  const days = (now - KNOWN_NEW_MOON) / DAY_MS
  return (((days / SYNODIC_MONTH) % 1) + 1) % 1
}

export function moonPhaseName(phase: number): string {
  const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent']
  return names[Math.round(phase * 8) % 8]
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export function skyState(now: number, loc: SkyLocation, mode: SkyMode): SkyState {
  const base = { moonPhase: moonPhase(now), sunrise: null, sunset: null }
  if (mode === 'night') return { ...base, phase: 'night', sunProgress: 0.5, moonProgress: 0.5 }
  if (mode === 'day') return { ...base, phase: 'day', sunProgress: 0.5, moonProgress: 0.5 }

  const today = sunTimes(now, loc)
  if ('polar' in today) return { ...base, phase: today.polar, sunProgress: 0.5, moonProgress: 0.5 }
  const { sunrise, sunset } = today
  const times = { moonPhase: base.moonPhase, sunrise, sunset }
  const sunProgress = clamp01((now - sunrise) / (sunset - sunrise))

  if (now < sunrise - TWILIGHT_MS) {
    const prev = sunTimes(now - DAY_MS, loc)
    const prevSunset = 'polar' in prev ? sunset - DAY_MS : prev.sunset
    return { ...times, phase: 'night', sunProgress: 0, moonProgress: clamp01((now - prevSunset) / (sunrise - prevSunset)) }
  }
  if (now > sunset + TWILIGHT_MS) {
    const next = sunTimes(now + DAY_MS, loc)
    const nextSunrise = 'polar' in next ? sunrise + DAY_MS : next.sunrise
    return { ...times, phase: 'night', sunProgress: 1, moonProgress: clamp01((now - sunset) / (nextSunrise - sunset)) }
  }
  const phase: SkyPhase = now < sunrise + TWILIGHT_MS ? 'dawn' : now > sunset - TWILIGHT_MS ? 'dusk' : 'day'
  return { ...times, phase, sunProgress, moonProgress: 0 }
}
