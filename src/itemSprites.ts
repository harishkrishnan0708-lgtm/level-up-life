import { PixelGrid, litFromLeft, type Ramp } from './pixel'

/** Shop items and kingdom buildings are 24×24 pixel icons. */
export const ITEM_SPRITE_SIZE = 24

type Point = readonly [number, number]

const STONE: Ramp = { light: '#b8b4ac', base: '#8a8680', dark: '#5a5650' }
const STEEL: Ramp = { light: '#eef3f8', base: '#b4c0cf', dark: '#7c889a' }
const BLACK_STEEL: Ramp = { light: '#5d5d66', base: '#2c2c33', dark: '#151519' }
const WOOD: Ramp = { light: '#a0703f', base: '#7a4a28', dark: '#4e2e18' }
const GOLD: Ramp = { light: '#ffe08a', base: '#e8b33a', dark: '#a87a1e' }
const BONE: Ramp = { light: '#f4ecdc', base: '#d8ccb0', dark: '#a69a7c' }
const LEATHER: Ramp = { light: '#6a5a48', base: '#4a3f33', dark: '#2e261e' }
const BANNER_RED: Ramp = { light: '#e05a4a', base: '#b0302a', dark: '#6e1a16' }
const GLASS: Ramp = { light: '#e8f4ff', base: '#a8c8e0', dark: '#6a8aa8' }
const EMBER = '#e2803a'
const FLAME_CORE = '#ffd27a'
const GLOW = '#fff1c4'
const WINDOW_LIGHT = '#ffc56b'
const DOORWAY = '#1a120c'
const WHITE = '#ffffff'

const shaded = (tones: Ramp, cx: number, halfWidth: number) => litFromLeft(tones, cx, halfWidth)
const mirrored = (points: readonly Point[]): Point[] => points.map(([x, y]) => [ITEM_SPRITE_SIZE - x, y])

function flames(grid: PixelGrid, left: number, right: number, bottom: number, top: number): void {
  const mid = (left + right) / 2
  grid.polygon(
    [
      [left, bottom],
      [left + 2, top + 8],
      [mid - 1, top + 6],
      [mid, top],
      [mid + 2, top + 6],
      [right - 2, top + 4],
      [right, bottom],
    ],
    EMBER,
  )
  grid.polygon(
    [
      [left + 2, bottom],
      [mid - 1, top + 7],
      [mid, top + 4],
      [mid + 1, top + 7],
      [right - 2, bottom],
    ],
    FLAME_CORE,
  )
  grid.rect(Math.floor(mid), bottom - 3, Math.floor(mid), bottom - 2, GLOW)
}

// ── Buildings ───────────────────────────────────────────────────────────────

function pine(grid: PixelGrid): void {
  const needles: Ramp = { light: '#5a8a5a', base: '#2f5a3a', dark: '#1c3a26' }
  grid.rect(11, 18, 12, 22, WOOD.base)
  for (const [top, base, halfWidth] of [[2, 10, 6], [6, 14, 7.5], [10, 19, 9]] as const) {
    grid.polygon(
      [
        [12, top],
        [12 - halfWidth, base],
        [12 + halfWidth, base],
      ],
      shaded(needles, 12, halfWidth),
    )
  }
  for (const [x, y] of [[9, 9], [7, 13], [10, 16], [14, 12]] as const) {
    grid.set(x, y, needles.light)
  }
}

function banner(grid: PixelGrid): void {
  grid.rect(5, 2, 5, 22, WOOD.base)
  grid.set(5, 1, GOLD.base)
  grid.polygon(
    [
      [6, 3],
      [19, 3],
      [19, 14],
      [15.5, 11.5],
      [12.5, 14.5],
      [9.5, 11.5],
      [6, 14],
    ],
    shaded(BANNER_RED, 12.5, 6.5),
  )
  for (const [x, y] of [[12, 6], [11, 7], [12, 7], [13, 7], [12, 8]] as const) {
    grid.set(x, y, GOLD.base)
  }
}

function wall(grid: PixelGrid): void {
  grid.rect(2, 8, 21, 21, shaded(STONE, 12, 10))
  for (const left of [2, 9, 17]) {
    grid.rect(left, 5, left + 4, 8, shaded(STONE, left + 2, 2.5))
  }
  for (const y of [12, 16]) {
    grid.rect(2, y, 21, y, STONE.dark)
  }
  for (const [x, y0, y1] of [[7, 9, 11], [14, 9, 11], [10, 13, 15], [17, 13, 15], [6, 17, 21], [13, 17, 21]] as const) {
    grid.rect(x, y0, x, y1, STONE.dark)
  }
}

