import { PixelGrid, shade } from './pixel'

/** The night market is painted at half the scene's size: each pixel covers 2×2 units of the 400×360 scene. */
export const MARKET_WIDTH = 200
export const MARKET_HEIGHT = 180
export const MARKET_PIXEL = 2

type Point = readonly [number, number]

/** A repeatable scatter for texture: true for roughly one pixel in `every`. */
export function speckle(x: number, y: number, every: number): boolean {
  return (((x * 73856093) ^ (y * 19349663)) >>> 0) % every === 0
}

/**
 * Colour bands along one axis, each starting at its position. The two pixels either side of a boundary are dithered
 * in a checkerboard, which is how pixel art blends without gradients.
 */
export function bands(stops: readonly (readonly [number, string])[], axis: 'x' | 'y' = 'y'): (x: number, y: number) => string {
  return (x, y) => {
    const along = axis === 'y' ? y : x
    let index = 0
    while (index + 1 < stops.length && along >= stops[index + 1][0]) {
      index++
    }
    const checker = (x + y) % 2 === 0
    const next = stops[index + 1]
    if (next && along === next[0] - 1 && checker) {
      return next[1]
    }
    if (index > 0 && along === stops[index][0] && checker) {
      return stops[index - 1][1]
    }
    return stops[index][1]
  }
}

/** Copies a sprite's pixels onto a bigger grid, optionally flipped left to right. */
function stamp(target: PixelGrid, sprite: PixelGrid, left: number, top: number, flipped = false): void {
  for (let y = 0; y < sprite.height; y++) {
    for (let x = 0; x < sprite.width; x++) {
      const color = sprite.get(x, y)
      if (color) {
        target.set(left + (flipped ? sprite.width - 1 - x : x), top + y, color)
      }
    }
  }
}

/** A two-pixel-thick beam of timber. */
function beam(grid: PixelGrid, x0: number, y0: number, x1: number, y1: number, color: string): void {
  grid.line(x0, y0, x1, y1, color)
  if (x0 === x1) {
    grid.line(x0 + 1, y0, x1 + 1, y1, color)
  } else {
    grid.line(x0, y0 + 1, x1, y1 + 1, color)
  }
}

/** Draws a pixel sprite from rows of letters, one colour per letter; dots are empty. */
function fromRows(rows: readonly string[], colors: Record<string, string>): PixelGrid {
  const grid = new PixelGrid(rows[0].length, rows.length)
  rows.forEach((row, y) =>
    [...row].forEach((letter, x) => {
      if (colors[letter]) {
        grid.set(x, y, colors[letter])
      }
    }),
  )
  return grid
}

// ── Time of day ─────────────────────────────────────────────────────────────

/** The market follows the phone's clock: dawn, day with the sun crossing the sky, dusk, then night. */
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'

export function dayPhase(hour: number): DayPhase {
  if (hour >= 5 && hour < 7) {
    return 'dawn'
  }
  if (hour >= 7 && hour < 18) {
    return 'day'
  }
  return hour >= 18 && hour < 20 ? 'dusk' : 'night'
}

/** Lamps, lit windows, and fog belong to the dark hours. */
export const isLamplit = (phase: DayPhase) => phase !== 'day'

/**
 * Everything is drawn in night colours, then lit for the time of day: a gamma below 1 lifts dark colours far more than
 * bright ones, so shadows open up without washing out, and the tint warms dawn and dusk.
 */
const LIGHTING: Record<DayPhase, { gamma: number; tint: readonly [number, number, number] }> = {
  night: { gamma: 1, tint: [1, 1, 1] },
  dawn: { gamma: 0.78, tint: [1.04, 0.94, 0.98] },
  day: { gamma: 0.58, tint: [1, 1, 1.03] },
  dusk: { gamma: 0.8, tint: [1.1, 0.88, 0.78] },
}

