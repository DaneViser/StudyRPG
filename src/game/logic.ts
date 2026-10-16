import {
  GOLD_PER_MINUTE,
  ITEM_BY_ID,
  LEVEL_UP_GOLD,
  MONSTERS,
  STREAK_BONUS_CAP,
  STREAK_BONUS_PER_DAY,
  TITLES,
  XP_PER_MINUTE,
} from './data'
import { idleHeroBonus } from './idle'
import type { GameState, Hero, Item, Phase, Settings } from './types'

/** XP needed to go from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function titleFor(level: number): string {
  let title = TITLES[0][1]
  for (const [min, name] of TITLES) if (level >= min) title = name
  return title
}

export function gearBonuses(equipped: GameState['equipped']) {
  let xp = 0
  let gold = 0
  let siege = 0
  for (const id of Object.values(equipped)) {
    const item = id ? ITEM_BY_ID[id] : undefined
    if (item) {
      xp += item.xpBonus
      gold += item.goldBonus
      siege += item.siegeBonus
    }
  }
  return { xp, gold, siege }
}

export function streakBonus(streak: number): number {
  return Math.min(Math.max(streak - 1, 0) * STREAK_BONUS_PER_DAY, STREAK_BONUS_CAP)
}

export function dayKey(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function nextStreak(streak: GameState['streak'], now: number): GameState['streak'] {
  const today = dayKey(now)
  if (streak.lastDay === today) return streak
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const count = streak.lastDay === dayKey(yesterday.getTime()) ? streak.count + 1 : 1
  return { count, lastDay: today }
}

/** Streak as it should be displayed now (it lapses if yesterday was skipped). */
export function liveStreak(streak: GameState['streak'], now: number): number {
  if (!streak.lastDay) return 0
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return streak.lastDay === dayKey(now) || streak.lastDay === dayKey(yesterday.getTime()) ? streak.count : 0
}

/** Permanent hero bonuses from gear and siege upgrades (streak not included). */
export function heroBonuses(state: Pick<GameState, 'equipped' | 'idle'>) {
  const gear = gearBonuses(state.equipped)
  const siege = idleHeroBonus(state.idle)
  return { xp: gear.xp + siege.xp, gold: gear.gold + siege.gold }
}

export function sessionRewards(minutes: number, state: Pick<GameState, 'equipped' | 'idle'>, streak: number) {
  const bonus = heroBonuses(state)
  const xp = Math.round(minutes * XP_PER_MINUTE * (1 + bonus.xp + streakBonus(streak)))
  const gold = Math.round(minutes * GOLD_PER_MINUTE * (1 + bonus.gold))
  return { xp, gold }
}

/** Adds XP to a hero, rolling over levels. Returns the new hero and bonus gold from level-ups. */
export function addXp(hero: Hero, amount: number): { hero: Hero; levelBonusGold: number } {
  let { level, xp } = hero
  let levelBonusGold = 0
  xp += amount
  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level)
    level += 1
    levelBonusGold += LEVEL_UP_GOLD * level
  }
  return {
    hero: { ...hero, level, xp, totalXp: hero.totalXp + amount, gold: hero.gold + levelBonusGold },
    levelBonusGold,
  }
}

export function phaseMinutes(phase: Phase, settings: Settings): number {
  if (phase === 'focus') return settings.focusMinutes
  if (phase === 'short') return settings.shortBreakMinutes
  return settings.longBreakMinutes
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function percent(n: number): string {
  return `${Math.round(n * 100)}%`
}

export function bonusText(item: Item): string {
  const parts = []
  if (item.xpBonus) parts.push(`+${percent(item.xpBonus)} XP`)
  if (item.goldBonus) parts.push(`+${percent(item.goldBonus)} Gold`)
  if (item.siegeBonus) parts.push(`+${percent(item.siegeBonus)} Siege`)
  return parts.join('  ')
}

export function monsterFor(minutes: number) {
  let tier = MONSTERS[0]
  let rank = 0
  MONSTERS.forEach((m, i) => {
    if (minutes >= m.minMinutes) {
      tier = m
      rank = i + 1
    }
  })
  return { tier, rank }
}