function bonfire(grid: PixelGrid): void {
  grid.ellipse(12, 20, 9, 2.6, STONE.base)
  grid.line(5, 20, 18, 16, WOOD.base)
  grid.line(5, 21, 18, 17, WOOD.dark)
  grid.line(18, 20, 5, 16, WOOD.light)
  grid.line(18, 21, 5, 17, WOOD.dark)
  flames(grid, 7, 17, 18, 5)
  for (const [x, y] of [[8, 4], [16, 3], [12, 1]] as const) {
    grid.set(x, y, EMBER)
  }
}

function hut(grid: PixelGrid): void {
  const mud: Ramp = { light: '#b08a5e', base: '#8a6a46', dark: '#5e4630' }
  const straw: Ramp = { light: '#e8c878', base: '#c8a050', dark: '#8a6a30' }
  grid.rect(5, 12, 18, 21, shaded(mud, 11.5, 7))
  grid.polygon(
    [
      [2, 13.5],
      [12, 3],
      [22, 13.5],
    ],
    shaded(straw, 12, 10),
  )
  for (const [x0, y0, x1, y1] of [[6, 11, 10, 7], [10, 12, 13, 6], [15, 12, 17, 8]] as const) {
    grid.line(x0, y0, x1, y1, straw.dark)
  }
  grid.rect(9, 15, 12, 21, DOORWAY)
  grid.rect(15, 15, 16, 16, WINDOW_LIGHT)
}

function fountain(grid: PixelGrid): void {
  grid.ellipse(12, 18.5, 9.5, 3.5, shaded(STONE, 12, 9.5))
  grid.ellipse(12, 17.5, 7.5, 2, '#4a86c8')
  grid.rect(11, 8, 12, 17, STONE.base)
  grid.ellipse(12, 8, 4.5, 1.6, shaded(STONE, 12, 4.5))
  grid.rect(11, 5, 12, 7, '#7ab8f0')
  for (const [x, y] of [[9, 7], [15, 7], [8, 10], [16, 10], [7, 13], [17, 13]] as const) {
    grid.set(x, y, '#a8d8ff')
  }
  grid.set(10, 17, WHITE)
}

function tent(grid: PixelGrid): void {
  grid.polygon(
    [
      [2, 21.5],
      [12, 4],
      [22, 21.5],
    ],
    (x) => (Math.floor(x / 3) % 2 ? BANNER_RED.base : '#e8dcc0'),
  )
  grid.polygon(
    [
      [9.5, 21.5],
      [12, 13],
      [14.5, 21.5],
    ],
    DOORWAY,
  )
  grid.rect(12, 1, 12, 4, WOOD.base)
  grid.polygon(
    [
      [12.5, 1],
      [16, 2],
      [12.5, 3],
    ],
    BANNER_RED.base,
  )
}

function watchtower(grid: PixelGrid): void {
  grid.rect(7, 7, 16, 22, shaded(STONE, 11.5, 4.5))
  grid.rect(5, 5, 18, 7, shaded(WOOD, 11.5, 6.5))
  grid.polygon(
    [
      [5, 5.5],
      [11.5, 0],
      [18, 5.5],
    ],
    shaded(BANNER_RED, 11.5, 6.5),
  )
  grid.rect(11, 10, 12, 13, DOORWAY)
  grid.set(11, 11, WINDOW_LIGHT)
  grid.rect(10, 18, 13, 22, DOORWAY)
  grid.rect(7, 15, 16, 15, STONE.dark)
}

function forge(grid: PixelGrid): void {
  grid.polygon(
    [
      [3, 12],
      [8, 11],
      [19, 11],
      [19, 14],
      [15, 15],
      [14, 18],
      [17, 21],
      [7, 21],
      [10, 18],
      [9, 15],
      [6, 14],
    ],
    shaded(BLACK_STEEL, 11, 8),
  )
  grid.rect(8, 11, 18, 11, '#7a7a84')
  grid.line(14, 9, 19, 2, WOOD.base)
  grid.rect(11, 6, 15, 9, shaded(STEEL, 13, 2.5))
  for (const [x, y] of [[6, 8], [9, 6], [17, 9], [20, 7], [8, 4]] as const) {
    grid.set(x, y, EMBER)
  }
  grid.set(7, 10, FLAME_CORE)
}

