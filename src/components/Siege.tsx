import { formatNum, keepHp, keepName, soulsPerMinute, UNITS } from '../game/idle'
import type { IdleState, SiegeLoot } from '../game/types'
import { KeepSprite, SoulIcon, UnitSprite } from './Sprites'

const MAX_PER_TYPE = 3
const SHOT_KIND: Record<string, string> = { archer: 'arrow', mage: 'fireball', dragon: 'fireball', golem: 'boulder' }

interface Props {
  /** Siege state to draw (already advanced by the current quest when live) */
  idle: IdleState
  /** Loot gathered so far this quest, if a quest is in progress */
  pending?: SiegeLoot
  /** Souls you actually own right now (not counting this quest's pending souls) */
  banked: number
  active: boolean
}

export function SiegeScene({ idle, pending, active, banked }: Props) {
  const hp = keepHp(idle.keepLevel)
  const hpLeft = Math.max(0, 1 - idle.keepDamage / hp)
  const troops = UNITS.filter((u) => (idle.units[u.id] ?? 0) > 0)
  const shots = troops.map((u) => SHOT_KIND[u.id] ?? 'spear')
  const rate = soulsPerMinute(idle)

  return (
    <div className={`siege ${active ? 'raiding' : ''}`}>
      <div className="siege-army">
        {troops.map((u) => {
          const count = idle.units[u.id]
          return (
            <div key={u.id} className={`squad squad-${u.id}`} title={`${count} × ${u.name}`}>
              {Array.from({ length: Math.min(count, MAX_PER_TYPE) }, (_, i) => (
                <UnitSprite key={i} unit={u.id} scale={4} className="trooper" />
              ))}
              {count > MAX_PER_TYPE && <span className="squad-count">×{formatNum(count)}</span>}
            </div>
          )
        })}
      </div>

      {active && (
        <div className="shots" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`shot shot-${shots[i % shots.length]}`} style={{ animationDelay: `${i * 0.37}s`, top: `${30 + ((i * 17) % 40)}%` }} />
          ))}
        </div>
      )}

      <div className="siege-keep">
        <div className="keep-name">
          LV {idle.keepLevel} {keepName(idle.keepLevel)}
        </div>
        <div className="bar bar-keep">
          <div className="bar-fill" style={{ width: `${hpLeft * 100}%` }} />
        </div>
        <div className="keep-body" key={idle.keepLevel}>
          <KeepSprite level={idle.keepLevel} className={`keep ${active ? 'under-fire' : ''}`} />
          {hpLeft < 0.5 && <span className="keep-fire f1" />}
          {hpLeft < 0.25 && <span className="keep-fire f2" />}
        </div>
      </div>

      <div className="siege-footer">
        <span>
          <SoulIcon /> {formatNum(banked)} souls
        </span>
        <span className="muted">{formatNum(rate)}/min while studying</span>
        {pending && (
          <span className="pending">
            +{formatNum(pending.souls)} pending (paid on victory){pending.keeps > 0 && ` · ${pending.keeps} keep${pending.keeps > 1 ? 's' : ''} razed!`}
          </span>
        )}
        {!active && !pending && <span className="muted">Your army waits for you to study…</span>}
      </div>
    </div>
  )
}
