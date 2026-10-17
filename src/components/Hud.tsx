import { useEffect, useState } from 'react'
import { formatNum } from '../game/idle'
import { clock24, liveStreak, streakBonus, titleFor, xpToNext, percent } from '../game/logic'
import type { SkyState } from '../game/sky'
import type { GameState } from '../game/types'
import { SkyDial } from './Sky'
import { CoinIcon, FlameIcon, SoulIcon, XpIcon } from './Sprites'

/** 24-hour HH:MM clock that ticks over exactly on each new minute. */
function DigitalClock() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let id = 0
    const schedule = () => {
      id = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50)
    }
    const tick = () => {
      setNow(Date.now())
      schedule()
    }
    // Background tabs throttle timers; resync when the tab becomes visible again
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(id)
        tick()
      }
    }
    schedule()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const [hh, mm] = clock24(now).split(':')
  return (
    <time className="hud-clock" dateTime={new Date(now).toISOString()} title="Local time">
      {hh}
      <span className="clock-colon">:</span>
      {mm}
    </time>
  )
}

export function Hud({ state, now, sky }: { state: GameState; now: number; sky: SkyState }) {
  const { hero } = state
  const need = xpToNext(hero.level)
  const streak = liveStreak(state.streak, now)
  return (
    <header className="hud panel">
      <div className="hud-id">
        <div className="hud-name">{hero.name}</div>
        <div className="hud-title">
          LV {hero.level} · {titleFor(hero.level)}
        </div>
      </div>
      <div className="hud-xp">
        <div className="bar-label">
          <XpIcon /> EXP <span>{hero.xp} / {need}</span>
        </div>
        <div className="bar bar-xp">
          <div className="bar-fill" style={{ width: `${(hero.xp / need) * 100}%` }} />
        </div>
      </div>
      <div className="hud-stats">
        <SkyDial sky={sky} />
        <DigitalClock />
        <span className="stat" title="Gold">
          <CoinIcon /> {hero.gold}
        </span>
        <span className="stat soul-stat" title="Souls: spend them on troops and upgrades in the Army tab">
          <SoulIcon /> {formatNum(state.idle.souls)}
        </span>
        <span className="stat" title={`Daily streak: +${percent(streakBonus(streak))} XP`}>
          <FlameIcon /> {streak}d
        </span>
      </div>
    </header>
  )
}