export function relight(color: string, phase: DayPhase): string {
  if (phase === 'night') {
    return color
  }
  const { gamma, tint } = LIGHTING[phase]
  return `#${[1, 3, 5]
    .map((start, channel) => {
      const value = parseInt(color.slice(start, start + 2), 16) / 255
      return Math.min(255, Math.round(255 * value ** gamma * tint[channel]))
        .toString(16)
        .padStart(2, '0')
    })
    .join('')}`
}

export function relightGrid(grid: PixelGrid, phase: DayPhase): void {
  grid.cells.forEach((color, index) => {
    if (color) {
      grid.cells[index] = relight(color, phase)
    }
  })
}

export const SKIES: Record<DayPhase, readonly (readonly [number, string])[]> = {
  night: [[0, '#0b0a17'], [22, '#110e1f'], [38, '#191326'], [50, '#231725'], [60, '#2f1b20']],
  dawn: [[0, '#2c2a52'], [16, '#4a3a66'], [28, '#7a4a6e'], [38, '#b0606a'], [46, '#e08a6a'], [54, '#f4b47a']],
  day: [[0, '#3a78c8'], [14, '#4a88d0'], [26, '#5c98d8'], [38, '#74aae0'], [50, '#90bee6']],
  dusk: [[0, '#1c1838'], [14, '#36264e'], [26, '#5e3456'], [36, '#9a4450'], [44, '#d0623e'], [52, '#f08a3a']],
}

// ── The far side of the street: a row of houses, the sky above, cobbles below ──

/** The houses across the street: left edge, right edge, wall top, roof shape, wall colour. */
const FAR_HOUSES = [
  [0, 30, 52, 'gable', '#2a1f24'],
  [30, 52, 60, 'flat', '#241c26'],
  [52, 78, 48, 'gable', '#2e2228'],
  [78, 96, 56, 'flat', '#26202a'],
  [96, 122, 46, 'gable', '#2a1e22'],
  [122, 146, 54, 'gable', '#2c2026'],
  [146, 170, 50, 'flat', '#241c22'],
  [170, 200, 58, 'gable', '#2a2026'],
] as const

/** Where the far houses meet the pavement, and where the walkers' feet are. */
export const FAR_STREET_LINE = 100

const MOON: Point = [140, 9]
const STARS: Point[] = [[48, 10], [75, 7], [158, 22], [95, 20], [60, 28], [120, 4], [104, 14]]
const BRIGHT_STARS: Point[] = [[58, 16], [150, 34]]
const CLOUDS: Point[] = [[62, 14], [118, 26]]

/** A sun or moon behind a dithered halo; only fills sky, so it sinks behind the rooftops. */
export function orb(grid: PixelGrid, [cx, cy]: Point, radius: number, face: string, halo: string): void {
  const open = new Set<number>()
  grid.cells.forEach((cell, index) => {
    if (!cell) {
      open.add(index)
    }
  })
  const sky = (paint: (x: number, y: number) => string | null) => (x: number, y: number) => (open.has(y * grid.width + x) ? paint(x, y) : null)
  grid.ellipse(cx, cy, radius + 4.5, radius + 4.5, sky((x, y) => ((x + y) % 2 === 0 ? halo : null)))
  grid.ellipse(cx, cy, radius + 2, radius + 2, sky(() => halo))
  grid.ellipse(cx, cy, radius, radius, sky(() => face))
}

/** Where the sun is at a given hour of daylight: rising on the left, high at noon, setting on the right. */
export function sunPosition(hour: number): Point {
  const progress = Math.min(1, Math.max(0, (hour - 7) / 11))
  return [Math.round(52 + 96 * progress), Math.round(40 - 30 * Math.sin(Math.PI * progress))]
}

