import { SKIES, bands, isLamplit, orb, relightGrid, speckle, sunPosition, type DayPhase } from './marketPixels'
import { PixelGrid, shade, type Ramp } from './pixel'

/** Each tab sits in its own place, painted as a tall pixel landscape that fills a phone screen. */
export type BackdropTab = 'quests' | 'shop' | 'kingdom' | 'war' | 'pets'

export const BACKDROP_WIDTH = 120
export const BACKDROP_HEIGHT = 260

/** Where land meets sky. */
const HORIZON = 96

type Point = readonly [number, number]

/** Things that keep their own light whatever the time of day. */
interface Lights {
  windows: Point[]
  flames: Point[]
  glows: [number, number, string][]
  /** Only seen in the dark: fireflies, eyes in a cave. */
  nightOnly: [number, number, string][]
}

const STARS: Point[] = [[12, 8], [30, 22], [47, 6], [70, 15], [100, 30], [111, 9], [58, 36], [20, 44], [86, 50]]
const CLOUDS: Point[] = [[30, 24], [92, 40]]
const BIRDS: Point[] = [[40, 34], [46, 30], [52, 36]]

// ── Shared pieces of scenery ────────────────────────────────────────────────

/** A natural skyline: a few overlapping waves, so hills roll instead of zigzagging. */
function ridge(x: number, base: number, height: number, seed: number): number {
  return base - height * (0.55 * Math.sin(x * 0.045 + seed) + 0.3 * Math.sin(x * 0.11 + seed * 2.3) + 0.15 * Math.sin(x * 0.27 + seed * 4.1))
}

/** Fills from a skyline down to the bottom of a layer. */
function layer(grid: PixelGrid, top: (x: number) => number, bottom: number, paint: (x: number, y: number) => string | null): void {
  for (let x = 0; x < BACKDROP_WIDTH; x++) {
    for (let y = Math.round(top(x)); y <= bottom; y++) {
      const color = paint(x, y)
      if (color) {
        grid.set(x, y, color)
      }
    }
  }
}

const LEAVES: Ramp = { light: '#3a5a32', base: '#26402a', dark: '#18281c' }
const DARK_LEAVES: Ramp = { light: '#2c4430', base: '#1c3022', dark: '#121e16' }
const BARK = '#2e2016'

/** A broad-leafed tree: a few overlapping clumps, lit from the upper left, with leafy texture. */
function oak(grid: PixelGrid, x: number, base: number, size: number, leaves: Ramp = LEAVES): void {
  grid.rect(x - 1, base - size, x + 1, base, BARK)
  grid.line(x, Math.round(base - size * 0.8), Math.round(x - size * 0.3), Math.round(base - size * 1.1), BARK)
  const clumps: [number, number, number][] = [
    [x, base - size * 1.35, size * 0.55],
    [x - size * 0.45, base - size * 1.05, size * 0.45],
    [x + size * 0.45, base - size * 1.1, size * 0.5],
    [x, base - size * 0.95, size * 0.45],
  ]
  for (const [cx, cy, radius] of clumps) {
    grid.ellipse(cx, cy, radius, radius * 0.85, (px, py) => {
      const lit = px - cx + (py - cy) * 1.2
      const tone = lit < -radius * 0.45 ? leaves.light : lit > radius * 0.4 ? leaves.dark : leaves.base
      return speckle(px, py, 5) ? shade(tone, -0.12) : tone
    })
  }
}

/** A fir: layered boughs, lit side and shadow side. */
function fir(grid: PixelGrid, x: number, base: number, size: number, leaves: Ramp = DARK_LEAVES): void {
  grid.rect(x, base - size * 0.25, x, base, BARK)
  for (let tier = 0; tier < 4; tier++) {
    const top = base - size + tier * size * 0.2
    const bottom = top + size * 0.38
    const half = size * (0.14 + tier * 0.09)
    grid.polygon([[x, top], [x - half, bottom], [x + half, bottom]], (px) => (px < x ? leaves.base : leaves.dark))
    grid.line(Math.round(x - half * 0.7), Math.round(bottom - 1), Math.round(x - 1), Math.round(top + 2), leaves.light)
  }
}

