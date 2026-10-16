import type { Item, Slot } from './types'

export const ITEMS: Item[] = [
  // Weapons boost XP
  { id: 'dagger', name: 'Rusty Dagger', slot: 'weapon', price: 50, minLevel: 1, xpBonus: 0.05, goldBonus: 0, color: '#a8a8b8', description: 'Better than a stick. Barely.' },
  { id: 'iron-sword', name: 'Iron Sword', slot: 'weapon', price: 150, minLevel: 3, xpBonus: 0.1, goldBonus: 0, color: '#d8e0f0', description: 'A trusty blade for long nights.' },
  { id: 'silver-rapier', name: 'Silver Rapier', slot: 'weapon', price: 400, minLevel: 6, xpBonus: 0.15, goldBonus: 0, color: '#9ff0ff', description: 'Gleams under the blood moon.' },
  { id: 'moon-whip', name: 'Moonlit Whip', slot: 'weapon', price: 1000, minLevel: 10, xpBonus: 0.25, goldBonus: 0, color: '#f8c838', description: 'Passed down by night hunters.' },
  { id: 'scholar-blade', name: 'Blade of Sages', slot: 'weapon', price: 2400, minLevel: 15, xpBonus: 0.4, goldBonus: 0.05, color: '#ff7bd5', description: 'Forged from finished homework.' },

  // Armour boosts gold
  { id: 'leather', name: 'Leather Vest', slot: 'armor', price: 60, minLevel: 1, xpBonus: 0, goldBonus: 0.05, color: '#a0663a', shade: '#6e4224', description: 'Smells faintly of library.' },
  { id: 'chainmail', name: 'Chain Mail', slot: 'armor', price: 180, minLevel: 4, xpBonus: 0, goldBonus: 0.1, color: '#8c98b0', shade: '#5a6478', description: 'Jingles when you turn pages.' },
  { id: 'knight-plate', name: 'Knight Plate', slot: 'armor', price: 500, minLevel: 8, xpBonus: 0.05, goldBonus: 0.15, color: '#c8d0e8', shade: '#7880a8', description: 'Heavy, shiny, dignified.' },
  { id: 'gothic-aegis', name: 'Gothic Aegis', slot: 'armor', price: 1200, minLevel: 12, xpBonus: 0.05, goldBonus: 0.25, color: '#7a3ad0', shade: '#46207e', description: 'Woven from castle shadows.' },

  // Accessories boost both
  { id: 'candle-charm', name: 'Candle Charm', slot: 'accessory', price: 80, minLevel: 2, xpBonus: 0.03, goldBonus: 0.03, color: '#ffb040', description: 'Lights the way through chapter 4.' },
  { id: 'owl-amulet', name: 'Owl Amulet', slot: 'accessory', price: 250, minLevel: 5, xpBonus: 0.1, goldBonus: 0, color: '#58d868', description: 'Wise eyes watch your notes.' },
  { id: 'hourglass-ring', name: 'Hourglass Ring', slot: 'accessory', price: 600, minLevel: 9, xpBonus: 0.1, goldBonus: 0.1, color: '#40a0ff', description: 'Time bends to the focused.' },
  { id: 'crown-focus', name: 'Crown of Focus', slot: 'accessory', price: 1500, minLevel: 14, xpBonus: 0.2, goldBonus: 0.2, color: '#ff3048', description: 'The mark of a true scholar.' },
]

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]))

export const SLOT_LABEL: Record<Slot, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  accessory: 'Relic',
}

export const SUBJECT_COLORS = ['#e04050', '#f08830', '#f8d038', '#50c060', '#40b0e0', '#6070f0', '#b058e0', '#f070b0']

export const TITLES: [number, string][] = [
  [1, 'Novice'],
  [3, 'Squire'],
  [5, 'Apprentice'],
  [8, 'Knight'],
  [12, 'Night Hunter'],
  [16, 'Archmage'],
  [20, 'Legend'],
]

export const XP_PER_MINUTE = 4
export const GOLD_PER_MINUTE = 1
export const STREAK_BONUS_PER_DAY = 0.05
export const STREAK_BONUS_CAP = 0.25
export const LEVEL_UP_GOLD = 20
export const HISTORY_LIMIT = 200

export interface MonsterTier {
  sprite: 'slime' | 'bat' | 'skeleton' | 'gargoyle' | 'demon'
  name: string
  /** Session length (minutes) at which this foe appears */
  minMinutes: number
  scale: number
  flying?: boolean
  /** Visual intensity: 0 none, 1 aura, 2 boss aura + shake */
  menace: number
  dark?: boolean
}

/** Longer sessions summon tougher foes; capped at the Archdemon. */
export const MONSTERS: MonsterTier[] = [
  { sprite: 'slime', name: 'Slime', minMinutes: 1, scale: 5, menace: 0 },
  { sprite: 'bat', name: 'Bat', minMinutes: 15, scale: 5, flying: true, menace: 0 },
  { sprite: 'skeleton', name: 'Skeleton', minMinutes: 25, scale: 6, menace: 0 },
  { sprite: 'gargoyle', name: 'Gargoyle', minMinutes: 45, scale: 6, flying: true, menace: 1 },
  { sprite: 'demon', name: 'Demon Lord', minMinutes: 75, scale: 5, menace: 1 },
  { sprite: 'demon', name: 'Archdemon', minMinutes: 120, scale: 6, menace: 2, dark: true },
]

export const HP_PER_MINUTE = 10