function paintSkyObjects(grid: PixelGrid, phase: DayPhase, hour: number): void {
  if (phase === 'night' || phase === 'dusk' || phase === 'dawn') {
    const stars = phase === 'night' ? STARS : STARS.slice(0, 2)
    for (const [x, y] of stars) {
      if (!grid.get(x, y)) {
        grid.set(x, y, phase === 'night' ? '#8a8498' : '#c8b8d8')
      }
    }
  }
  if (phase === 'night') {
    for (const [x, y] of BRIGHT_STARS) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        grid.set(x + dx, y + dy, dx || dy ? '#6a6478' : '#e8e2d0')
      }
    }
    const [moonX, moonY] = MOON
    orb(grid, MOON, 6.5, '#e6dfcc', '#1d1a2e')
    grid.ellipse(moonX, moonY, 6.5, 6.5, (x, y) => (x - moonX + y - moonY > 3 && grid.get(x, y) === '#e6dfcc' ? '#bdb4a0' : null))
    for (const [dx, dy] of [[-3, -2], [-2, -2], [1, 2], [2, -3]] as const) {
      grid.set(Math.floor(moonX) + dx, Math.floor(moonY) + dy, '#c9c1ad')
    }
  } else if (phase === 'day') {
    orb(grid, sunPosition(hour), 5, '#fff6d8', '#a8d0f0')
    for (const [cx, cy] of CLOUDS) {
      const puff = (x: number, y: number) => (grid.get(x, y) ? null : y > cy + 1 ? '#d4e2ee' : '#f4f8fc')
      grid.ellipse(cx, cy, 9, 3.5, puff)
      grid.ellipse(cx - 3, cy - 2, 5, 3.5, puff)
      grid.ellipse(cx + 4, cy - 1, 4, 3, puff)
    }
  } else {
    // Dawn rises behind the left-hand roofs; dusk sets behind the right-hand ones
    orb(grid, phase === 'dawn' ? [58, 46] : [142, 48], 7, phase === 'dawn' ? '#ffe0a8' : '#ff9a4a', phase === 'dawn' ? '#f8c890' : '#e8743a')
  }
}

export function paintFarStreet(phase: DayPhase = 'night', hour = 0): PixelGrid {
  const grid = new PixelGrid(MARKET_WIDTH, MARKET_HEIGHT)
  const litWindows: Point[] = []
  const share = { night: 3, dusk: 4, dawn: 9, day: 0 }[phase]

  for (const [left, right, top, roof, wall] of FAR_HOUSES) {
    grid.rect(left, top, right - 1, FAR_STREET_LINE - 1, (x, y) => (speckle(x, y, 13) ? shade(wall, 0.1) : wall))
    if (roof === 'gable') {
      grid.polygon(
        [[left - 1, top + 1], [(left + right) / 2, top - 10], [right + 1, top + 1]],
        (_x, y) => (y % 3 === 0 ? '#211820' : '#1a1216'),
      )
    } else {
      grid.rect(left, top - 2, right - 1, top - 1, '#1a1216')
      for (let x = left; x < right; x += 4) {
        grid.rect(x, top - 4, x + 1, top - 3, '#1a1216')
      }
    }
    for (let y = top + 6; y < FAR_STREET_LINE - 12; y += 12) {
      for (let x = left + 4; x < right - 5; x += 8) {
        grid.rect(x, y, x + 2, y + 3, '#120c10')
        if (share && speckle(x, y, share)) {
          litWindows.push([x, y])
        }
      }
    }
    const middle = Math.floor((left + right) / 2)
    grid.rect(middle - 2, FAR_STREET_LINE - 8, middle + 2, FAR_STREET_LINE - 1, '#120a0c')
  }
  // The chapel spire behind the middle house
  grid.polygon([[106, 36], [109, 18], [112, 36]], '#1a1216')

  // The pavement, then cobbles in perspective: rows deepen toward the viewer and the joints fan out from the middle
  grid.rect(0, FAR_STREET_LINE, MARKET_WIDTH - 1, FAR_STREET_LINE + 2, (x) => (x % 7 === 0 ? '#1e1816' : '#2a2420'))
  const ground = bands([[FAR_STREET_LINE + 3, '#2c2622'], [125, '#26201c'], [145, '#201b18'], [162, '#1a1613']])
  const stoneTones = [-0.14, -0.06, 0, 0.07]
  let rowTop = FAR_STREET_LINE + 3
  for (let row = 0; rowTop < MARKET_HEIGHT; row++) {
    const rowHeight = 2 + Math.floor(row / 2)
    const stagger = row % 2 ? 0.5 : 0
    const stone = (x: number) => Math.floor((x - MARKET_WIDTH / 2) / (rowHeight * 3) + stagger)
    const top = rowTop
    grid.rect(0, top, MARKET_WIDTH - 1, top + rowHeight - 1, (x, y) => {
      const base = ground(x, y)
      if (y === top + rowHeight - 1 || stone(x) !== stone(x - 1)) {
        return shade(base, -0.3)
      }
      // Each stone is a little lighter or darker than its neighbours, with a worn, lighter top
      const tone = stoneTones[(((stone(x) * 7 + row * 13) % 4) + 4) % 4]
      return shade(base, tone + (y === top && rowHeight > 2 ? 0.1 : 0))
    })
    rowTop += rowHeight
  }

  relightGrid(grid, phase)
  for (const [x, y] of litWindows) {
    grid.rect(x, y, x + 2, y + 3, '#d89048')
    grid.set(x, y, '#ffc070')
  }
  paintSkyObjects(grid, phase, hour)
  const sky = bands(SKIES[phase])
  grid.rect(0, 0, MARKET_WIDTH - 1, FAR_STREET_LINE, (x, y) => (grid.get(x, y) ? null : sky(x, y)))
  return grid
}