/** A boulder: rounded, lit from the upper left, with moss on top. */
function boulder(grid: PixelGrid, cx: number, cy: number, rx: number, ry: number, stone = '#3a3836', moss = true): void {
  grid.ellipse(cx, cy, rx, ry, (px, py) => {
    const lit = px - cx + (py - cy) * 1.4
    if (moss && py < cy - ry * 0.45 && !speckle(px, py, 3)) {
      return '#2e4626'
    }
    return lit < -rx * 0.4 ? shade(stone, 0.18) : lit > rx * 0.5 ? shade(stone, -0.25) : stone
  })
}

/** Grass with tufts, and wildflowers scattered through it. */
function meadow(grid: PixelGrid, top: number, near: string, far: string, flowers: readonly string[]): void {
  const paint = bands([[top, far], [Math.round((top + BACKDROP_HEIGHT) / 2), near]])
  grid.rect(0, top, BACKDROP_WIDTH - 1, BACKDROP_HEIGHT - 1, (x, y) => {
    const base = paint(x, y)
    if (speckle(x, y, 13)) {
      return shade(base, 0.14)
    }
    if (speckle(x + 3, y, 17)) {
      return shade(base, -0.12)
    }
    return base
  })
  // Flowers grow bigger and denser toward the viewer
  for (let y = top + 6; y < BACKDROP_HEIGHT; y += 3) {
    for (let x = 0; x < BACKDROP_WIDTH; x++) {
      if (speckle(x, y, Math.max(90, 260 - (y - top)))) {
        grid.set(x, y, flowers[(x + y) % flowers.length])
      }
    }
  }
}

/** A drifting bank of mist, thinning to a dither at its edges. */
function mist(grid: PixelGrid, y: number, height: number, color: string): void {
  for (let row = 0; row < height; row++) {
    const edge = Math.min(row, height - 1 - row)
    for (let x = 0; x < BACKDROP_WIDTH; x++) {
      if ((x + row * 2) % (edge >= 2 ? 3 : 6) === 0) {
        grid.set(x, y + row, color)
      }
    }
  }
}

function sky(grid: PixelGrid, phase: DayPhase, hour: number): void {
  if (phase === 'night') {
    for (const [x, y] of STARS) {
      if (!grid.get(x, y)) {
        grid.set(x, y, '#8a8498')
      }
    }
    orb(grid, [88, 24], 5.5, '#e6dfcc', '#1d1a2e')
  } else {
    if (phase === 'day') {
      const [x, y] = sunPosition(hour)
      orb(grid, [Math.round((x / 200) * BACKDROP_WIDTH), y + 6], 4.5, '#fff6d8', '#a8d0f0')
      for (const [cx, cy] of CLOUDS) {
        const puff = (px: number, py: number) => (grid.get(px, py) ? null : py > cy + 1 ? '#d4e2ee' : '#f4f8fc')
        grid.ellipse(cx, cy, 8, 3, puff)
        grid.ellipse(cx - 3, cy - 2, 4.5, 3, puff)
      }
    } else {
      orb(grid, phase === 'dawn' ? [24, 74] : [96, 76], 6, phase === 'dawn' ? '#ffe0a8' : '#ff9a4a', phase === 'dawn' ? '#f8c890' : '#e8743a')
    }
    // A few birds wheeling overhead
    for (const [x, y] of BIRDS) {
      for (const [dx, dy] of [[-1, -1], [0, 0], [1, -1]] as const) {
        if (!grid.get(x + dx, y + dy)) {
          grid.set(x + dx, y + dy, '#1a1622')
        }
      }
    }
  }
  const stops = SKIES[phase].map(([y, color]) => [Math.round((y * HORIZON) / 58), color] as const)
  const paintSky = bands(stops)
  grid.rect(0, 0, BACKDROP_WIDTH - 1, HORIZON, (x, y) => (grid.get(x, y) ? null : paintSky(x, y)))
}