function chapel(grid: PixelGrid): void {
  grid.rect(5, 12, 18, 22, shaded(STONE, 11.5, 6.5))
  grid.polygon(
    [
      [3, 12.5],
      [11.5, 5],
      [20, 12.5],
    ],
    shaded({ light: '#6a6e82', base: '#4a4e62', dark: '#2e3242' }, 11.5, 8.5),
  )
  grid.rect(10, 2, 13, 6, shaded(STONE, 11.5, 2))
  grid.rect(11, -1, 12, 1, GOLD.base)
  grid.rect(10, 0, 13, 0, GOLD.base)
  grid.ellipse(11.5, 14.5, 1.8, 1.8, '#8a55c8')
  grid.set(11, 14, FLAME_CORE)
  grid.rect(10, 18, 13, 22, DOORWAY)
}

function roost(grid: PixelGrid): void {
  const twig: Ramp = { light: '#8a6a46', base: '#5e4630', dark: '#3a2a1c' }
  grid.ellipse(9, 14, 2.8, 3.4, shaded({ light: '#c0503a', base: '#8a2a20', dark: '#541814' }, 9, 2.8))
  grid.ellipse(15, 13, 3, 3.8, shaded({ light: '#9a6ad0', base: '#5a3a8a', dark: '#36205a' }, 15, 3))
  grid.set(8, 13, FLAME_CORE)
  grid.set(14, 11, '#e0c8ff')
  grid.ellipse(12, 18.5, 10, 4, shaded(twig, 12, 10))
  for (const [x0, y0, x1, y1] of [[3, 17, 9, 20], [10, 21, 17, 17], [15, 21, 21, 18], [5, 20, 12, 16]] as const) {
    grid.line(x0, y0, x1, y1, twig.dark)
  }
}

function keep(grid: PixelGrid): void {
  for (const [left, right] of [[1, 5], [18, 22]] as const) {
    grid.rect(left, 10, right, 22, shaded(STONE, (left + right) / 2, 2.5))
    grid.rect(left, 8, left + 1, 9, STONE.base)
    grid.rect(right - 1, 8, right, 9, STONE.dark)
  }
  grid.rect(6, 6, 17, 22, shaded(STONE, 11.5, 6))
  for (const x of [6, 9, 12, 15]) {
    grid.rect(x, 4, x + 1, 5, STONE.base)
  }
  grid.ellipse(11.5, 19, 2.6, 3, DOORWAY)
  grid.rect(9, 19, 14, 22, DOORWAY)
  grid.rect(9, 10, 10, 12, WINDOW_LIGHT)
  grid.rect(13, 10, 14, 12, WINDOW_LIGHT)
  grid.rect(11, -1, 11, 4, WOOD.base)
  grid.polygon(
    [
      [12, -1],
      [16, 0.5],
      [12, 2],
    ],
    BANNER_RED.base,
  )
}

function colossus(grid: PixelGrid): void {
  grid.rect(5, 19, 18, 22, shaded(STONE, 11.5, 6.5))
  grid.polygon(
    [
      [8.5, 8],
      [14.5, 8],
      [16, 19],
      [7, 19],
    ],
    shaded(GOLD, 11.5, 4),
  )
  grid.ellipse(11.5, 5, 2.6, 2.8, shaded(GOLD, 11.5, 2.6))
  grid.line(14, 9, 18, 4, GOLD.base)
  grid.line(18, 4, 21, 0, STEEL.light)
  grid.line(9, 9, 6, 14, GOLD.dark)
  for (const [x, y] of [[4, 4], [20, 9], [3, 12]] as const) {
    grid.set(x, y, WHITE)
  }
}

// ── Gear ────────────────────────────────────────────────────────────────────

function lantern(grid: PixelGrid): void {
  for (const [x, y] of [[9, 4], [10, 3], [13, 3], [14, 4]] as const) {
    grid.set(x, y, '#3a3226')
  }
  grid.rect(11, 3, 12, 3, '#3a3226')
  grid.polygon(
    [
      [7, 7],
      [12, 4.5],
      [17, 7],
    ],
    GOLD.dark,
  )
  grid.rect(7, 7, 16, 20, '#5a4520')
  grid.rect(8, 9, 15, 18, WINDOW_LIGHT)
  grid.rect(10, 12, 13, 16, GLOW)
  grid.rect(7, 20, 16, 21, GOLD.dark)
}