// ── The near side: timber houses, the lantern string, Wick's stall ──────────

/** The house on the left; the right one is the same house flipped. */
function paintHouse(): PixelGrid {
  const house = new PixelGrid(55, MARKET_HEIGHT)
  const wall = bands([[0, '#1f1612'], [13, '#271b15'], [27, '#30221a']], 'x')
  house.polygon(
    [[0, 9], [39, 22], [39, 180], [0, 180]],
    (x, y) => (speckle(x, y, 9) ? shade(wall(x, y), 0.1) : wall(x, y)),
  )
  house.polygon([[0, 0], [50, 18], [39, 25], [0, 13]], (_x, y) => (y % 3 === 0 ? '#1d1411' : '#120c0b'))

  const timber = '#140d0a'
  beam(house, 0, 35, 39, 43, timber)
  beam(house, 0, 80, 39, 84, timber)
  beam(house, 0, 125, 39, 127, timber)
  beam(house, 13, 16, 13, 179, timber)
  beam(house, 27, 20, 27, 179, timber)
  beam(house, 0, 37, 13, 80, timber)
  beam(house, 27, 45, 38, 84, timber)

  // An unlit upstairs window, and the door with firelight leaking round it
  house.rect(15, 95, 24, 107, '#1a110c')
  house.rect(19, 95, 20, 107, '#2a1c14')
  house.rect(15, 141, 26, 179, '#0d0806')
  house.rect(26, 142, 26, 179, '#c08040')
  for (const y of [152, 164]) {
    house.rect(17, y, 18, y, '#2a1c14')
  }

  // The bracket and the board of a hanging sign; the picture on it is added after flipping
  house.rect(39, 52, 53, 53, '#2a1e15')
  house.rect(45, 54, 45, 55, '#3d2c1f')
  house.rect(50, 54, 50, 55, '#3d2c1f')
  house.rect(41, 56, 54, 66, '#1a110c')
  house.rect(42, 57, 53, 65, '#3b2a1d')
  return house
}

/** Where the lanterns hang on the string across the street. */
export const STRING_LANTERN_SPOTS: Point[] = [0.12, 0.28, 0.44, 0.6, 0.76, 0.9].map((t) => [
  Math.round(37 + 125 * t),
  Math.round(15 + 45 * t * (1 - t)),
])

