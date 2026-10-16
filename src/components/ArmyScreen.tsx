import type { Dispatch } from 'react'
import { formatNum, keepHp, keepLoot, soulsPerMinute, UNITS, unitCost, unitRate, unitUnlocked, UPGRADES, upgradeVisible } from '../game/idle'
import { siegeLocked, type Action } from '../game/reducer'
import { sfx } from '../game/sound'
import type { GameState } from '../game/types'
import { SiegeScene } from './Siege'
import { UnitSprite } from './Sprites'

export function ArmyScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const { idle } = state
  const locked = siegeLocked(state)
  const loot = keepLoot(idle, idle.keepLevel)
  const upgrades = UPGRADES.filter((u) => !idle.upgrades.includes(u.id) && upgradeVisible(idle, u))
  const owned = UPGRADES.filter((u) => idle.upgrades.includes(u.id))
  const buy = (action: Action) => {
    if (state.settings.sound) sfx.buy()
    dispatch(action)
  }

  return (
    <div className="army-layout">
      <section className="panel army-scene">
        <h2 className="panel-title">The Siege</h2>
        <p className="hint">
          Your army raids demon keeps <b>only while you study</b>. Souls and keep loot are delivered when you win a quest; fleeing forfeits them.
        </p>
        <SiegeScene idle={idle} active={false} />
        <dl className="stat-table siege-stats">
          <dt>Keep HP</dt>
          <dd>
            {formatNum(keepHp(idle.keepLevel) - idle.keepDamage)} / {formatNum(keepHp(idle.keepLevel))}
          </dd>
          <dt>Keep loot</dt>
          <dd>
            <span className="gold">{loot.gold} G</span> · <span className="xp">{loot.xp} XP</span>
          </dd>
          <dt>Keeps razed</dt>
          <dd>{idle.keepLevel - 1}</dd>
          <dt>Souls per study min</dt>
          <dd>{formatNum(soulsPerMinute(idle))}</dd>
          <dt>Total souls</dt>
          <dd>{formatNum(idle.totalSouls)}</dd>
        </dl>
      </section>

      <section className="panel">
        <h2 className="panel-title">Recruit</h2>
        {locked && <p className="msg">The quartermaster is at the front. Recruit between quests.</p>}
        <ul className="shop-list">
          {UNITS.map((u, i) => {
            const count = idle.units[u.id] ?? 0
            if (!unitUnlocked(idle, i)) {
              return (
                <li key={u.id} className="shop-item locked">
                  <span className="unit-icon">?</span>
                  <div className="shop-info">
                    <span className="item-name">???</span>
                    <span className="item-desc">Recruit a {UNITS[i - 1].name} to reveal.</span>
                  </div>
                </li>
              )
            }
            const cost = unitCost(u, count)
            return (
              <li key={u.id} className="shop-item">
                <span className="unit-icon">
                  <UnitSprite unit={u.id} scale={3} />
                </span>
                <div className="shop-info">
                  <span className="item-name">
                    {u.name} <span className="muted">×{count}</span>
                  </span>
                  <span className="item-desc">{u.description}</span>
                  <span className="item-bonus">+{formatNum(unitRate(idle, u))} souls/min each</span>
                </div>
                <span className="price soul-price">◆ {formatNum(cost)}</span>
                <button className="btn btn-small" disabled={locked || idle.souls < cost} onClick={() => buy({ type: 'recruit', unitId: u.id })}>
                  Recruit
                </button>
              </li>
            )
          })}
        </ul>

        <h2 className="panel-title">War Council</h2>
        {upgrades.length === 0 && <p className="hint">Grow your army and raze keeps to unlock upgrades.</p>}
        <ul className="shop-list">
          {upgrades.map((u) => (
            <li key={u.id} className="shop-item">
              <span className="unit-icon">✦</span>
              <div className="shop-info">
                <span className="item-name">{u.name}</span>
                <span className="item-bonus">{u.description}</span>
              </div>
              <span className="price soul-price">◆ {formatNum(u.cost)}</span>
              <button className="btn btn-small" disabled={locked || idle.souls < u.cost} onClick={() => buy({ type: 'buyUpgrade', upgradeId: u.id })}>
                Buy
              </button>
            </li>
          ))}
        </ul>
        {owned.length > 0 && <p className="hint">Owned: {owned.map((u) => u.name).join(', ')}</p>}
      </section>
    </div>
  )
}
