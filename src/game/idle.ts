// The idle siege: an army that raids demon keeps, but only while you study.
// Progress is a pure function of focused minutes, so it needs no ticking state
// and is computed live for display and committed when a quest is won.

import type { IdleState, SiegeLoot } from './types'

export interface Unit {
  id: string
  name: string
  /** Souls (and siege damage) per minute of study */
  rate: number
  baseCost: number
  description: string
}

export const UNITS: Unit[] = [
  { id: 'squire', name: 'Squire', rate: 2, baseCost: 15, description: 'Eager, underpaid, carries a pointy stick.' },
  { id: 'archer', name: 'Archer', rate: 8, baseCost: 120, description: 'Volleys arrows over the battlements.' },
  { id: 'knight', name: 'Knight', rate: 30, baseCost: 800, description: 'Sworn to break the demon gates.' },
  { id: 'mage', name: 'Battle Mage', rate: 100, baseCost: 4000, description: 'Lobs fireballs between lectures.' },
  { id: 'golem', name: 'Siege Golem', rate: 400, baseCost: 20000, description: 'A walking battering ram of runestone.' },
  { id: 'dragon', name: 'Dragon Rider', rate: 1500, baseCost: 100000, description: 'Rains fire from the blood-red sky.' },
]

export const UNIT_BY_ID: Record<string, Unit> = Object.fromEntries(UNITS.map((u) => [u.id, u]))

export type UpgradeEffect =
  | { kind: 'unit'; unit: string; mult: number }
  | { kind: 'army'; mult: number }
  | { kind: 'loot'; mult: number }
  | { kind: 'hero'; xp: number; gold: number }

export interface Upgrade {
  id: string
  name: string
  cost: number
  description: string
  effect: UpgradeEffect
  /** Shown once you own `count` of `unit`, or have reached keep level `keep` */
  req: { unit: string; count: number } | { keep: number } | { army: number }
}

export const UPGRADES: Upgrade[] = [
  { id: 'sharp-spears', name: 'Sharpened Spears', cost: 100, description: 'Squires x2', effect: { kind: 'unit', unit: 'squire', mult: 2 }, req: { unit: 'squire', count: 5 } },
  { id: 'war-drums', name: 'War Drums', cost: 500, description: 'Whole army +25%', effect: { kind: 'army', mult: 1.25 }, req: { army: 10 } },
  { id: 'yew-longbows', name: 'Yew Longbows', cost: 800, description: 'Archers x2', effect: { kind: 'unit', unit: 'archer', mult: 2 }, req: { unit: 'archer', count: 5 } },
  { id: 'siege-ladders', name: 'Siege Ladders', cost: 1500, description: 'Keep loot +50%', effect: { kind: 'loot', mult: 1.5 }, req: { keep: 3 } },
  { id: 'battle-hymns', name: 'Battle Hymns', cost: 2500, description: 'Hero +5% XP from quests', effect: { kind: 'hero', xp: 0.05, gold: 0 }, req: { keep: 3 } },
  { id: 'royal-tithe', name: 'Royal Tithe', cost: 2500, description: 'Hero +5% gold from quests', effect: { kind: 'hero', xp: 0, gold: 0.05 }, req: { keep: 3 } },
  { id: 'holy-oaths', name: 'Holy Oaths', cost: 5000, description: 'Knights x2', effect: { kind: 'unit', unit: 'knight', mult: 2 }, req: { unit: 'knight', count: 5 } },
  { id: 'arcane-tomes', name: 'Arcane Tomes', cost: 25000, description: 'Battle Mages x2', effect: { kind: 'unit', unit: 'mage', mult: 2 }, req: { unit: 'mage', count: 5 } },
  { id: 'crusader-banners', name: 'Crusader Banners', cost: 60000, description: 'Whole army +50%', effect: { kind: 'army', mult: 1.5 }, req: { army: 50 } },
  { id: 'scholars-blessing', name: "Scholar's Blessing", cost: 80000, description: 'Hero +10% XP and gold', effect: { kind: 'hero', xp: 0.1, gold: 0.1 }, req: { keep: 8 } },
  { id: 'runic-cores', name: 'Runic Cores', cost: 120000, description: 'Siege Golems x2', effect: { kind: 'unit', unit: 'golem', mult: 2 }, req: { unit: 'golem', count: 5 } },
  { id: 'dragon-pact', name: 'Dragon Pact', cost: 600000, description: 'Dragon Riders x2', effect: { kind: 'unit', unit: 'dragon', mult: 2 }, req: { unit: 'dragon', count: 5 } },
]