/** Lit house windows (left, top, width, height, glass), mirrored onto the right house too. Some flicker. */
export const HOUSE_WINDOWS = [
  { left: 3, top: 48, width: 8, height: 11, glass: '#ffb456', flicker: false },
  { left: 15, top: 52, width: 9, height: 12, glass: '#ffa645', flicker: true },
  { left: 3, top: 93, width: 8, height: 11, glass: '#c87a38', flicker: true },
] as const

function paintStall(grid: PixelGrid): void {
  // The stall is open at the back, so the street shows through; shelves hang on either side
  for (const [left, right] of [[68, 82], [118, 131]] as const) {
    for (const shelf of [81, 105]) {
      grid.rect(left, shelf, right, shelf, '#4e3622')
      grid.rect(left, shelf + 1, right, shelf + 1, '#3a2818')
      grid.rect(left + 1, shelf + 2, left + 1, shelf + 3, '#2a1d12')
      grid.rect(right - 1, shelf + 2, right - 1, shelf + 3, '#2a1d12')
    }
  }
  const bottles = [
    [70, 7, '#6a2420'],
    [74, 5, '#24452c'],
    [78, 8, '#263458'],
    [120, 6, '#45245a'],
    [124, 7, '#6a2420'],
    [128, 5, '#24452c'],
  ] as const
  for (const [x, height, color] of bottles) {
    const top = 80 - height
    grid.rect(x, top + 2, x + 2, 80, color)
    grid.rect(x + 1, top, x + 1, top + 1, shade(color, -0.2))
    grid.set(x + 1, top - 1, '#7a5a3a')
    grid.set(x, top + 3, shade(color, 0.55))
  }
  for (const x of [70, 76, 120, 126]) {
    grid.rect(x, 98, x + 4, 104, '#241a12')
    grid.rect(x, 97, x + 4, 97, '#4e3622')
    grid.rect(x + 1, 100, x + 3, 101, '#8a7a5a')
  }
  for (const [x, length] of [[72, 4], [75, 6], [79, 3], [121, 5], [125, 3]] as const) {
    grid.rect(x, 59, x, 59 + length, '#2e4226')
    grid.set(x, 60 + length, '#3e5a30')
  }

  // Posts, the little roof, and the striped, scalloped awning
  for (const left of [64, 132]) {
    grid.rect(left, 44, left + 3, 159, '#2b1d12')
    grid.rect(left, 44, left, 159, '#3d2a1a')
    grid.rect(left + 3, 44, left + 3, 159, '#1d130b')
  }
  grid.polygon([[57, 46], [100, 34], [143, 46]], (_x, y) => (y % 3 === 0 ? '#2a1d13' : '#1d140d'))
  const scallop = [1, 2, 3, 3, 2, 1]
  for (let x = 58; x <= 141; x++) {
    const red = Math.floor((x - 58) / 6) % 2 === 0
    const bottom = 57 + scallop[(x - 58) % 6]
    for (let y = 45; y <= bottom; y++) {
      const color = red ? (y === 46 ? '#8a3024' : '#6e1f18') : '#2a0e0b'
      grid.set(x, y, y === 45 ? '#140d0a' : y === bottom ? shade(color, -0.35) : color)
    }
  }
  grid.rect(126, 58, 126, 66, '#2a1e15')
}

