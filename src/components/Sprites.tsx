import { ITEM_BY_ID } from '../game/data'
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