/** Distant mountains, pale and blue with distance, with snow on the peaks. */
function mountains(grid: PixelGrid, base: number, height: number, seed: number, snow: boolean): void {
  layer(
    grid,
    (x) => ridge(x, base, height, seed) - Math.abs(Math.sin(x * 0.09 + seed)) * height * 0.5,
    HORIZON + 4,
    (x, y) => {
      const top = ridge(x, base, height, seed) - Math.abs(Math.sin(x * 0.09 + seed)) * height * 0.5
      if (snow && y - top < 3) {
        return '#8a90a8'
      }
      return (x + y) % 7 === 0 ? '#323a52' : '#2a3048'
    },
  )
}

/** A line of distant trees along a ridge, as a soft bumpy silhouette. */
function treeline(grid: PixelGrid, base: number, color: string, seed: number): void {
  layer(
    grid,
    (x) => ridge(x, base, 4, seed) - Math.abs(Math.sin(x * 0.7 + seed)) * 3,
    HORIZON + 10,
    (x, y) => (speckle(x, y, 6) ? shade(color, 0.08) : color),
  )
}

// ── Quests: a forest trail at the edge of the woods ─────────────────────────

function quests(grid: PixelGrid): void {
  mountains(grid, 70, 14, 1.3, true)
  treeline(grid, 86, '#1e2e28', 0.4)
  layer(grid, (x) => ridge(x, 94, 5, 2.2), HORIZON + 14, (x, y) => (speckle(x, y, 8) ? '#24382a' : '#1e3024'))
  meadow(grid, HORIZON + 6, '#203a22', '#24402a', ['#d8d0b8', '#e8c860', '#8aa0d8', '#d88aa0'])

  // The trail winds out of the woods on the left and down toward you
  for (let y = HORIZON + 8; y < BACKDROP_HEIGHT; y++) {
    const depth = (y - HORIZON) / (BACKDROP_HEIGHT - HORIZON)
    const middle = 34 + 36 * depth + 10 * Math.sin(depth * 6)
    const half = 1 + depth * 18
    for (let x = Math.round(middle - half); x <= Math.round(middle + half); x++) {
      const ragged = Math.abs(x - middle) > half - 1 && speckle(x, y, 2)
      grid.set(x, y, ragged ? '#2a3a22' : speckle(x, y, 6) ? '#4e4030' : speckle(x + 1, y, 11) ? '#2e2418' : '#3e3226')
    }
  }
  // The edge of the woods
  fir(grid, 6, 132, 46)
  fir(grid, 18, 124, 38)
  oak(grid, 30, 128, 16, DARK_LEAVES)
  fir(grid, 112, 150, 52)
  oak(grid, 96, 120, 12)
  oak(grid, 104, 236, 26)
  boulder(grid, 74, 170, 7, 4.5)
  boulder(grid, 14, 214, 9, 6)
  boulder(grid, 58, 130, 3, 2)
}

// ── Kingdom: a river valley, your castle on the hill ────────────────────────

