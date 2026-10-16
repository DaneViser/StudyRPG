import type { Item, Slot } from './types'

interface Material {
  key: string
  adj: string
  minLevel: number
  price: number
  /** Weapon XP% and armour gold%; relics get roughly half of each */
  main: number
  relic: number
  siege: number
  color: string
}

// Eight material ranks; each makes one weapon (XP), one armour (gold) and one relic (both).
const MATERIALS: Material[] = [
  { key: 'wood', adj: 'Wooden', minLevel: 1, price: 60, main: 0.03, relic: 0.02, siege: 0, color: '#a0703a' },
  { key: 'stone', adj: 'Stone', minLevel: 3, price: 200, main: 0.06, relic: 0.03, siege: 0.02, color: '#8a8a94' },
  { key: 'copper', adj: 'Copper', minLevel: 5, price: 500, main: 0.1, relic: 0.05, siege: 0.04, color: '#d87a40' },
  { key: 'iron', adj: 'Iron', minLevel: 7, price: 1200, main: 0.15, relic: 0.08, siege: 0.06, color: '#a8b0c0' },
  { key: 'silver', adj: 'Silver', minLevel: 10, price: 2500, main: 0.21, relic: 0.11, siege: 0.09, color: '#e4ecf8' },
  { key: 'gold', adj: 'Golden', minLevel: 13, price: 5000, main: 0.28, relic: 0.14, siege: 0.12, color: '#f8c838' },
  { key: 'platinum', adj: 'Platinum', minLevel: 16, price: 9000, main: 0.36, relic: 0.18, siege: 0.16, color: '#b8f0e8' },
  { key: 'diamond', adj: 'Diamond', minLevel: 18, price: 15000, main: 0.45, relic: 0.23, siege: 0.2, color: '#70e0ff' },
]

const SLOT_NOUN: Record<Slot, string> = { weapon: 'Sword', armor: 'Armor', accessory: 'Amulet' }

const FLAVOR: Record<string, string> = {
  wood: 'Splinters included, free of charge.',
  stone: 'Heavy, honest and hard to lose.',
  copper: 'Turns green if you skip revision.',
  iron: 'Standard issue for night hunters.',
  silver: 'Gleams under the blood moon.',
  gold: 'Worth its weight in finished essays.',
  platinum: 'Rarer than a quiet library.',
  diamond: 'Cuts through any exam.',
}

const SLOTS: Slot[] = ['weapon', 'armor', 'accessory']

const materialItems: Item[] = MATERIALS.flatMap((m) =>
  SLOTS.map((slot) => ({
    id: `${m.key}-${slot}`,
    name: `${m.adj} ${SLOT_NOUN[slot]}`,
    slot,
    rarity: 'common' as const,
    price: m.price,
    minLevel: m.minLevel,
    xpBonus: slot === 'weapon' ? m.main : slot === 'accessory' ? m.relic : 0,
    goldBonus: slot === 'armor' ? m.main : slot === 'accessory' ? m.relic : 0,
    siegeBonus: m.siege,
    color: m.color,
    description: FLAVOR[m.key],
  })),
)

// Mythic items: beyond diamond, each with a different trade-off between hero and siege.
const mythicItems: Item[] = [
  { id: 'elderwood-bow', name: 'Elderwood Bow', slot: 'weapon', rarity: 'mythic', price: 28000, minLevel: 20, xpBonus: 0.5, goldBonus: 0, siegeBonus: 0.35, color: '#58d868', description: 'Carved from a tree older than the castle. Its arrows guide your army.' },
  { id: 'phoenix-blade', name: 'Phoenix Blade', slot: 'weapon', rarity: 'mythic', price: 45000, minLevel: 24, xpBonus: 0.65, goldBonus: 0.05, siegeBonus: 0.25, color: '#ff6a20', description: 'Reborn in flame after every exam.' },
  { id: 'icecrystal-mail', name: 'Icecrystal Mail', slot: 'armor', rarity: 'mythic', price: 28000, minLevel: 20, xpBonus: 0, goldBonus: 0.5, siegeBonus: 0.35, color: '#a8e8ff', description: 'Frozen calm. Demons shatter against it.' },
  { id: 'dragonscale-plate', name: 'Dragonscale Plate', slot: 'armor', rarity: 'mythic', price: 45000, minLevel: 24, xpBonus: 0.05, goldBonus: 0.65, siegeBonus: 0.25, color: '#d02848', description: 'Shed by an ancient wyrm who loved hoarding.' },
  { id: 'phoenix-feather', name: 'Phoenix Feather', slot: 'accessory', rarity: 'mythic', price: 36000, minLevel: 22, xpBonus: 0.25, goldBonus: 0.25, siegeBonus: 0.3, color: '#ffa030', description: 'Warm to the touch. Never quite burns out.' },
  { id: 'starfall-crown', name: 'Starfall Crown', slot: 'accessory', rarity: 'mythic', price: 55000, minLevel: 26, xpBonus: 0.3, goldBonus: 0.3, siegeBonus: 0.45, color: '#d8b8ff', description: 'Forged from a fallen star. Armies follow its light.' },
]

export const ITEMS: Item[] = [...materialItems, ...mythicItems]

/** Items from older saves mapped to their closest current equivalent. */
export const LEGACY_ITEM_IDS: Record<string, string> = {
  dagger: 'wood-weapon',
  'iron-sword': 'stone-weapon',
  'silver-rapier': 'copper-weapon',
  'moon-whip': 'iron-weapon',
  'scholar-blade': 'silver-weapon',
  leather: 'wood-armor',
  chainmail: 'stone-armor',
  'knight-plate': 'copper-armor',
  'gothic-aegis': 'iron-armor',
  'candle-charm': 'wood-accessory',
  'owl-amulet': 'stone-accessory',
  'hourglass-ring': 'copper-accessory',
  'crown-focus': 'iron-accessory',
}

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
export const GOLD_PER_MINUTE = 3
export const STREAK_BONUS_PER_DAY = 0.05
export const STREAK_BONUS_CAP = 0.25
export const LEVEL_UP_GOLD = 40
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
