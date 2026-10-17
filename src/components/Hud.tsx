import { formatNum } from '../game/idle'
import { liveStreak, streakBonus, titleFor, xpToNext, percent } from '../game/logic'
import type { SkyState } from '../game/sky'
import type { GameState } from '../game/types'
import { SkyDial } from './Sky'
import { CoinIcon, FlameIcon, SoulIcon, XpIcon } from './Sprites'

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