function kingdom(grid: PixelGrid, lights: Lights): void {
  mountains(grid, 66, 18, 4.2, true)
  treeline(grid, 84, '#1c2c26', 1.7)
  // The castle on a green hill to the right
  layer(grid, (x) => ridge(x, 98, 10, 0.6) - (x > 60 ? (x - 60) * 0.18 : 0), HORIZON + 20, (x, y) => (speckle(x, y, 8) ? '#26402a' : '#203624'))
  const stone = '#3a3640'
  const lit = (x: number) => (x < 86 ? shade(stone, 0.1) : stone)
  grid.rect(78, 66, 102, 84, lit)
  grid.rect(84, 54, 96, 84, lit)
  for (const [left, right] of [[74, 79], [101, 106]] as const) {
    grid.rect(left, 60, right, 84, lit)
    grid.polygon([[left - 1, 60], [(left + right) / 2, 50], [right + 1, 60]], '#4a2a2e')
  }
  for (let x = 78; x <= 102; x += 3) {
    grid.rect(x, 64, x + 1, 65, stone)
  }
  for (let x = 84; x <= 96; x += 3) {
    grid.rect(x, 52, x + 1, 53, stone)
  }
  grid.rect(89, 78, 91, 84, '#0e0a0c')
  grid.rect(90, 40, 90, 52, '#3a2818')
  grid.rect(91, 40, 96, 43, '#9a2a22')
  lights.windows.push([87, 60], [93, 60], [76, 66], [103, 66], [81, 72], [99, 72])

  meadow(grid, HORIZON + 4, '#1e3820', '#26422a', ['#e8c860', '#d8d0b8', '#d88aa0'])
  // The river winds down the valley toward you, catching the light
  for (let y = HORIZON + 2; y < BACKDROP_HEIGHT; y++) {
    const depth = (y - HORIZON) / (BACKDROP_HEIGHT - HORIZON)
    const middle = 60 - 30 * depth + 14 * Math.sin(depth * 7 + 0.5)
    const half = 1 + depth * 14
    for (let x = Math.round(middle - half - 1); x <= Math.round(middle + half + 1); x++) {
      const bank = Math.abs(x - middle) > half
      grid.set(x, y, bank ? '#3a3226' : (x * 3 + y * 5) % 23 === 0 ? '#6a8aa8' : speckle(x, y, 5) ? '#2a4a62' : '#22405a')
    }
  }
  // A stone bridge across the river
  const bridgeY = 176
  grid.rect(14, bridgeY - 4, 66, bridgeY + 2, '#4a4648')
  grid.rect(14, bridgeY - 5, 66, bridgeY - 5, '#5a5658')
  grid.ellipse(40, bridgeY + 5, 10, 6, '#22405a')
  for (let x = 16; x <= 64; x += 6) {
    grid.set(x, bridgeY - 1, '#3a3638')
  }
  oak(grid, 10, 132, 16)
  oak(grid, 112, 140, 20)
  oak(grid, 98, 222, 24)
  fir(grid, 4, 250, 44)
  boulder(grid, 80, 200, 6, 4)
}

// ── War: a misty moor, standing stones, armies camped far off ────────────────

function war(grid: PixelGrid, lights: Lights): void {
  mountains(grid, 76, 10, 2.8, false)
  // Far hills where the enemy camps; their fires dot the ridge
  layer(grid, (x) => ridge(x, 90, 4, 5.1), HORIZON + 10, (x, y) => (speckle(x, y, 9) ? '#2a2630' : '#24202a'))
  for (const x of [14, 22, 31, 70, 78, 92, 104]) {
    const y = Math.round(ridge(x, 90, 4, 5.1)) + 2
    lights.flames.push([x, y])
    grid.polygon([[x + 2, y + 1], [x + 4, y - 2], [x + 6, y + 1]], '#16121a')
  }
  // Heather and moor grass, purple-brown and tough
  const heather = bands([[HORIZON + 4, '#2e2632'], [160, '#2a2a22'], [215, '#24241c']])
  grid.rect(0, HORIZON + 4, BACKDROP_WIDTH - 1, BACKDROP_HEIGHT - 1, (x, y) => {
    const base = heather(x, y)
    return speckle(x, y, 11) ? '#3e2e44' : speckle(x + 2, y, 15) ? shade(base, 0.12) : base
  })
  // A ring of standing stones on a low rise, two of them capped with a lintel
  layer(grid, (x) => 140 - 10 * Math.exp(-(((x - 58) / 32) ** 2)), 156, (x, y) => (speckle(x, y, 9) ? '#30302a' : '#2a2a24'))
  for (const [x, height, width] of [[22, 16, 5], [40, 24, 6], [58, 24, 6], [78, 20, 6], [96, 14, 5]] as const) {
    const base = 134
    grid.rect(x - width / 2, base - height, x + width / 2, base, (px, py) => {
      const edge = px <= x - width / 2 + 1 ? 0.18 : px >= x + width / 2 - 1 ? -0.24 : 0
      return py > base - 4 && speckle(px, py, 2) ? '#3a4632' : shade('#4e4e52', edge)
    })
  }
  grid.rect(36, 106, 62, 109, (px, py) => (py === 106 ? '#626266' : px < 44 ? '#56565a' : '#4a4a4e'))
  // A dead tree with crows, and rocks in the heather
  grid.line(104, 200, 106, 162, '#1e1612')
  grid.line(105, 176, 96, 166, '#1e1612')
  grid.line(106, 170, 114, 160, '#1e1612')
  grid.line(100, 170, 98, 164, '#1e1612')
  for (const [x, y] of [[95, 165], [113, 159]] as const) {
    grid.rect(x, y - 1, x + 1, y, '#0e0c10')
  }
  boulder(grid, 22, 196, 8, 5, '#3a3a3c', false)
  boulder(grid, 70, 228, 11, 6, '#3a3a3c', false)
  mist(grid, 116, 6, '#4a4658')
  mist(grid, 150, 8, '#46425a')
}

