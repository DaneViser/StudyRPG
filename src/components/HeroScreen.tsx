import type { Dispatch } from 'react'
import { ITEM_BY_ID, ITEMS, SLOT_LABEL } from '../game/data'
import { bonusText, gearBonuses, heroBonuses, liveStreak, percent, streakBonus, titleFor, xpToNext } from '../game/logic'
import type { Action } from '../game/reducer'
import type { GameState, Slot } from '../game/types'
import { HeroSprite } from './Sprites'

export function HeroScreen({ state, dispatch, now }: { state: GameState; dispatch: Dispatch<Action>; now: number }) {
  const { hero, equipped } = state
  const gear = heroBonuses(state)
  const streak = liveStreak(state.streak, now)
  const totalMinutes = state.subjects.reduce((sum, s) => sum + s.minutes, 0)
  const owned = ITEMS.filter((i) => state.inventory.includes(i.id))

  return (
    <div className="hero-layout">
      <section className="panel hero-card">
        <h2 className="panel-title">Status</h2>
        <div className="hero-portrait">
          <HeroSprite equipped={equipped} scale={9} className="hero-sprite" />
        </div>
        <div className="hero-name-big">{hero.name}</div>
        <div className="hero-title">{titleFor(hero.level)}</div>
        <dl className="stat-table">
          <dt>Level</dt>
          <dd>{hero.level}</dd>
          <dt>Next level</dt>
          <dd>{xpToNext(hero.level) - hero.xp} XP</dd>
          <dt>Total XP</dt>
          <dd>{hero.totalXp}</dd>
          <dt>Quests won</dt>
          <dd>{state.history.length}</dd>
          <dt>Time studied</dt>
          <dd>{Math.round(totalMinutes)} min</dd>
          <dt>XP bonus</dt>
          <dd className="xp">+{percent(gear.xp + streakBonus(streak))}</dd>
          <dt>Gold bonus</dt>
          <dd className="gold">+{percent(gear.gold)}</dd>
          <dt>Siege bonus (gear)</dt>
          <dd className="soul">+{percent(gearBonuses(equipped).siege)}</dd>
        </dl>
      </section>

      <section className="panel">
        <h2 className="panel-title">Equipment</h2>
        <ul className="slots">
          {(Object.keys(SLOT_LABEL) as Slot[]).map((slot) => {
            const item = equipped[slot] ? ITEM_BY_ID[equipped[slot]] : undefined
            return (
              <li key={slot} className="slot">
                <span className="slot-label">{SLOT_LABEL[slot]}</span>
                {item ? (
                  <>
                    <span className="item-name" style={{ color: item.color }}>
                      {item.name}
                    </span>
                    <span className="item-bonus">{bonusText(item)}</span>
                    <button className="btn btn-small" onClick={() => dispatch({ type: 'unequip', slot })}>
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="empty">— empty —</span>
                )}
              </li>
            )
          })}
        </ul>

        <h2 className="panel-title">Inventory</h2>
        {owned.length === 0 ? (
          <p className="hint">Your bag is empty. Visit the shop to spend your gold.</p>
        ) : (
          <ul className="inventory">
            {owned.map((item) => {
              const on = equipped[item.slot] === item.id
              return (
                <li key={item.id} className={`inv-item ${on ? 'equipped' : ''}`}>
                  <span className="swatch" style={{ background: item.color }} />
                  <span className="item-name">{item.name}</span>
                  <span className="item-bonus">{bonusText(item)}</span>
                  <button className="btn btn-small" disabled={on} onClick={() => dispatch({ type: 'equip', itemId: item.id })}>
                    {on ? 'Equipped' : 'Equip'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="hint coming-soon">✦ Skill tree: sealed behind a mysterious door… (coming soon)</p>
      </section>
    </div>
  )
}