function plagueMask(grid: PixelGrid): void {
  grid.ellipse(12, 9, 7, 6, shaded(LEATHER, 12, 7))
  grid.polygon(
    [
      [8.5, 11],
      [15.5, 11],
      [13, 22.5],
      [11.5, 22.5],
    ],
    shaded(LEATHER, 12, 3.5),
  )
  for (const cx of [8.5, 15.5]) {
    grid.ellipse(cx, 8, 2.6, 2.6, GOLD.dark)
    grid.ellipse(cx, 8, 1.7, 1.7, '#1c2a24')
    grid.set(Math.floor(cx) - 1, 7, '#7fa898')
  }
  grid.line(11, 13, 11, 20, LEATHER.light)
}

function hornedHelm(grid: PixelGrid): void {
  const horn: Point[] = [[7, 11], [4, 7], [2, 2], [2, 0], [5, 4], [8, 8], [9, 12]]
  grid.polygon(horn, (_x, y) => (y < 4 ? BONE.light : BONE.base))
  grid.polygon(mirrored(horn), (_x, y) => (y < 4 ? BONE.base : BONE.dark))
  grid.ellipse(12, 14, 7.5, 7, (x, y) => (y <= 15 ? shaded(STEEL, 12, 7.5)(x, y) : null))
  grid.rect(5, 14, 6, 21, STEEL.base)
  grid.rect(18, 14, 19, 21, STEEL.dark)
  grid.rect(11, 13, 12, 20, STEEL.dark)
  grid.rect(5, 15, 19, 15, STEEL.dark)
  grid.set(8, 10, WHITE)
}

function blackPlate(grid: PixelGrid): void {
  grid.polygon(
    [
      [4, 4],
      [9, 3],
      [12, 6],
      [15, 3],
      [20, 4],
      [21, 10],
      [18, 21],
      [12, 23],
      [6, 21],
      [3, 10],
    ],
    shaded(BLACK_STEEL, 12, 8.5),
  )
  grid.line(12, 7, 12, 22, BLACK_STEEL.dark)
  for (const [x, y] of [[2, 3], [3, 2], [21, 3], [20, 2]] as const) {
    grid.set(x, y, BLACK_STEEL.base)
  }
  for (const [x, y] of [[7, 9], [8, 10], [16, 13], [15, 14], [9, 17], [14, 19]] as const) {
    grid.set(x, y, EMBER)
  }
  grid.set(6, 6, BLACK_STEEL.light)
}

function flameSword(grid: PixelGrid): void {
  for (let step = 0; step <= 13; step++) {
    const color = step > 9 ? GLOW : step > 5 ? '#ffb347' : EMBER
    grid.set(7 + step, 16 - step, color)
    grid.set(8 + step, 16 - step, color)
  }
  for (const [x, y] of [[10, 10], [14, 8], [17, 3], [12, 15], [18, 6], [21, 1]] as const) {
    grid.set(x, y, EMBER)
  }
  grid.line(3, 15, 9, 21, BLACK_STEEL.base)
  grid.line(4, 15, 10, 21, BLACK_STEEL.light)
  grid.line(2, 22, 6, 18, WOOD.dark)
  grid.set(1, 23, '#c0392b')
}

function scythe(grid: PixelGrid): void {
  grid.line(6, 23, 15, 2, WOOD.base)
  grid.line(7, 23, 16, 2, WOOD.dark)
  grid.polygon(
    [
      [16, 1],
      [17, 3.5],
      [10, 4],
      [4, 7],
      [1, 11],
      [2.5, 6],
      [8, 2],
    ],
    (_x, y) => (y <= 3 ? STEEL.light : STEEL.base),
  )
}

function emberCrown(grid: PixelGrid): void {
  for (const flame of [
    [[3, 14], [5, 6], [7.5, 14]],
    [[7, 14], [10, 2], [12.5, 14]],
    [[11.5, 14], [14, 4], [16.5, 14]],
    [[16, 14], [19, 7], [21, 14]],
  ] as const) {
    grid.polygon(flame, EMBER)
  }
  for (const [x, top] of [[5, 10], [10, 7], [14, 9], [19, 11]] as const) {
    grid.rect(x, top, x, 13, FLAME_CORE)
  }
  grid.rect(3, 14, 20, 19, shaded(GOLD, 11.5, 8.5))
  for (const x of [6, 11, 16]) {
    grid.set(x, 16, '#c0392b')
  }
  grid.rect(3, 19, 20, 19, GOLD.dark)
}