// ── Pets: a deep forest glade with a waterfall ──────────────────────────────

function pets(grid: PixelGrid, lights: Lights): void {
  treeline(grid, 74, '#18261e', 3.3)
  meadow(grid, HORIZON + 8, '#1a2e1a', '#203a22', ['#c8d8a0', '#8ab878'])
  // A mossy cliff in the middle of the glade, the waterfall pouring down its face
  const cliff: Point[] = [[26, HORIZON + 32], [30, 76], [38, 60], [50, 52], [70, 52], [82, 60], [90, 76], [94, HORIZON + 32]]
  grid.polygon(cliff, (x, y) => {
    if (Math.abs(x - 60) <= 5 && y > 52) {
      return (y + x * 3) % 5 === 0 ? '#c8d8e8' : (x + y) % 3 === 0 ? '#8aa8c8' : '#a8c0d8'
    }
    if (y < 58 || speckle(x, y, 4)) {
      return '#2e4626'
    }
    return (x + y * 2) % 11 === 0 ? '#28282a' : shade('#3a3a36', x < 60 ? 0.1 : -0.08)
  })
  // The pool at the bottom, rippling, and a little cave beside the falls
  grid.ellipse(60, HORIZON + 24, 28, 7, (x, y) => ((x + y * 3) % 9 === 0 ? '#8aa8c8' : '#2a4a62'))
  grid.ellipse(40, HORIZON + 6, 5, 6, (_x, y) => (y >= HORIZON + 2 ? '#060806' : null))
  lights.nightOnly.push([38, HORIZON + 5, '#ffe08a'], [42, HORIZON + 5, '#ffe08a'])
  // Great trees framing the glade, ferns, and mossy rocks
  fir(grid, 8, 140, 70)
  oak(grid, 4, 190, 40, DARK_LEAVES)
  fir(grid, 112, 150, 76)
  oak(grid, 116, 206, 44, DARK_LEAVES)
  for (const [x, y] of [[30, 160], [86, 172], [48, 214], [100, 236], [18, 236]] as const) {
    for (const lean of [-4, -2, 0, 2, 4]) {
      grid.line(x, y, x + lean, y - 6 + Math.round(Math.abs(lean) / 2), '#2e5a2e')
    }
  }
  boulder(grid, 70, 150, 9, 5)
  boulder(grid, 24, 196, 7, 4)
  boulder(grid, 80, 248, 12, 7)
  // Glowing mushrooms in the moss, and fireflies after dark
  for (const [x, y, color] of [[22, 168, '#5ad8e0'], [26, 170, '#b07ae8'], [92, 160, '#5ad8e0'], [60, 226, '#5ad8e0'], [96, 214, '#b07ae8']] as const) {
    grid.rect(x, y - 2, x, y, '#c8c0b0')
    lights.glows.push([x, y - 3, color])
  }
  for (const [x, y] of [[40, 130], [76, 120], [52, 176], [90, 196], [30, 220]] as const) {
    lights.nightOnly.push([x, y, '#e8f08a'])
  }
}

