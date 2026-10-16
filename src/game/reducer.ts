import { HISTORY_LIMIT, ITEM_BY_ID } from './data'
import { addXp, nextStreak, phaseMinutes, sessionRewards } from './logic'
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
  | { type: 'equip'; itemId: string }
  | { type: 'unequip'; slot: Slot }
  | { type: 'dismissReward' }
  | { type: 'load'; state: GameState }

function idleTimer(phase: Phase, settings: Settings, focusCount: number): TimerState {
  const ms = phaseMinutes(phase, settings) * 60_000
  return { phase, status: 'idle', endsAt: null, remainingMs: ms, durationMs: ms, subjectId: null, focusCount }
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
      const streak = nextStreak(state.streak, timer.endsAt)
      const { xp, gold } = sessionRewards(minutes, state.equipped, streak.count)
      const leveled = addXp({ ...state.hero, gold: state.hero.gold + gold }, xp)
      const subject = state.subjects.find((s) => s.id === timer.subjectId)
      const subjectName = subject?.name ?? 'Unknown'

      const focusCount = timer.focusCount + 1
      const longBreak = focusCount >= state.settings.sessionsBeforeLongBreak
      const breakPhase: Phase = longBreak ? 'long' : 'short'
      let nextTimer = idleTimer(breakPhase, state.settings, longBreak ? 0 : focusCount)
      if (state.settings.autoStartBreaks) {
        nextTimer = { ...nextTimer, status: 'running', endsAt: action.now + nextTimer.remainingMs }
      }

      return {
        ...state,
        hero: leveled.hero,
        streak,
        subjects: state.subjects.map((s) =>
          s.id === timer.subjectId ? { ...s, minutes: s.minutes + minutes, sessions: s.sessions + 1 } : s,
        ),
        history: [
          { id: action.recordId, subjectId: timer.subjectId ?? '', subjectName, minutes, xp, gold, completedAt: timer.endsAt },
          ...state.history,
        ].slice(0, HISTORY_LIMIT),
        timer: nextTimer,
        reward: {
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

    case 'dismissReward':
      return { ...state, reward: null }

    case 'load':
      return action.state
  }
}
