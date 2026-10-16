import { ITEM_BY_ID, type MonsterTier } from '../game/data'
import type { GameState } from '../game/types'

type Palette = Record<string, string>

function PixelSprite({ grid, palette, scale, className }: { grid: string[]; palette: Palette; scale: number; className?: string }) {
  const w = grid[0].length
  const h = grid.length
  const rects = []
  for (let y = 0; y < h; y++) {
    // Merge horizontal runs of the same colour to keep the DOM small
    let x = 0
    while (x < w) {
      const ch = grid[y][x]
      let run = 1
      while (x + run < w && grid[y][x + run] === ch) run++
      const fill = palette[ch]
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />)
      x += run
    }
  }
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} width={w * scale} height={h * scale} shapeRendering="crispEdges" aria-hidden="true">
      {rects}
    </svg>
  )
}

const HERO = [
  '..............o.',
  '....oooooo...oWo',
  '...oAAAAAAo..oWo',
  '...oAaaaaAo..oWo',
  '...oAesseAo..oWo',
  '...oAssssAo..oWo',
  '....oossoo..oggg',
  '..ooAAAAAAoo.ogo',
  '.oCoAAaaAAAossso',
  '.oCoAAAAAAAoooo.',
  '.oCoAbbXbbAo....',
  '.oCoAAAAAAAo....',
  '.oCCoAAAAAo.....',
  '..oCoaAoAao.....',
  '...ooAAoAAo.....',
  '....oaaoaao.....',
  '....obboobbo....',
  '....obboobbo....',
  '...obbbo.obbbo..',
  '...ooooo.ooooo..',
]

export function HeroSprite({ equipped, scale = 6, className }: { equipped: GameState['equipped']; scale?: number; className?: string }) {
  const weapon = equipped.weapon ? ITEM_BY_ID[equipped.weapon] : undefined
  const armor = equipped.armor ? ITEM_BY_ID[equipped.armor] : undefined
  const relic = equipped.accessory ? ITEM_BY_ID[equipped.accessory] : undefined
  const palette: Palette = {
    o: '#0d0a1a',
    s: '#f2c29b',
    e: '#1a1030',
    A: armor?.color ?? '#5878a8',
    a: armor?.shade ?? '#384c78',
    W: weapon?.color ?? '#8a5a30',
    g: weapon ? '#d8a028' : '#5a3a1e',
    C: relic ? relic.color : '#a02838',
    b: '#4a2e1a',
    X: relic?.color ?? '#4a2e1a',
  }
  return <PixelSprite grid={HERO} palette={palette} scale={scale} className={className} />
}

const BAT = [
  'o..............o',
  'oo....o..o....oo',
  'oMo...oooo...oMo',
  'oMMo.oMMMMo.oMMo',
  'oMMMoMrMMrMoMMMo',
  '.oMMMMMMMMMMMMo.',
  '..oMMoMwwMoMMo..',
  '...oo.oMMo.oo...',
  '......o..o......',
]

export function BatSprite({ color, scale = 5, className }: { color: string; scale?: number; className?: string }) {
  return <PixelSprite grid={BAT} palette={{ o: '#0d0a1a', M: color, r: '#ffe040', w: '#ffffff' }} scale={scale} className={className} />
}

const COIN = ['.oooo.', 'oyyyyo', 'oyhyyo', 'oyhyyo', 'oyyyyo', '.oooo.']

export function CoinIcon({ scale = 3 }: { scale?: number }) {
  return <PixelSprite grid={COIN} palette={{ o: '#7a4a08', y: '#f8c838', h: '#fff4b0' }} scale={scale} className="icon" />
}

const STAR = ['..o..', '.oyo.', 'oyyyo', '.oyo.', '..o..']

export function XpIcon({ scale = 3 }: { scale?: number }) {
  return <PixelSprite grid={STAR} palette={{ o: '#1a6a3a', y: '#78f0a0' }} scale={scale} className="icon" />
}

const FLAME = ['..o..', '.oro.', 'oryro', 'oryro', '.ooo.']

export function FlameIcon({ scale = 3 }: { scale?: number }) {
  return <PixelSprite grid={FLAME} palette={{ o: '#7a1a08', r: '#f86030', y: '#ffe040' }} scale={scale} className="icon" />
}

