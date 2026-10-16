import { HISTORY_LIMIT, ITEM_BY_ID } from './data'
import { devReducer, type DevOp } from './dev'
import { createIdleState, RANK_BY_ID, rankCost, simulateIdle, UNITS, unitCost, unitUnlocked, UPGRADE_BY_ID, upgradeVisible } from './idle'
import { addXp, gearBonuses, monsterFor, nextStreak, phaseMinutes, sessionRewards } from './logic'
import type { GameState, Phase, Settings, Slot, TimerState } from './types'

export type Action =
  | { type: 'setName'; name: string }
  | { type: 'addSubject'; id: string; name: string; color: string }
  | { type: 'removeSubject'; id: string }
  | { type: 'selectSubject'; id: string }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'abandon' }
  | { type: 'skipBreak' }
  | { type: 'complete'; now: number; recordId: string }
  | { type: 'buy'; itemId: string }
  | { type: 'recruit'; unitId: string }
  | { type: 'buyUpgrade'; upgradeId: string }
  | { type: 'buyRank'; rankId: string }
  | { type: 'equip'; itemId: string }
  | { type: 'unequip'; slot: Slot }
  | { type: 'dismissReward' }
  | { type: 'load'; state: GameState }
  | { type: 'dev'; dev: DevOp }

function idleTimer(phase: Phase, settings: Settings, focusCount: number): TimerState {
  const ms = phaseMinutes(phase, settings) * 60_000
  return { phase, status: 'idle', endsAt: null, remainingMs: ms, durationMs: ms, subjectId: null, focusCount }
}

/** The army can't be changed mid-quest: the siege is settled using the army you started with. */
export function siegeLocked(state: GameState): boolean {
  return state.timer.phase === 'focus' && state.timer.status !== 'idle'
}

export function createInitialState(): GameState {
  const settings: Settings = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    sound: true,
    notifications: false,
    scanlines: true,
  }
  return {
    version: 1,
    hero: { name: 'Hero', level: 1, xp: 0, totalXp: 0, gold: 0 },
    subjects: [],
    selectedSubjectId: null,
    settings,
    inventory: [],
    equipped: { weapon: null, armor: null, accessory: null },
    history: [],
    streak: { count: 0, lastDay: null },
    timer: idleTimer('focus', settings, 0),
    reward: null,
    idle: createIdleState(),
  }
}

/**
 * Pays out a won study session of `minutes`: hero XP/gold, streak, subject totals,
 * history, siege progress and the Victory dialog. Leaves the timer untouched.
 */
export function grantSession(state: GameState, minutes: number, subjectId: string | null, at: number, recordId: string): GameState {
  const streak = nextStreak(state.streak, at)
  const { xp, gold } = sessionRewards(minutes, state, streak.count)
  const siege = simulateIdle(state.idle, minutes, gearBonuses(state.equipped).siege)
  const leveled = addXp({ ...state.hero, gold: state.hero.gold + gold + siege.loot.gold }, xp + siege.loot.xp)
  const subjectName = state.subjects.find((s) => s.id === subjectId)?.name ?? 'Unknown'

  return {
    ...state,
    hero: leveled.hero,
    streak,
    subjects: state.subjects.map((s) => (s.id === subjectId ? { ...s, minutes: s.minutes + minutes, sessions: s.sessions + 1 } : s)),
    history: [{ id: recordId, subjectId: subjectId ?? '', subjectName, minutes, xp, gold, completedAt: at }, ...state.history].slice(0, HISTORY_LIMIT),
    idle: siege.idle,
    reward: {
      siege: siege.loot,
      monster: monsterFor(minutes).tier.name,
      xp,
      gold,
      levelBonusGold: leveled.levelBonusGold,
      fromLevel: state.hero.level,
      toLevel: leveled.hero.level,
      streak: streak.count,
      subjectName,
      minutes,
    },
  }
}