/** Wick: a hooded merchant whose face is only darkness, lit from the right by the stall lantern. */
function paintWick(): PixelGrid {
  const wick = new PixelGrid(MARKET_WIDTH, MARKET_HEIGHT)
  const cloak = bands([[0, '#120d09'], [90, '#2c2118'], [109, '#4a3828']], 'x')
  wick.polygon([[71, 153], [72, 138], [76, 126], [86, 118], [114, 118], [124, 126], [128, 138], [129, 153]], cloak)
  for (const [x0, x1] of [[86, 84], [114, 116]] as const) {
    wick.line(x0, 127, x1, 153, '#120c08')
  }
  wick.line(100, 134, 100, 153, '#120c08')
  wick.line(115, 127, 117, 153, '#5a4532')

  const hood: Point[] = [
    [100, 67], [92, 70], [86, 76], [82, 85], [80, 95], [81, 105], [83, 113], [88, 121],
    [112, 121], [117, 113], [119, 105], [120, 95], [118, 85], [114, 76], [108, 70],
  ]
  wick.polygon(hood, cloak)
  wick.line(97, 70, 89, 84, '#3a2c20')
  // The lantern catches the right edge of the hood
  for (let y = 70; y <= 119; y++) {
    for (let x = 122; x >= 98; x--) {
      if (wick.get(x, y)) {
        wick.set(x, y, '#6a5038')
        break
      }
    }
  }

  wick.polygon([[82, 118], [100, 129], [118, 118], [120, 126], [100, 138], [80, 126]], (x) => (x < 100 ? '#1a120c' : '#2a1e14'))
  wick.rect(99, 130, 100, 131, '#8a7034')
  wick.set(99, 130, '#e8c86a')

  wick.ellipse(100, 98, 11, 13.5, (x) => (x >= 100 ? '#5a4432' : '#3a2c20'))
  wick.ellipse(100, 98, 9.5, 12, '#040302')

  for (const cx of [88, 112]) {
    wick.ellipse(cx, 150, 5, 3.5, '#1d150f')
    wick.rect(cx - 3, 148, cx + 2, 148, '#2e2218')
  }
  wick.outline()
  return wick
}

function paintCounter(grid: PixelGrid): void {
  grid.polygon([[56, 149], [144, 149], [146, 155], [54, 155]], (_x, y) => (y === 149 ? '#8a6340' : '#6b4a2e'))
  const wood = bands([[155, '#5a3d26'], [163, '#4a3220'], [171, '#3a2617']])
  grid.rect(55, 155, 145, 179, (x, y) => {
    if (y === 163 || y === 171 || x === 75 || x === 125) {
      return '#1d130b'
    }
    return speckle(x, y, 7) ? shade(wood(x, y), -0.18) : wood(x, y)
  })
}

export function paintNearStreet(phase: DayPhase = 'night'): PixelGrid {
  const grid = new PixelGrid(MARKET_WIDTH, MARKET_HEIGHT)
  const house = paintHouse()
  stamp(grid, house, 0, 0)
  stamp(grid, house, MARKET_WIDTH - house.width, 0, true)

  // A tankard on the tavern's sign, a moon on the other
  grid.rect(45, 59, 49, 63, '#c9a24e')
  grid.rect(45, 59, 49, 59, '#f4ecdc')
  for (const [x, y] of [[50, 60], [51, 61], [51, 62], [50, 63]] as const) {
    grid.set(x, y, '#c9a24e')
  }
  grid.ellipse(151.5, 61.5, 3.4, 3.4, '#c9a24e')
  grid.ellipse(153.5, 60.5, 2.8, 2.8, '#3b2a1d')

  // The string the lanterns hang from, sagging across the street
  for (let step = 0; step <= 300; step++) {
    const t = step / 300
    grid.set(Math.round(37 + 125 * t), Math.round(15 + 45 * t * (1 - t)), '#120c0a')
  }

  paintStall(grid)
  stamp(grid, paintWick(), 0, 0)
  paintCounter(grid)
  relightGrid(grid, phase)
  return grid
}

// ── Small animated pieces, laid over the street ─────────────────────────────

/** A house window: lamplit glass in the dark hours, glass reflecting the sky by day. */
export function paintHouseWindow(width: number, height: number, glass: string, phase: DayPhase = 'night'): PixelGrid {
  if (!isLamplit(phase)) {
    const pane = paintHouseWindow(width, height, '#4a5a6a')
    relightGrid(pane, phase)
    return pane
  }
  const pane = new PixelGrid(width, height)
  pane.rect(0, 0, width - 1, height - 1, '#140d0a')
  pane.rect(1, 1, width - 2, height - 2, (_x, y) => (y > height / 2 ? shade(glass, -0.15) : glass))
  const middleX = Math.floor(width / 2)
  const middleY = Math.floor(height / 2)
  pane.rect(middleX, 1, middleX, height - 2, '#3a2414')
  pane.rect(1, middleY, width - 2, middleY, '#3a2414')
  pane.rect(1, 1, 2, 1, shade(glass, 0.4))
  return pane
}

