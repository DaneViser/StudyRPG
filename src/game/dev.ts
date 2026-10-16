// Developer cheats: pure state transforms behind a single `{ type: 'dev' }` action,
// so they reuse the real game rules and stay out of the normal reducer.

import { ITEMS } from './data'
import { keepLoot, RANKS, UNITS, UPGRADES } from './idle'
import { addXp, dayKey } from './logic'
import { grantSession } from './reducer'
import type { GameState } from './types'

export type DevOp =
  | { op: 'grant'; gold?: number; xp?: number; souls?: number }
  | { op: 'setLevel'; level: number }
  /** Moves a running phase's end time earlier by `ms` (used by fast-forward and speed-up) */
  | { op: 'warp'; ms: number }
  /** Ends the current running/paused phase now; the normal completion then fires */
  | { op: 'finishPhase'; now: number }
  /** Instantly wins a study session of `minutes` without touching the timer */
  | { op: 'simulate'; minutes: number; now: number; recordId: string }
  | { op: 'addUnits'; count: number }
  | { op: 'allUpgrades' }
  | { op: 'razeKeeps'; count: number }
  | { op: 'unlockGear' }
  | { op: 'setStreak'; count: number; now: number }

export function devReducer(state: GameState, d: DevOp): GameState {
  const { timer } = state
  switch (d.op) {
    case 'grant': {
      let hero = { ...state.hero, gold: Math.max(0, state.hero.gold + (d.gold ?? 0)) }
      if (d.xp) hero = addXp(hero, d.xp).hero
      const souls = Math.max(0, state.idle.souls + (d.souls ?? 0))
      return {
        ...state,
        hero,
        idle: { ...state.idle, souls, totalSouls: state.idle.totalSouls + Math.max(0, d.souls ?? 0) },
      }
    }

    case 'setLevel': {
      const level = Math.min(99, Math.max(1, Math.round(d.level)))
      return { ...state, hero: { ...state.hero, level, xp: 0 } }
    }

    case 'warp':
      if (timer.status !== 'running' || timer.endsAt === null) return state
      return { ...state, timer: { ...timer, endsAt: timer.endsAt - d.ms } }

    case 'finishPhase':
      if (timer.status === 'idle') return state
      return { ...state, timer: { ...timer, status: 'running', endsAt: d.now } }

    case 'simulate': {
      const subjectId = state.selectedSubjectId ?? state.subjects[0]?.id ?? null
      return grantSession(state, d.minutes, subjectId, d.now, d.recordId)
    }

    case 'addUnits': {
      const units = { ...state.idle.units }
      for (const u of UNITS) units[u.id] = Math.max(0, (units[u.id] ?? 0) + d.count)
      return { ...state, idle: { ...state.idle, units } }
    }

    case 'allUpgrades':
      return {
        ...state,
        idle: { ...state.idle, upgrades: UPGRADES.map((u) => u.id), ranks: Object.fromEntries(RANKS.map((r) => [r.id, r.maxRank])) },
      }

    case 'razeKeeps': {
      let { keepLevel } = state.idle
      let gold = 0
      let xp = 0
      for (let i = 0; i < d.count; i++) {
        const loot = keepLoot(state.idle, keepLevel)
        gold += loot.gold
        xp += loot.xp
        keepLevel += 1
      }
      const hero = addXp({ ...state.hero, gold: state.hero.gold + gold }, xp).hero
      return { ...state, hero, idle: { ...state.idle, keepLevel, keepDamage: 0 } }
    }

    case 'unlockGear':
      return { ...state, inventory: ITEMS.map((i) => i.id) }

    case 'setStreak':
      return { ...state, streak: d.count > 0 ? { count: d.count, lastDay: dayKey(d.now) } : { count: 0, lastDay: null } }
  }
}
