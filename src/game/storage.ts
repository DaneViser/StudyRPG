import { ITEM_BY_ID, LEGACY_ITEM_IDS } from './data'
import { createInitialState } from './reducer'
import type { GameState } from './types'

const SAVE_KEY = 'studyrpg.save.v1'

/** Fills in any fields missing from an older or hand-edited save. */
export function normalizeSave(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object' || (raw as GameState).version !== 1) return null
  const base = createInitialState()
  const save = raw as Partial<GameState>
  const equipped = { ...base.equipped, ...save.equipped }
  for (const slot of Object.keys(equipped) as (keyof typeof equipped)[]) equipped[slot] = migrateItem(equipped[slot])
  const inventory = Array.isArray(save.inventory) ? [...new Set(save.inventory.map(migrateItem).filter((id): id is string => !!id))] : []
  return {
    ...base,
    ...save,
    hero: { ...base.hero, ...save.hero },
    settings: { ...base.settings, ...save.settings },
    equipped,
    streak: { ...base.streak, ...save.streak },
    timer: { ...base.timer, ...save.timer },
    idle: { ...base.idle, ...save.idle, ranks: { ...save.idle?.ranks } },
    subjects: Array.isArray(save.subjects) ? save.subjects : [],
    inventory,
    history: Array.isArray(save.history) ? save.history : [],
  }
}

/** Maps item ids from older versions to current ones; unknown ids are dropped. */
function migrateItem(id: string | null | undefined): string | null {
  if (!id) return null
  const current = LEGACY_ITEM_IDS[id] ?? id
  return ITEM_BY_ID[current] ? current : null
}

export function loadGame(): GameState {
  try {
    const text = localStorage.getItem(SAVE_KEY)
    if (text) return normalizeSave(JSON.parse(text)) ?? createInitialState()
  } catch {
    // Corrupt save or storage unavailable: start fresh
  }
  return createInitialState()
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked; nothing sensible to do
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}
