import { useEffect, useRef, type Dispatch } from 'react'
import { formatMinutes, percent, streakBonus, titleFor } from '../game/logic'
import type { Action } from '../game/reducer'
import { sfx } from '../game/sound'
import type { RewardEvent } from '../game/types'
import { CoinIcon, XpIcon } from './Sprites'

export function RewardModal({ reward, sound, dispatch }: { reward: RewardEvent; sound: boolean; dispatch: Dispatch<Action> }) {
  const leveled = reward.toLevel > reward.fromLevel
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    button.current?.focus()
    if (!leveled || !sound) return
    const id = setTimeout(sfx.levelUp, 1200)
    return () => clearTimeout(id)
  }, [leveled, sound])

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reward-title">
      <div className="panel modal">
        <h2 id="reward-title" className="victory">
          Victory!
        </h2>
        <p>
          You defeated the <b>{reward.subjectName} Bat</b> after {formatMinutes(reward.minutes)} of study.
        </p>
        <ul className="loot">
          <li>
            <XpIcon scale={4} /> <span className="xp">+{reward.xp} XP</span>
          </li>
          <li>
            <CoinIcon scale={4} /> <span className="gold">+{reward.gold} Gold</span>
          </li>
          {reward.streak > 1 && (
            <li className="muted">
              {reward.streak}-day streak · +{percent(streakBonus(reward.streak))} XP
            </li>
          )}
        </ul>
        {leveled && (
          <div className="level-up">
            <div className="blink">LEVEL UP!</div>
            <div>
              LV {reward.fromLevel} → LV {reward.toLevel} · {titleFor(reward.toLevel)}
            </div>
            <div className="gold">+{reward.levelBonusGold} bonus gold</div>
          </div>
        )}
        <button ref={button} className="btn btn-primary" onClick={() => dispatch({ type: 'dismissReward' })}>
          Continue
        </button>
      </div>
    </div>
  )
}