export const UPGRADE_BY_ID: Record<string, Upgrade> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]))

const COST_GROWTH = 1.15

export function createIdleState(): IdleState {
  return { souls: 0, totalSouls: 0, units: { squire: 1 }, upgrades: [], keepLevel: 1, keepDamage: 0 }
}

export function unitCost(unit: Unit, owned: number): number {
  return Math.ceil(unit.baseCost * Math.pow(COST_GROWTH, owned))
}

export function armySize(idle: IdleState): number {
  return Object.values(idle.units).reduce((a, b) => a + b, 0)
}

/** A unit is revealed once you own at least one of the previous tier. */
export function unitUnlocked(idle: IdleState, index: number): boolean {
  return index === 0 || (idle.units[UNITS[index - 1].id] ?? 0) > 0
}

export function upgradeVisible(idle: IdleState, up: Upgrade): boolean {
  const r = up.req
  if ('unit' in r) return (idle.units[r.unit] ?? 0) >= r.count
  if ('keep' in r) return idle.keepLevel >= r.keep
  return armySize(idle) >= r.army
}

function effects(idle: IdleState) {
  return idle.upgrades.map((id) => UPGRADE_BY_ID[id]?.effect).filter((e): e is UpgradeEffect => !!e)
}

export function unitRate(idle: IdleState, unit: Unit): number {
  let rate = unit.rate
  for (const e of effects(idle)) if (e.kind === 'unit' && e.unit === unit.id) rate *= e.mult
  return rate
}

/** Souls (and siege damage) per minute of study. */
export function soulsPerMinute(idle: IdleState): number {
  let total = 0
  for (const unit of UNITS) total += (idle.units[unit.id] ?? 0) * unitRate(idle, unit)
  for (const e of effects(idle)) if (e.kind === 'army') total *= e.mult
  return total
}

export function idleHeroBonus(idle: IdleState) {
  let xp = 0
  let gold = 0
  for (const e of effects(idle)) {
    if (e.kind === 'hero') {
      xp += e.xp
      gold += e.gold
    }
  }
  return { xp, gold }
}

export function keepHp(level: number): number {
  return Math.round(200 * Math.pow(1.8, level - 1))
}

export function keepLoot(idle: IdleState, level: number) {
  let mult = 1
  for (const e of effects(idle)) if (e.kind === 'loot') mult *= e.mult
  return { gold: Math.round(25 * level * mult), xp: Math.round(30 * level * mult) }
}

export const KEEP_NAMES = ['Imp Outpost', 'Ghoul Barracks', 'Bone Tower', 'Cursed Abbey', 'Wraith Citadel', 'Blood Fortress', 'Infernal Spire', 'Dread Castle']

export function keepName(level: number): string {
  return KEEP_NAMES[(level - 1) % KEEP_NAMES.length]
}

/** Advances the siege by `minutes` of study. */
export function simulateIdle(idle: IdleState, minutes: number): { idle: IdleState; loot: SiegeLoot } {
  const gained = soulsPerMinute(idle) * Math.max(0, minutes)
  let { keepLevel, keepDamage } = idle
  keepDamage += gained
  const loot: SiegeLoot = { souls: gained, keeps: 0, gold: 0, xp: 0 }
  while (keepDamage >= keepHp(keepLevel)) {
    keepDamage -= keepHp(keepLevel)
    const l = keepLoot(idle, keepLevel)
    loot.keeps += 1
    loot.gold += l.gold
    loot.xp += l.xp
    keepLevel += 1
  }
  return {
    idle: { ...idle, souls: idle.souls + gained, totalSouls: idle.totalSouls + gained, keepLevel, keepDamage },
    loot,
  }
}

export function formatNum(n: number): string {
  const v = Math.floor(n)
  if (v < 10_000) return String(v)
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ]
  for (const [size, suffix] of units) if (v >= size) return `${(v / size).toFixed(v >= size * 100 ? 0 : 1)}${suffix}`
  return String(v)
}
