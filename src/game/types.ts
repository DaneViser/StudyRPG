export type Slot = 'weapon' | 'armor' | 'accessory'

export interface Item {
  id: string
  name: string
  slot: Slot
  rarity: 'common' | 'mythic'
  price: number
  minLevel: number
  /** Fractional bonus, e.g. 0.1 = +10% XP */
  xpBonus: number
  goldBonus: number
  /** Fractional boost to army power (souls and keep damage) */
  siegeBonus: number
  description: string
  /** Main colour used when drawing the item on the hero sprite */
  color: string
}

export interface Subject {
  id: string
  name: string
  color: string
  minutes: number
  sessions: number
}

export type SkyMode = 'live' | 'night' | 'day'

export interface SkyLocation {
  lat: number
  lon: number
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
  /** Background sky: follow local time, or force night/day */
  skyMode: SkyMode
  /** Optional user-granted location (rounded to 0.1°) for exact sunrise/sunset */
  location: SkyLocation | null
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

export interface IdleState {
  /** Spendable souls (fractional internally) */
  souls: number
  totalSouls: number
  units: Record<string, number>
  upgrades: string[]
  /** Ranks bought in repeatable boosts, by id */
  ranks: Record<string, number>
  /** Level of the demon keep currently under siege (1-based) */
  keepLevel: number
  /** Damage dealt to the current keep */
  keepDamage: number
}

export interface SiegeLoot {
  souls: number
  keeps: number
  gold: number
  xp: number
}

export interface RewardEvent {
  siege: SiegeLoot
  monster?: string
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
  idle: IdleState
}
