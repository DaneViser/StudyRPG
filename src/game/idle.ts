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
  { id: 'merchant-guild', name: 'Merchant Guild', cost: 12000, description: 'Hero +10% gold from quests', effect: { kind: 'hero', xp: 0, gold: 0.1 }, req: { keep: 5 } },
  { id: 'sages-library', name: "Sage's Library", cost: 12000, description: 'Hero +10% XP from quests', effect: { kind: 'hero', xp: 0.1, gold: 0 }, req: { keep: 5 } },
  { id: 'lords-of-plunder', name: 'Lords of Plunder', cost: 250000, description: 'Keep loot x2', effect: { kind: 'loot', mult: 2 }, req: { keep: 10 } },
  { id: 'golden-age', name: 'Golden Age', cost: 1500000, description: 'Hero +15% gold from quests', effect: { kind: 'hero', xp: 0, gold: 0.15 }, req: { keep: 12 } },
  { id: 'enlightenment', name: 'Enlightenment', cost: 1500000, description: 'Hero +15% XP from quests', effect: { kind: 'hero', xp: 0.15, gold: 0 }, req: { keep: 12 } },
]

/** Repeatable boosts: each rank adds the same bonus, but costs `growth`x more than the last (capped). */
export interface Rank {
  id: string
  name: string
  description: string
  perRank: { xp?: number; gold?: number; army?: number }
  baseCost: number
  growth: number
  maxRank: number
  req: Upgrade['req']
}

export const RANKS: Rank[] = [
  { id: 'treasury', name: 'Royal Treasury', description: 'Hero +2% gold per rank', perRank: { gold: 0.02 }, baseCost: 2000, growth: 1.9, maxRank: 20, req: { keep: 4 } },
  { id: 'academy', name: 'Grand Academy', description: 'Hero +2% XP per rank', perRank: { xp: 0.02 }, baseCost: 2000, growth: 1.9, maxRank: 20, req: { keep: 4 } },
  { id: 'engineers', name: 'Siege Engineers', description: 'Whole army +5% per rank', perRank: { army: 0.05 }, baseCost: 1500, growth: 1.8, maxRank: 20, req: { army: 25 } },
]

export const RANK_BY_ID: Record<string, Rank> = Object.fromEntries(RANKS.map((r) => [r.id, r]))

export function rankCost(rank: Rank, owned: number): number {
  return Math.ceil(rank.baseCost * Math.pow(rank.growth, owned))
}

function rankTotal(idle: IdleState, key: 'xp' | 'gold' | 'army'): number {
  let total = 0
  for (const r of RANKS) total += (idle.ranks?.[r.id] ?? 0) * (r.perRank[key] ?? 0)
  return total
}

export const UPGRADE_BY_ID: Record<string, Upgrade> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]))

const COST_GROWTH = 1.15

export function createIdleState(): IdleState {
  return { souls: 0, totalSouls: 0, units: { squire: 1 }, upgrades: [], ranks: {}, keepLevel: 1, keepDamage: 0 }
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

export function upgradeVisible(idle: IdleState, up: Pick<Upgrade, 'req'>): boolean {
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

/** Army power multiplier from upgrades, ranks and the hero's gear (`gearSiege`, e.g. 0.3 = +30%). */
export function armyMultiplier(idle: IdleState, gearSiege = 0): number {
  let mult = (1 + rankTotal(idle, 'army')) * (1 + gearSiege)
  for (const e of effects(idle)) if (e.kind === 'army') mult *= e.mult
  return mult
}

/** Souls (and siege damage) per minute of study. */
export function soulsPerMinute(idle: IdleState, gearSiege = 0): number {
  let total = 0
  for (const unit of UNITS) total += (idle.units[unit.id] ?? 0) * unitRate(idle, unit)
  return total * armyMultiplier(idle, gearSiege)
}

export function idleHeroBonus(idle: IdleState) {
  let xp = rankTotal(idle, 'xp')
  let gold = rankTotal(idle, 'gold')
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
  return { gold: Math.round(50 * level * mult), xp: Math.round(30 * level * mult) }
}

export const KEEP_NAMES = ['Imp Outpost', 'Ghoul Barracks', 'Bone Tower', 'Cursed Abbey', 'Wraith Citadel', 'Blood Fortress', 'Infernal Spire', 'Dread Castle']

export function keepName(level: number): string {
  return KEEP_NAMES[(level - 1) % KEEP_NAMES.length]
}

/** Advances the siege by `minutes` of study; `gearSiege` is the hero's gear siege bonus. */
export function simulateIdle(idle: IdleState, minutes: number, gearSiege = 0): { idle: IdleState; loot: SiegeLoot } {
  const gained = soulsPerMinute(idle, gearSiege) * Math.max(0, minutes)
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