// ---------- Monsters (tougher foes for longer sessions) ----------

const SLIME = [
  '....oooo....',
  '..ooMMMMoo..',
  '.oMMhMMMMMo.',
  '.oMhMMMMMMo.',
  'oMMMkMMkMMMo',
  'oMMMkMMkMMMo',
  'oMMMMMMMMMMo',
  'oMMMMddMMMMo',
  '.oooooooooo.',
]

const SKELETON = [
  '....oooooo....',
  '...oBBBBBBo...',
  '..oBBBBBBBBo..',
  '..oBrrBBrrBo..',
  '..oBBBooBBBo..',
  '...oBoBoBBo...',
  '....oooooo..o.',
  '.oooo.BB.oooWo',
  'oMMMoBBBBBBoWo',
  'oMyMo.BBBB.oWo',
  'oMMMoBBBBBBogo',
  '.oMo..BBBB.oBo',
  '..o...BBBB..o.',
  '......BBBB....',
  '.....oB..Bo...',
  '.....oB..Bo...',
  '....oBB..BBo..',
  '....ooo..ooo..',
]

const GARGOYLE = [
  'o..................o',
  'oo......o..o......oo',
  'oMo....oSooSo....oMo',
  'oMMo...oSSSSo...oMMo',
  'oMMMo.oSrSSrSo.oMMMo',
  'oMMMMooSSSSSSooMMMMo',
  'oMMMMMoSwSSwSoMMMMMo',
  '.oMMMMMoSSSSoMMMMMo.',
  '..oMMMoSSSSSSoMMMo..',
  '...oMoSSSSSSSSoMo...',
  '....ooSSoSSoSSoo....',
  '......oSSSSSSo......',
  '.....oSSSoSSSSo.....',
  '.....oSSo..oSSo.....',
  '....oSSo....oSSo....',
  '...oSSo......oSSo...',
  '..owSo........oSwo..',
  '..ooo..........ooo..',
]

const DEMON = [
  '..o..................o..',
  '.oHo................oHo.',
  '.oHHo..............oHHo.',
  '..oHHo...oooooo...oHHo..',
  '...oHHooRRRRRRRRooHHo...',
  '....oHHRRRRRRRRRRHHo....',
  '.....oRRRRRRRRRRRRo.....',
  '.....oRyyyRRRRyyyRo.....',
  '.....oRRyyRRRRyyRRo.....',
  '.....oRRRRRRRRRRRRo.....',
  '......oRwRwwwwRwRo......',
  '.......oRRRRRRRRo.......',
  '..ooooooRRRRRRRRoooooo..',
  '.oMMMMoRRRRRRRRRRoMMMMo.',
  'oMMMMoRRRRddddRRRRoMMMMo',
  'oMMMoRRoRRRRRRRRoRRoMMMo',
  'oMMoRRo.oRRRRRRo.oRRoMMo',
  'oMMoyyo.oRRRRRRo.oyyoMMo',
  'oMMMoo..oRRooRRo..ooMMMo',
  'oMMMMo..oRRooRRo..oMMMMo',
  '.oMMMo..oRRooRRo..oMMMo.',
  '..oMMo.oRRRooRRRo.oMMo..',
  '...ooo.oddo..oddo.ooo...',
  '.......oooo..oooo.......',
]

const MONSTER_GRIDS = { slime: SLIME, bat: BAT, skeleton: SKELETON, gargoyle: GARGOYLE, demon: DEMON }

export function MonsterSprite({ tier, color, className }: { tier: MonsterTier; color: string; className?: string }) {
  const palette: Palette = {
    o: '#0d0a1a',
    M: color,
    r: '#ffe040',
    w: '#ffffff',
    k: '#0d0a1a',
    h: '#ffffffaa',
    d: '#00000066',
    B: '#e8e0c8',
    W: '#c8d0e0',
    g: '#a07020',
    y: '#ffe040',
    S: '#7a7890',
    H: '#e8dcc0',
    R: tier.dark ? '#2a1038' : '#c02030',
  }
  if (tier.sprite === 'skeleton') palette.y = '#ffffff'
  if (tier.sprite === 'demon') palette.d = tier.dark ? '#120618' : '#701020'
  return <PixelSprite grid={MONSTER_GRIDS[tier.sprite]} palette={palette} scale={tier.scale} className={className} />
}