export function gameReducer(state: GameState, action: Action): GameState {
  const { timer } = state
  switch (action.type) {
    case 'setName':
      return { ...state, hero: { ...state.hero, name: action.name.slice(0, 16) || 'Hero' } }

    case 'addSubject':
      return {
        ...state,
        subjects: [...state.subjects, { id: action.id, name: action.name.slice(0, 24), color: action.color, minutes: 0, sessions: 0 }],
        selectedSubjectId: action.id,
      }

    case 'removeSubject': {
      if (timer.status !== 'idle' && timer.subjectId === action.id) return state
      const subjects = state.subjects.filter((s) => s.id !== action.id)
      const selectedSubjectId = state.selectedSubjectId === action.id ? (subjects[0]?.id ?? null) : state.selectedSubjectId
      return { ...state, subjects, selectedSubjectId }
    }

    case 'selectSubject':
      return { ...state, selectedSubjectId: action.id }

    case 'updateSettings': {
      const settings = { ...state.settings, ...action.patch }
      // Only reshape the timer if it is not mid-phase
      const next = timer.status === 'idle' ? idleTimer(timer.phase, settings, timer.focusCount) : timer
      return { ...state, settings, timer: next }
    }

    case 'start': {
      if (timer.status !== 'idle') return state
      if (timer.phase === 'focus' && !state.selectedSubjectId) return state
      return {
        ...state,
        timer: {
          ...timer,
          status: 'running',
          endsAt: action.now + timer.remainingMs,
          subjectId: timer.phase === 'focus' ? state.selectedSubjectId : null,
        },
      }
    }

    case 'pause':
      if (timer.status !== 'running' || timer.endsAt === null) return state
      return { ...state, timer: { ...timer, status: 'paused', remainingMs: Math.max(0, timer.endsAt - action.now), endsAt: null } }

    case 'resume':
      if (timer.status !== 'paused') return state
      return { ...state, timer: { ...timer, status: 'running', endsAt: action.now + timer.remainingMs } }

    case 'abandon':
      return { ...state, timer: idleTimer(timer.phase, state.settings, timer.focusCount) }

    case 'skipBreak':
      if (timer.phase === 'focus') return state
      return { ...state, timer: idleTimer('focus', state.settings, timer.focusCount) }

    case 'complete': {
      if (timer.status !== 'running' || timer.endsAt === null || timer.endsAt > action.now) return state

      if (timer.phase !== 'focus') {
        return { ...state, timer: idleTimer('focus', state.settings, timer.focusCount) }
      }

      const minutes = timer.durationMs / 60_000
      const rewarded = grantSession(state, minutes, timer.subjectId, timer.endsAt, action.recordId)

      const focusCount = timer.focusCount + 1
      const longBreak = focusCount >= state.settings.sessionsBeforeLongBreak
      const breakPhase: Phase = longBreak ? 'long' : 'short'
      let nextTimer = idleTimer(breakPhase, state.settings, longBreak ? 0 : focusCount)
      if (state.settings.autoStartBreaks) {
        nextTimer = { ...nextTimer, status: 'running', endsAt: action.now + nextTimer.remainingMs }
      }
      return { ...rewarded, timer: nextTimer }
    }

    case 'buy': {
      const item = ITEM_BY_ID[action.itemId]
      if (!item || state.inventory.includes(item.id)) return state
      if (state.hero.gold < item.price || state.hero.level < item.minLevel) return state
      return {
        ...state,
        hero: { ...state.hero, gold: state.hero.gold - item.price },
        inventory: [...state.inventory, item.id],
        equipped: { ...state.equipped, [item.slot]: item.id },
      }
    }

    case 'equip': {
      const item = ITEM_BY_ID[action.itemId]
      if (!item || !state.inventory.includes(item.id)) return state
      return { ...state, equipped: { ...state.equipped, [item.slot]: item.id } }
    }

    case 'unequip':
      return { ...state, equipped: { ...state.equipped, [action.slot]: null } }

    case 'recruit': {
      if (siegeLocked(state)) return state
      const index = UNITS.findIndex((u) => u.id === action.unitId)
      if (index < 0 || !unitUnlocked(state.idle, index)) return state
      const owned = state.idle.units[action.unitId] ?? 0
      const cost = unitCost(UNITS[index], owned)
      if (state.idle.souls < cost) return state
      return {
        ...state,
        idle: { ...state.idle, souls: state.idle.souls - cost, units: { ...state.idle.units, [action.unitId]: owned + 1 } },
      }
    }

    case 'buyUpgrade': {
      if (siegeLocked(state)) return state
      const up = UPGRADE_BY_ID[action.upgradeId]
      if (!up || state.idle.upgrades.includes(up.id) || !upgradeVisible(state.idle, up) || state.idle.souls < up.cost) return state
      return {
        ...state,
        idle: { ...state.idle, souls: state.idle.souls - up.cost, upgrades: [...state.idle.upgrades, up.id] },
      }
    }

    case 'buyRank': {
      if (siegeLocked(state)) return state
      const rank = RANK_BY_ID[action.rankId]
      const owned = state.idle.ranks[action.rankId] ?? 0
      if (!rank || owned >= rank.maxRank || !upgradeVisible(state.idle, rank)) return state
      const cost = rankCost(rank, owned)
      if (state.idle.souls < cost) return state
      return {
        ...state,
        idle: { ...state.idle, souls: state.idle.souls - cost, ranks: { ...state.idle.ranks, [rank.id]: owned + 1 } },
      }
    }

    case 'dismissReward':
      return { ...state, reward: null }

    case 'load':
      return action.state

    case 'dev':
      return devReducer(state, action.dev)
  }
}