// ── Potions ─────────────────────────────────────────────────────────────────

function vigor(grid: PixelGrid): void {
  grid.ellipse(12, 15.5, 6.5, 6, shaded(GLASS, 12, 6.5))
  grid.ellipse(12, 17, 5.5, 4, shaded({ light: '#ff8a5a', base: '#e04a2a', dark: '#9a2a16' }, 12, 5.5))
  grid.rect(10, 6, 13, 10, shaded(GLASS, 11.5, 2))
  grid.rect(9, 3, 14, 5, WOOD.base)
  for (const [x, y] of [[10, 15], [14, 18], [12, 13]] as const) {
    grid.set(x, y, FLAME_CORE)
  }
  grid.set(8, 13, WHITE)
}

function ancients(grid: PixelGrid): void {
  grid.polygon(
    [
      [12, 7],
      [18, 14],
      [12, 22],
      [6, 14],
    ],
    shaded({ light: '#c8a0ff', base: '#7a4ac8', dark: '#4a2a8a' }, 12, 6),
  )
  grid.line(6, 14, 12, 22, GOLD.dark)
  grid.line(18, 14, 12, 22, GOLD.dark)
  grid.rect(10, 4, 13, 7, shaded(GLASS, 11.5, 2))
  grid.rect(9, 1, 14, 3, GOLD.base)
  for (const [x, y] of [[9, 12], [13, 16], [11, 18], [3, 5], [20, 8], [19, 19]] as const) {
    grid.set(x, y, '#f4e0ff')
  }
}

/** A tallow candle in a brass holder, wax running down its side. */
function respiteCandle(grid: PixelGrid): void {
  grid.ellipse(12, 21, 8, 2.2, shaded(GOLD, 12, 8))
  grid.rect(9, 20, 15, 20, GOLD.dark)
  grid.rect(9, 9, 14, 19, shaded({ light: '#fff4e0', base: '#e8dcc0', dark: '#b8a888' }, 11.5, 3))
  for (const [x, y0, y1] of [[10, 9, 13], [13, 9, 11], [14, 9, 15]] as const) {
    grid.rect(x, y0, x, y1, '#fff8ec')
  }
  grid.rect(11, 7, 12, 8, '#3a3226')
  flames(grid, 9, 15, 7, 0)
}

// ── Scout training ──────────────────────────────────────────────────────────

/** A brass spyglass with one gold pip per rank. */
function spyglass(grid: PixelGrid, rank: number): void {
  for (const [x0, y0, x1, y1, tones] of [
    [3, 17, 8, 12, GOLD],
    [8, 12, 13, 7, { light: '#c89a5a', base: '#8a5e2e', dark: '#5a3a18' }],
    [13, 7, 18, 3, GOLD],
  ] as const) {
    for (let offset = -1; offset <= 1; offset++) {
      grid.line(x0, y0 + offset, x1, y1 + offset, offset < 0 ? tones.light : offset > 0 ? tones.dark : tones.base)
    }
  }
  grid.rect(18, 1, 20, 3, '#a8d8ff')
  grid.set(19, 2, WHITE)
  for (let pip = 0; pip < rank; pip++) {
    const x = 9 + pip * 3
    grid.rect(x, 20, x + 1, 21, GOLD.base)
  }
}

const PAINTERS: Record<string, (grid: PixelGrid) => void> = {
  pine,
  banner,
  wall,
  bonfire,
  hut,
  fountain,
  tent,
  watchtower,
  forge,
  chapel,
  roost,
  keep,
  colossus,
  lantern,
  'plague-mask': plagueMask,
  'horned-helm': hornedHelm,
  'black-plate': blackPlate,
  'flame-sword': flameSword,
  scythe,
  'ember-crown': emberCrown,
  vigor,
  ancients,
  'respite-candle': respiteCandle,
  'scout-1': (grid) => spyglass(grid, 1),
  'scout-2': (grid) => spyglass(grid, 2),
  'scout-3': (grid) => spyglass(grid, 3),
  'scout-4': (grid) => spyglass(grid, 4),
}

/** Paints a shop item or building as a 24×24 pixel icon, or null for an id with no icon. */
export function paintItem(itemId: string): PixelGrid | null {
  const painter = PAINTERS[itemId]
  if (!painter) {
    return null
  }
  const grid = new PixelGrid(ITEM_SPRITE_SIZE)
  painter(grid)
  grid.outline()
  return grid
}