// ---------- Siege army ----------

const SOLDIER = [
  '..ooo..o.',
  '.oHHHo.W.',
  '.oseso.W.',
  '.osssooso',
  '..oooUUo.',
  '.oUUUUo..',
  'oUUUUUo..',
  'o.oUUo...',
  '..oUUo...',
  '..o..o...',
  '.oo..oo..',
]

const GOLEM = [
  '...oooooo...',
  '..oSSSSSSo..',
  '..oSrSSrSo..',
  '..oSSSSSSo..',
  '.ooooSSoooo.',
  'oSSSSSSSSSSo',
  'oSSoSSSSoSSo',
  'oSSoSSSSoSSo',
  'oooooSSooooo',
  '...oSSSSo...',
  '..oSSooSSo..',
  '..ooo..ooo..',
]

const DRAGON = [
  '....ooo.........',
  '...oGGGo........',
  '...oGGGGo...ooo.',
  '....oGGGGo.oGyGo',
  'ooo..oGGGGoGGGGo',
  'oGGooGGGGGGGGoo.',
  '.oGGGGGGGGGGo...',
  '..ooGGGGGGGo....',
  '....oGo.oGo.....',
  '....oo..oo......',
]

const UNIT_LOOKS: Record<string, { grid: string[]; palette: Palette }> = {
  squire: { grid: SOLDIER, palette: { H: '#8a8a9a', U: '#4060c0', W: '#a07040' } },
  archer: { grid: SOLDIER, palette: { H: '#3a8a3a', U: '#2a6a2a', W: '#c08a40' } },
  knight: { grid: SOLDIER, palette: { H: '#e0e8f8', U: '#a8b0c8', W: '#ffffff' } },
  mage: { grid: SOLDIER, palette: { H: '#7a3ad0', U: '#5a28a0', W: '#ff8030' } },
  golem: { grid: GOLEM, palette: { S: '#6a8a7a', r: '#40f0ff' } },
  dragon: { grid: DRAGON, palette: { G: '#d04028', y: '#ffe040' } },
}

export function UnitSprite({ unit, scale = 3, className }: { unit: string; scale?: number; className?: string }) {
  const look = UNIT_LOOKS[unit] ?? UNIT_LOOKS.squire
  return <PixelSprite grid={look.grid} palette={{ o: '#0d0a1a', s: '#f2c29b', e: '#1a1030', ...look.palette }} scale={scale} className={className} />
}

function buildKeep(): string[] {
  const W = 26
  const H = 24
  const g = Array.from({ length: H }, () => Array<string>(W).fill('.'))
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = c
  }
  const box = (x: number, y: number, w: number, h: number) => {
    rect(x, y, w, h, 'o')
    rect(x + 1, y + 1, w - 2, h - 2, 'K')
  }
  // Spikes and central keep
  rect(9, 0, 1, 2, 'o')
  rect(16, 0, 1, 2, 'o')
  rect(12, 0, 2, 2, 'o')
  box(8, 2, 10, 22)
  rect(12, 5, 2, 3, 'r')
  // Side towers with battlements
  for (const tx of [0, 20]) {
    rect(tx, 3, 2, 2, 'o')
    rect(tx + 4, 3, 2, 2, 'o')
    box(tx, 5, 6, 19)
    rect(tx + 2, 9, 2, 3, 'r')
  }
  // Curtain wall and gate
  box(5, 12, 16, 12)
  for (let x = 5; x < 21; x += 2) rect(x, 11, 1, 1, 'o')
  rect(9, 15, 8, 9, 'o')
  rect(10, 16, 6, 8, 'g')
  rect(10, 16, 6, 1, 'k')
  return g.map((row) => row.join(''))
}

const KEEP = buildKeep()

export function KeepSprite({ level, scale = 4, className }: { level: number; scale?: number; className?: string }) {
  const stones = ['#4a3a5a', '#3a2a4a', '#5a2a3a', '#2a2a3a', '#4a1a2a']
  return (
    <PixelSprite
      grid={KEEP}
      palette={{ o: '#0d0a1a', K: stones[(level - 1) % stones.length], r: '#ff4030', g: '#140810', k: '#6a3a2a' }}
      scale={scale}
      className={className}
    />
  )
}
