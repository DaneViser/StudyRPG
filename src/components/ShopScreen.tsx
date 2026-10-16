import { useState, type Dispatch } from 'react'
import { ITEMS, SLOT_LABEL } from '../game/data'
import { bonusText } from '../game/logic'
import type { Action } from '../game/reducer'
import { sfx } from '../game/sound'
import type { GameState, Slot } from '../game/types'
import { CoinIcon } from './Sprites'

export function ShopScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const { hero } = state
  const [slot, setSlot] = useState<Slot>('weapon')
  const items = ITEMS.filter((i) => i.slot === slot)

  return (
    <section className="panel shop">
      <h2 className="panel-title">Merchant</h2>
      <p className="hint">
        "Heh heh… what're ya studyin'?" Weapons boost XP, armor boosts gold, relics boost both. All gear strengthens your siege army. Bought gear is equipped right away.
      </p>
      <div className="shop-tabs" role="tablist">
        {(Object.keys(SLOT_LABEL) as Slot[]).map((s) => (
          <button key={s} role="tab" aria-selected={s === slot} className={`btn btn-small ${s === slot ? 'on' : ''}`} onClick={() => setSlot(s)}>
            {SLOT_LABEL[s]}s
          </button>
        ))}
      </div>
      <ul className="shop-list">
        {items.map((item) => {
          const owned = state.inventory.includes(item.id)
          const locked = hero.level < item.minLevel
          const poor = hero.gold < item.price
          const mythic = item.rarity === 'mythic'
          return (
            <li key={item.id} className={`shop-item ${owned ? 'owned' : ''} ${locked ? 'locked' : ''} ${mythic ? 'mythic' : ''}`}>
              <span className="swatch" style={{ background: locked ? '#333' : item.color }} />
              <div className="shop-info">
                <span className="item-name">
                  {locked ? `??? (LV ${item.minLevel})` : item.name}
                  {mythic && <span className="mythic-tag">MYTHIC</span>}
                </span>
                <span className="item-desc">{locked ? 'Level up to reveal.' : item.description}</span>
                <span className="item-bonus">{bonusText(item)}</span>
              </div>
              <span className="price">
                <CoinIcon /> {item.price.toLocaleString()}
              </span>
              <button
                className="btn btn-small"
                disabled={owned || locked || poor}
                onClick={() => {
                  if (state.settings.sound) sfx.buy()
                  dispatch({ type: 'buy', itemId: item.id })
                }}
              >
                {owned ? 'Owned' : locked ? 'Locked' : poor ? 'Need gold' : 'Buy'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
