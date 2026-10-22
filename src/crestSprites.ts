import { PixelGrid, litFromLeft, type Ramp } from './pixel'

/** Rival insignia are 24×24 heraldic shields. */
export const CREST_SIZE = 24

type Point = readonly [number, number]

const GOLD: Ramp = { light: '#ffe08a', base: '#d8a23a', dark: '#8a6418' }
const STEEL: Ramp = { light: '#eef3f8', base: '#b4c0cf', dark: '#6c7888' }
const BONE: Ramp = { light: '#f4ecdc', base: '#d8ccb0', dark: '#a69a7c' }
const WOOD = '#6a4422'
const EMBER = '#e2803a'
const FLAME_CORE = '#ffd27a'

/** A heater shield: flat top, straight sides, curving to a point. */
const SHIELD: Point[] = [[3, 1], [21, 1], [21, 12], [19, 17], [12, 23], [5, 17], [3, 12]]
const FIELD: Point[] = [[5, 3], [19, 3], [19, 12], [17.5, 16], [12, 21], [6.5, 16], [5, 12]]

/** A gold-rimmed shield with its field painted in, shaded like the rest of the art. */
function shield(grid: PixelGrid, field: Ramp | ((x: number, y: number) => string)): void {
  grid.polygon(SHIELD, litFromLeft(GOLD, 12, 9))
  grid.polygon(FIELD, typeof field === 'function' ? field : litFromLeft(field, 12, 7))
  grid.set(5, 3, GOLD.light)
  grid.set(6, 3, GOLD.light)
}

/** Baron Mordrake, Lord of the Grey Keep: a black keep on grey stone. */
function mordrake(grid: PixelGrid): void {
  shield(grid, { light: '#c4c4cc', base: '#9a9aa4', dark: '#6a6a74' })
  const keep = '#1c1c22'
  grid.rect(8, 9, 15, 18, keep)
  for (const x of [8, 11, 14]) {
    grid.rect(x, 6, x + 1, 8, keep)
  }
  grid.rect(8, 13, 15, 13, '#32323a')
  grid.rect(11, 15, 12, 18, '#060608')
  grid.rect(11, 11, 12, 12, FLAME_CORE)
  grid.set(9, 10, '#3a3a44')
}

/** The Ash Witch, Mistress of the Cinder Fen: a pale crescent over an ember, on fen-green and violet. */
function witch(grid: PixelGrid): void {
  shield(grid, (_x, y) => (y < 11 ? '#3a2456' : y === 11 ? '#2a3a2a' : '#1e3024'))
  grid.ellipse(12, 7.5, 3.6, 3.6, '#e8e0f4')
  grid.ellipse(13.6, 6.6, 3.1, 3.1, '#3a2456')
  grid.polygon([[9, 18], [10, 14], [11.5, 15], [12.5, 11.5], [14, 15], [15, 18]], EMBER)
  grid.polygon([[10.5, 18], [12, 14.5], [13.5, 18]], FLAME_CORE)
  for (const [x, y] of [[8, 13], [16, 12], [15, 10]] as const) {
    grid.set(x, y, EMBER)
  }
}

/** Gorrak the Warlord, Chieftain of the Red Steppe: crossed axes behind a skull, on red. */
function gorrak(grid: PixelGrid): void {
  shield(grid, { light: '#d0483a', base: '#9a2a22', dark: '#5e1814' })
  for (const [x0, x1] of [[6, 17], [18, 7]] as const) {
    grid.line(x0, 18, x1, 5, '#2a1a10')
    grid.line(x0 + (x1 > x0 ? 1 : -1), 18, x1 + (x1 > x0 ? 1 : -1), 5, WOOD)
  }
  for (const [x0, flip] of [[15, 1], [9, -1]] as const) {
    grid.polygon(
      [[x0, 4], [x0 + 3 * flip, 3], [x0 + 4 * flip, 6], [x0 + 3 * flip, 9], [x0 + 1 * flip, 7]],
      litFromLeft(STEEL, x0 + 2 * flip, 2),
    )
  }
  // A skull: round cranium, deep sockets, a narrower toothed jaw
  const socket = '#1a0a08'
  grid.ellipse(12, 11.5, 4.5, 4, litFromLeft(BONE, 12, 4.5))
  grid.rect(10, 15, 14, 17, BONE.base)
  grid.rect(9, 11, 10, 12, socket)
  grid.rect(13, 11, 14, 12, socket)
  grid.set(12, 14, socket)
  grid.set(11, 17, socket)
  grid.set(13, 17, socket)
}

/** The Old Watch Fort, held by deserters: a broken sword on a faded, cracked shield. */
function oldFort(grid: PixelGrid): void {
  shield(grid, { light: '#9a8a6a', base: '#76664a', dark: '#4e4230' })
  // A crack running down the shield
  for (const [x, y] of [[7, 3], [8, 4], [8, 5], [7, 6], [7, 7], [8, 8], [6, 8], [5, 9]] as const) {
    grid.set(x, y, '#2e2618')
  }
  // The blade snapped partway, the tip lying a little apart
  grid.line(12, 15, 15, 9, STEEL.base)
  grid.line(13, 15, 16, 9, STEEL.dark)
  grid.line(16, 7, 18, 4, STEEL.light)
  grid.set(17, 6, STEEL.base)
  grid.line(10, 15, 14, 17, GOLD.dark)
  grid.line(12, 17, 11, 19, WOOD)
  grid.set(11, 20, GOLD.base)
}

const PAINTERS: Record<string, (grid: PixelGrid) => void> = {
  mordrake,
  witch,
  gorrak,
  'old-fort': oldFort,
}

/** Paints a rival's insignia, or null for a rival without one. */
export function paintCrest(rivalId: string): PixelGrid | null {
  const painter = PAINTERS[rivalId]
  if (!painter) {
    return null
  }
  const grid = new PixelGrid(CREST_SIZE)
  painter(grid)
  grid.outline()
  return grid
}