const LANTERN_COLORS = { K: '#8a7034', F: '#2a1f14', G: '#ffc56b', W: '#fff1c4', C: '#5a4520' }
/** By day the lanterns are out: dull glass in the same frames. */
const UNLIT_LANTERN_COLORS = { ...LANTERN_COLORS, G: '#8a7a5a', W: '#a8987a' }

const lanternColors = (phase: DayPhase) => (isLamplit(phase) ? LANTERN_COLORS : UNLIT_LANTERN_COLORS)

export function paintStringLantern(phase: DayPhase = 'night'): PixelGrid {
  return fromRows(['.CC.', 'GGGG', 'GWWG', 'GWWG', 'GGGG', '.CC.'], lanternColors(phase))
}

/** The lantern hanging in Wick's stall; it hangs from the hook at (126, 66). */
export const STALL_LANTERN_SPOT: Point = [123, 66]

export function paintStallLantern(phase: DayPhase = 'night'): PixelGrid {
  return fromRows(
    ['..KKK..', '.KKKKK.', 'FGGGGGF', 'FGGWGGF', 'FGWWWGF', 'FGWWWGF', 'FGGWGGF', 'FGGGGGF', '.KKKKK.', '...K...'],
    lanternColors(phase),
  )
}

/** Wick's eyes, the only part of his face anyone has seen, at their left pixel. */
export const WICK_EYES: Point[] = [[95, 96], [102, 96]]

export type TownspersonExtra = 'basket' | 'staff' | 'none'

/** A townsperson's look: what they carry and the colour of their cloak (in night colours, lit like everything else). */
export interface Townsperson {
  extra: TownspersonExtra
  cloak: string
}

/** A cloaked townsperson crossing the street, 18 pixels wide and 20 tall, standing at the bottom centre. */
export function paintTownsperson({ extra, cloak }: Townsperson, phase: DayPhase = 'night'): PixelGrid {
  const person = new PixelGrid(18, 20)
  const cloakShade = (x: number) => (x >= 10 ? shade(cloak, 0.18) : cloak)
  if (extra === 'staff') {
    person.line(3, 19, 2, 0, '#4a3420')
  }
  person.polygon([[6, 7], [12, 7], [14, 13], [15, 19], [3, 19], [4, 13]], cloakShade)
  person.line(9, 9, 9, 18, shade(cloak, -0.3))
  person.ellipse(9, 4, 3.5, 4, cloakShade)
  person.rect(8, 3, 10, 5, '#0e0a08')
  person.rect(8, 4, 10, 5, '#7a5a48')
  person.rect(6, 19, 7, 19, '#1a1210')
  person.rect(11, 19, 12, 19, '#1a1210')
  if (extra === 'basket') {
    person.rect(13, 11, 16, 14, '#6a4a28')
    person.rect(13, 11, 16, 11, '#8a6a3a')
    person.set(14, 10, '#4a6a2a')
  }
  person.outline()
  relightGrid(person, phase)
  return person
}

/** Wick from the chest up, for the Chronicle: the same hooded figure as at his stall, eyes lit. */
export function paintWickPortrait(): PixelGrid {
  const wick = paintWick()
  const [left, top, size] = [70, 64, 60]
  const portrait = new PixelGrid(size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = wick.get(left + x, top + y)
      if (color) {
        portrait.set(x, y, color)
      }
    }
  }
  for (const [eyeX, eyeY] of WICK_EYES) {
    portrait.rect(eyeX - left, eyeY - top, eyeX - left + 2, eyeY - top + 1, '#ffd98a')
    portrait.set(eyeX - left + 1, eyeY - top, '#fff1c4')
  }
  return portrait
}
