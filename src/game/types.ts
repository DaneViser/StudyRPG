export type Slot = 'weapon' | 'armor' | 'accessory'

export interface Item {
  id: string
  name: string
  slot: Slot
  price: number
  minLevel: number
  /** Fractional bonus, e.g. 0.1 = +10% XP */
  xpBonus: number
  goldBonus: number
  description: string
  /** Main colour used when drawing the item on the hero sprite */
  color: string
  /** Shade colour (armour only) */
  shade?: string
}

export interface Subject {
  id: string
  name: string
  color: string
  minutes: number
  sessions: number
}

export interface Settings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
  autoStartBreaks: boolean
  sound: boolean
  notifications: boolean
  scanlines: boolean
}

export type Phase = 'focus' | 'short' | 'long'
export type TimerStatus = 'idle' | 'running' | 'paused'

export interface TimerState {
  phase: Phase
  status: TimerStatus
  /** Epoch ms when the running phase ends (only while running) */
  endsAt: number | null
  /** Remaining ms (authoritative while idle/paused) */
  remainingMs: number
  durationMs: number
  /** Subject locked in when the focus phase started */
  subjectId: string | null
  /** Completed focus sessions in the current cycle (for long breaks) */
  focusCount: number
}

export interface SessionRecord {
  id: string
  subjectId: string
  subjectName: string
  minutes: number
  xp: number
  gold: number
  completedAt: number
}

export interface RewardEvent {
  xp: number
  gold: number
  levelBonusGold: number
  fromLevel: number
  toLevel: number
  streak: number
  subjectName: string
  minutes: number
}

export interface Hero {
  name: string
  level: number
  /** XP progress inside the current level */
  xp: number
  totalXp: number
  gold: number
}

export interface GameState {
  version: 1
  hero: Hero
  subjects: Subject[]
  selectedSubjectId: string | null
  settings: Settings
  inventory: string[]
  equipped: Record<Slot, string | null>
  history: SessionRecord[]
  streak: { count: number; lastDay: string | null }
  timer: TimerState
  reward: RewardEvent | null
}