// ── Merchant: the cobbled street below Wick's stall ─────────────────────────

function shop(grid: PixelGrid): void {
  // Cobbles of uneven size, each its own shade, with clipped corners, worn tops, and moss in the gaps
  const tones = [-0.16, -0.08, 0, 0.06, 0.12]
  let top = 0
  for (let row = 0; top < BACKDROP_HEIGHT; row++) {
    const height = 7 + ((row * 5) % 3)
    let left = -((row * 7) % 11)
    for (let stone = 0; left < BACKDROP_WIDTH; stone++) {
      const width = 10 + ((stone * 3 + row * 5) % 5)
      const base = shade('#2c2622', tones[(stone * 7 + row * 11) % tones.length])
      const [x0, y0, x1, y1] = [left + 1, top + 1, left + width - 1, top + height - 1]
      grid.rect(x0, y0, x1, y1, (x, y) => {
        const corner = (x === x0 || x === x1) && (y === y0 || y === y1)
        return corner ? null : y === y0 ? shade(base, 0.14) : y === y1 ? shade(base, -0.12) : base
      })
      left += width
    }
    top += height
  }
  grid.rect(0, 0, BACKDROP_WIDTH - 1, BACKDROP_HEIGHT - 1, (x, y) => (grid.get(x, y) ? null : speckle(x, y, 3) ? '#22341e' : '#120e0b'))
  // Weeds pushing up between the stones, a puddle, and a dropped leaflet
  for (const [x, y] of [[8, 40], [96, 66], [30, 120], [104, 180], [52, 230], [14, 250]] as const) {
    grid.line(x, y, x - 1, y - 3, '#3a5a2e')
    grid.line(x, y, x + 2, y - 2, '#2e4a26')
  }
  grid.ellipse(84, 150, 14, 4, '#1e2a36')
  grid.rect(78, 149, 86, 149, '#4a5a6a')
  grid.polygon([[22, 200], [30, 197], [32, 203], [24, 206]], '#8a7a62')
  grid.line(24, 201, 29, 199, '#5a4a3a')
}

/** Paints a tab's backdrop for the time of day. Lit windows, fires, and glowing mushrooms keep their own light. */
export function paintBackdrop(tab: BackdropTab, phase: DayPhase, hour: number): PixelGrid {
  const grid = new PixelGrid(BACKDROP_WIDTH, BACKDROP_HEIGHT)
  const lights: Lights = { windows: [], flames: [], glows: [], nightOnly: [] }
  if (tab === 'quests') {
    quests(grid)
  } else if (tab === 'kingdom') {
    kingdom(grid, lights)
  } else if (tab === 'war') {
    war(grid, lights)
  } else if (tab === 'pets') {
    pets(grid, lights)
  } else {
    shop(grid)
  }
  relightGrid(grid, phase)
  if (isLamplit(phase)) {
    for (const [x, y] of lights.windows) {
      grid.set(x, y, '#ffc070')
    }
    for (const [x, y, color] of lights.nightOnly) {
      grid.set(x, y, color)
    }
  }
  for (const [x, y] of lights.flames) {
    grid.set(x, y, '#ffd27a')
    grid.set(x, y + 1, '#e2803a')
  }
  for (const [x, y, color] of lights.glows) {
    grid.rect(x - 1, y, x + 1, y, color)
    grid.set(x, y - 1, shade(color, 0.4))
  }
  if (tab !== 'shop') {
    sky(grid, phase, hour)
  }
  return grid
}
