import { bands, speckle } from './marketPixels'
import { PixelGrid, shade } from './pixel'

/** Story scenes are painted 200×150 and stretched across the reader's stage. */
export const SCENE_WIDTH = 200
export const SCENE_HEIGHT = 150

export type Point = readonly [number, number]

/** Rough stone blocks in staggered rows, each a slightly different shade. */
function masonry(grid: PixelGrid, x0: number, y0: number, x1: number, y1: number, base: string, blockWidth = 8, blockHeight = 5): void {
  grid.rect(x0, y0, x1, y1, (x, y) => {
    const row = Math.floor((y - y0) / blockHeight)
    const offset = row % 2 ? blockWidth / 2 : 0
    if ((y - y0) % blockHeight === blockHeight - 1 || Math.floor(x + offset) % blockWidth === 0) {
      return shade(base, -0.35)
    }
    const tone = [0, -0.06, 0.05, -0.1][(Math.floor((x + offset) / blockWidth) * 3 + row * 5) % 4]
    return shade(base, speckle(x, y, 9) ? tone + 0.08 : tone)
  })
}

/** A wooden crate, with darker slats and a lid. */
function crate(grid: PixelGrid, x: number, y: number, width: number, height: number): void {
  grid.rect(x, y, x + width, y + height, (px, py) => (px === x || px === x + width || py === y || py === y + height ? '#3a2412' : py % 4 === 0 ? '#5a3a1e' : '#6e4a28'))
  grid.line(x + 1, y + height - 1, x + width - 1, y + 1, '#4a2e16')
}

/** Sword hilts sticking up out of a crate, each with a little stamp on the pommel. */
function swordsIn(grid: PixelGrid, x: number, y: number, count: number): void {
  for (let index = 0; index < count; index++) {
    const hiltX = x + index * 3
    grid.rect(hiltX, y - 6, hiltX, y - 1, '#4a3420')
    grid.rect(hiltX - 1, y - 2, hiltX + 1, y - 2, '#b4c0cf')
    grid.set(hiltX, y - 7, '#d8a23a')
  }
}

// ── The Old Watch Fort, burned and taken, at dusk ───────────────────────────

export function paintFortYard(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 70, bands([[0, '#2a1e3a'], [18, '#4a2a44'], [34, '#7a3a42'], [48, '#b05a3a'], [60, '#d8823a']]))
  // Distant hills under the sunset
  grid.polygon([[0, 70], [30, 58], [70, 64], [110, 54], [150, 62], [200, 56], [200, 76], [0, 76]], '#2a2230')

  // The fort's walls, one tower broken open, the gate burned out
  masonry(grid, 0, 30, 46, 112, '#5a5258')
  // Battlements, some knocked down in the fighting
  for (const [x, height] of [[0, 4], [7, 1], [14, 5], [21, 0], [28, 3], [35, 2], [42, 4]] as const) {
    grid.rect(x, 30 - height, x + 3, 29, '#5a5258')
  }
  grid.polygon([[18, 44], [30, 40], [34, 62], [16, 66]], '#120c10')
  masonry(grid, 46, 52, 200, 112, '#4e484e', 10, 6)
  for (let x = 46; x <= 200; x += 12) {
    grid.rect(x, 46, x + 6, 51, (px, py) => (px > 150 && py < 49 ? null : '#4e484e'))
  }
  // Gaps where the walls were breached
  grid.polygon([[96, 52], [104, 60], [112, 52]], '#7a3a42')
  grid.polygon([[150, 46], [156, 58], [166, 54], [172, 46]], '#b05a3a')
  // The burned gate
  grid.rect(120, 76, 146, 112, '#0e0a0c')
  grid.ellipse(133, 76, 13, 8, '#0e0a0c')
  for (const x of [124, 130, 136, 142]) {
    grid.rect(x, 82, x + 1, 112, (_px, py) => (py > 96 ? '#2a1a12' : '#1a120e'))
  }
  // Scorch marks on the stone
  for (const [cx, cy, rx, ry] of [[30, 80, 10, 14], [110, 70, 12, 8], [170, 90, 14, 10]] as const) {
    grid.ellipse(cx, cy, rx, ry, (x, y) => ((x + y) % 2 === 0 && grid.get(x, y) ? '#2a2226' : null))
  }

  // The courtyard: trampled earth, rubble, a broken cart and a fallen banner
  grid.rect(0, 112, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[112, '#3a2e24'], [130, '#33281f'], [142, '#2c221a']]))
  grid.rect(0, 112, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => (speckle(x, y, 7) ? '#4a3c2e' : null))
  for (const [x, y, size] of [[60, 118, 4], [66, 120, 3], [88, 116, 5], [176, 122, 4], [10, 128, 5], [186, 136, 6]] as const) {
    grid.ellipse(x, y, size, size * 0.6, (_px, py) => (py < y ? '#6a6268' : '#4a4448'))
  }
  grid.polygon([[150, 128], [180, 122], [182, 130], [152, 136]], '#5a3a1e')
  grid.ellipse(156, 136, 5, 5, (x, y) => (Math.abs(Math.hypot(x - 156, y - 136) - 4) < 1 ? '#3a2412' : null))
  grid.polygon([[20, 138], [56, 132], [58, 140], [22, 146]], '#6e1f18')
  grid.line(22, 140, 56, 134, '#8a3024')
  crate(grid, 76, 124, 12, 10)
  return grid
}

/** Where smoke rises from the fort, for the drifting smoke drawn over the scene. */
export const FORT_SMOKE: readonly Point[] = [[34, 40], [104, 52], [160, 48]]

// ── The cellar beneath the fort, by torchlight ──────────────────────────────

export function paintFortCellar(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  masonry(grid, 0, 0, SCENE_WIDTH - 1, 112, '#3a3236', 9, 6)
  // Vaulted arches across the back wall
  for (const cx of [40, 100, 160]) {
    grid.ellipse(cx, 60, 26, 34, (_x, y) => (y > 60 ? null : '#140e10'))
    grid.rect(cx - 26, 60, cx + 26, 112, '#140e10')
    grid.ellipse(cx, 60, 28, 36, (x, y) => (y > 60 || grid.get(x, y) === '#140e10' ? null : shade('#4a4246', y < 34 ? 0.06 : 0)))
  }
  for (const x of [10, 70, 130, 190]) {
    grid.rect(x - 3, 20, x + 3, 112, (px) => (px < x ? '#4e464a' : '#3a3236'))
  }
  // Torch brackets on the pillars; their flames are drawn over the scene so they can flicker
  for (const x of [70, 130]) {
    grid.rect(x - 1, 54, x + 1, 64, '#2a1a10')
    grid.rect(x - 2, 52, x + 2, 53, '#5a4a3a')
  }
  // Flagstone floor
  grid.rect(0, 112, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => {
    const row = Math.floor((y - 112) / 7)
    const edge = (y - 112) % 7 === 6 || Math.floor(x / (14 + row * 2) + (row % 2) * 0.5) !== Math.floor((x - 1) / (14 + row * 2) + (row % 2) * 0.5)
    return edge ? '#1e181a' : speckle(x, y, 8) ? '#3e3638' : '#342c2e'
  })
  // Crates stacked in the arches, packed with new swords
  for (const [x, y, width, height, swords] of [
    [20, 92, 22, 20, 6],
    [44, 98, 18, 14, 0],
    [24, 76, 16, 16, 0],
    [86, 94, 24, 18, 7],
    [150, 90, 22, 22, 6],
    [172, 100, 18, 12, 0],
  ] as const) {
    crate(grid, x, y, width, height)
    if (swords) {
      swordsIn(grid, x + 3, y, swords)
    }
  }
  return grid
}

/** Where each torch burns, for the flickering flames drawn over the cellar. */
export const CELLAR_TORCHES: readonly Point[] = [[70, 50], [130, 50]]

// ── The Grey Keep's great hall, cold and grey ───────────────────────────────

export function paintKeepHall(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  masonry(grid, 0, 0, SCENE_WIDTH - 1, 110, '#4a4650', 10, 6)
  // Tall windows letting in grey snowlight, one of them broken
  for (const [x, broken] of [[34, false], [100, true], [166, false]] as const) {
    grid.rect(x - 9, 14, x + 9, 64, '#2a2630')
    grid.ellipse(x, 14, 9, 8, (_px, py) => (py <= 14 ? '#2a2630' : null))
    grid.rect(x - 7, 12, x + 7, 62, (px, py) => (broken && px > x - 2 && py < 34 && (px + py) % 3 === 0 ? null : bands([[12, '#9aa0b0'], [40, '#7a8090']])(px, py)))
    grid.ellipse(x, 14, 7, 6, (_px, py) => (py <= 14 ? '#aab0c0' : null))
    grid.rect(x, 8, x, 62, '#2a2630')
    grid.rect(x - 7, 37, x + 7, 37, '#2a2630')
  }
  // Banners of the black keep on grey, hanging in tatters
  for (const x of [66, 134]) {
    grid.rect(x - 7, 10, x + 7, 52, (px, py) => (py > 46 && (px + py) % 3 === 0 ? null : '#7c7c86'))
    grid.rect(x - 3, 22, x + 3, 36, '#1c1c22')
    for (const cx of [x - 3, x, x + 3]) {
      grid.rect(cx, 19, cx, 21, '#1c1c22')
    }
    grid.rect(x - 8, 9, x + 8, 9, '#5a3a1e')
  }
  // The cold hearth: stone mantel, ash, no fire
  grid.rect(80, 70, 120, 110, '#3a3640')
  grid.rect(86, 80, 114, 110, '#16121a')
  grid.rect(78, 68, 122, 72, '#5a5660')
  grid.ellipse(100, 108, 10, 3, (x, y) => ((x + y) % 2 ? '#4a464a' : '#5a5658'))
  // Flagstones, and the long table down the middle of the hall
  grid.rect(0, 110, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => {
    const row = Math.floor((y - 110) / 8)
    const edge = (y - 110) % 8 === 7 || (x + row * 9) % 18 === 0
    return edge ? '#25212a' : speckle(x, y, 9) ? '#47434c' : '#3c3842'
  })
  grid.rect(20, 118, 180, 124, (x, y) => (y === 118 ? '#7a5a3a' : x % 30 === 0 ? '#3a2412' : '#5a3e24'))
  for (const x of [26, 174]) {
    grid.rect(x, 125, x + 3, 140, '#3a2412')
  }
  // A goblet knocked over, and the stack of letters
  grid.rect(60, 114, 62, 117, '#b4c0cf')
  grid.rect(120, 115, 130, 117, '#e8dcc0')
  grid.set(125, 116, '#7a7484')
  // Snow drifting in under the broken window
  grid.ellipse(100, 110, 18, 3, (x, y) => (y < 110 ? null : (x + y) % 2 ? '#d8dce8' : '#c0c4d0'))
  return grid
}

/** Where snow blows in through the broken window, for the flakes drawn over the hall. */
export const KEEP_SNOW: readonly Point[] = [[92, 20], [100, 26], [108, 18], [96, 34], [104, 40]]

// ── The Cinder Fen, burned and still smouldering ────────────────────────────

export function paintCinderFen(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  // A low, smoky sky with a sullen glow on the horizon
  grid.rect(0, 0, SCENE_WIDTH - 1, 78, bands([[0, '#2a2228'], [24, '#3a2a2e'], [46, '#5a3a34'], [64, '#7a4a3a']]))
  grid.rect(0, 0, SCENE_WIDTH - 1, 78, (x, y) => ((x * 3 + y * 7) % 23 === 0 ? '#4a3a3e' : null))
  // Far treeline, burned to stumps
  grid.polygon([[0, 78], [20, 72], [44, 76], [70, 70], [100, 75], [130, 71], [160, 76], [200, 72], [200, 82], [0, 82]], '#1e181c')
  // Black water, with embers and the glow reflected in it
  grid.rect(0, 80, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[80, '#1a1618'], [110, '#141012'], [130, '#100c0e']]))
  grid.rect(0, 80, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => ((x * 5 + y * 3) % 61 === 0 ? '#3a2a28' : (x * 7 + y * 13) % 173 === 0 ? '#e2803a' : null))
  // Dead trees, blackened, leaning out of the water
  for (const [x, height, lean] of [[16, 60, -4], [52, 44, 3], [168, 56, 5], [188, 40, -2]] as const) {
    grid.line(x, 108, x + lean, 108 - height, '#0e0a0c')
    grid.line(x + 1, 108, x + 1 + lean, 108 - height, '#1a1416')
    grid.line(x + lean, 108 - height * 0.6, x + lean + 9, 108 - height * 0.75, '#0e0a0c')
    grid.line(x + lean * 0.5, 108 - height * 0.4, x + lean - 8, 108 - height * 0.55, '#0e0a0c')
  }
  // The Witch's hut on stilts, the last one standing, one window lit
  for (const x of [118, 126, 140, 148]) {
    grid.rect(x, 84, x + 1, 112, '#2a1e18')
  }
  grid.rect(112, 66, 154, 86, (x, y) => (x % 6 === 0 ? '#3a2a22' : y % 4 === 0 ? '#4a3628' : '#56402e'))
  grid.polygon([[108, 68], [133, 46], [158, 68]], (_x, y) => (y % 3 === 0 ? '#2a2226' : '#3a3036'))
  grid.rect(122, 72, 128, 78, '#ffb456')
  grid.rect(125, 72, 125, 78, '#3a2a22')
  grid.rect(138, 74, 146, 86, '#140e0c')
  grid.rect(132, 86, 152, 88, '#3a2a22')
  for (let step = 0; step < 6; step++) {
    grid.rect(150 + step * 3, 88 + step * 4, 154 + step * 3, 89 + step * 4, '#2a1e18')
  }
  // Black reeds along the near bank
  for (let x = 0; x < SCENE_WIDTH; x += 3) {
    const height = 6 + ((x * 7) % 9)
    grid.line(x, SCENE_HEIGHT - 1, x + ((x % 5) - 2), SCENE_HEIGHT - 1 - height, x % 2 ? '#0e0a0c' : '#1e1618')
  }
  grid.rect(0, 136, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => (grid.get(x, y) ? null : speckle(x, y, 3) ? '#241c1a' : '#1a1412'))
  return grid
}

/** Where embers rise off the fen, for the sparks drawn over it. */
export const FEN_EMBERS: readonly Point[] = [[30, 120], [74, 112], [96, 126], [160, 118], [182, 128], [60, 132]]

// ── Gorrak's broken war camp on the Red Steppe, at sunset ───────────────────

export function paintSteppeCamp(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  // A bleeding sunset over the open steppe
  grid.rect(0, 0, SCENE_WIDTH - 1, 84, bands([[0, '#3a1e2e'], [18, '#6a2a34'], [36, '#a8402e'], [54, '#d86a2e'], [70, '#f0a04a']]))
  grid.ellipse(150, 82, 16, 16, (_x, y) => (y <= 84 ? '#ffd27a' : null))
  grid.ellipse(150, 82, 11, 11, (_x, y) => (y <= 84 ? '#fff1c4' : null))
  // Low hills, and the rust-red grass sea running to the horizon
  grid.polygon([[0, 84], [40, 78], [90, 82], [140, 77], [200, 81], [200, 90], [0, 90]], '#4a2a22')
  grid.rect(0, 88, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[88, '#8a3a24'], [108, '#7a321e'], [128, '#6a2a1a']]))
  grid.rect(0, 88, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => ((x * 3 + y * 5) % 7 === 0 ? '#a8502e' : (x + y * 3) % 11 === 0 ? '#5a2216' : null))
  // Round felt tents, a trampled banner, and the war drum Gorrak sits on
  for (const [x, y, size] of [[28, 100, 18], [76, 94, 13], [182, 98, 16]] as const) {
    grid.ellipse(x, y, size, size * 0.75, (px, py) => (py > y ? null : px < x ? '#c8a878' : '#a8885a'))
    grid.rect(x - size, y, x + size, y + 6, (px) => (px < x ? '#b8986a' : '#98784a'))
    grid.rect(x - 3, y - 2, x + 3, y + 6, '#2a1a12')
    grid.rect(x - 1, y - size * 0.75 - 6, x - 1, y - size * 0.75, '#3a2a1e')
    grid.rect(x, y - size * 0.75 - 6, x + 5, y - size * 0.75 - 3, '#a8281e')
  }
  grid.polygon([[110, 124], [140, 118], [142, 126], [112, 132]], '#a8281e')
  grid.line(112, 128, 140, 122, '#6e1a14')
  grid.ellipse(100, 132, 9, 5, (x, y) => (y < 130 ? '#c8a878' : x < 100 ? '#8a5a2e' : '#6a4222'))
  // Taller grass in front, bending in the wind
  for (let x = 0; x < SCENE_WIDTH; x += 2) {
    const height = 5 + ((x * 13) % 7)
    grid.line(x, SCENE_HEIGHT - 1, x + 2, SCENE_HEIGHT - 1 - height, x % 4 ? '#b0582e' : '#7a321e')
  }
  return grid
}

/** Where seeds blow across the steppe, for the wind drawn over it. */
export const STEPPE_WIND: readonly Point[] = [[20, 96], [60, 110], [110, 100], [40, 124], [150, 116], [90, 140]]

// ── The old toll fort on the Salt Road, in hard white morning light ─────────

export function paintSaltRoad(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 80, bands([[0, '#5a8aa8'], [26, '#86aebc'], [50, '#b4cac4'], [68, '#dcdcc4']]))
  // The salt flats, crusted and cracked, running out to a thin line of hills
  grid.polygon([[0, 80], [50, 74], [110, 79], [160, 72], [200, 78], [200, 86], [0, 86]], '#8a8478')
  grid.rect(0, 84, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[84, '#e6e0cc'], [110, '#d8d0b8'], [132, '#c8bea4']]))
  grid.rect(0, 84, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => ((x * 5 + y * 3) % 23 === 0 ? '#b0a68c' : (x + y * 7) % 31 === 0 ? '#f4eedc' : null))
  // The road itself, packed pale and straight toward the gate
  grid.polygon([[88, 96], [112, 96], [150, SCENE_HEIGHT - 1], [50, SCENE_HEIGHT - 1]], (x, y) => ((x + y) % 9 === 0 ? '#a89c80' : '#bcb094'))
  // The toll fort astride the road, with its barrier arm and a captured banner
  masonry(grid, 56, 54, 144, 98, '#8a8070')
  for (let x = 56; x < 144; x += 10) {
    masonry(grid, x, 48, x + 5, 54, '#8a8070', 4, 3)
  }
  grid.rect(86, 70, 114, 98, '#2a241c')
  grid.polygon([[86, 70], [100, 60], [114, 70]], '#2a241c')
  grid.line(66, 88, 134, 82, '#6a4422')
  grid.line(66, 89, 134, 83, '#a8281e')
  grid.rect(99, 28, 100, 54, '#3a2a1e')
  grid.polygon([[100, 28], [122, 32], [100, 40]], '#c8a040')
  // A brazier by the gate, and heaps of raked salt along the road
  grid.rect(146, 94, 151, 100, '#3a3028')
  grid.rect(147, 91, 150, 94, '#e2803a')
  for (const [x, y, size] of [[26, 112, 15], [176, 120, 18], [14, 134, 10]] as const) {
    grid.polygon([[x - size, y], [x, y - size * 0.7], [x + size, y]], (px) => (px < x ? '#f4eedc' : '#d0c8b0'))
  }
  return grid
}

// ── Your army's camp at night, around the fire ──────────────────────────────

export function paintCampNight(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 80, bands([[0, '#0a0a18'], [30, '#121228'], [56, '#1c1a34'], [70, '#24203a']]))
  for (let index = 0; index < 60; index++) {
    const x = (index * 53) % SCENE_WIDTH
    const y = (index * 29) % 70
    grid.set(x, y, index % 7 === 0 ? '#e8e2d0' : '#7a7490')
  }
  grid.ellipse(160, 20, 7, 7, (x, y) => (x - 160 + y - 20 > 3 ? '#bdb4a0' : '#e6dfcc'))
  // Dark hills, and the camp: tents lit from inside, a banner, the fire in the middle
  grid.polygon([[0, 80], [40, 70], [90, 76], [140, 68], [200, 76], [200, 92], [0, 92]], '#14141e')
  grid.rect(0, 90, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[90, '#1a1c18'], [120, '#161814'], [138, '#121410']]))
  grid.rect(0, 90, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => (speckle(x, y, 9) ? '#22261e' : null))
  for (const [x, y, size, lit] of [[24, 100, 16, true], [70, 92, 11, false], [176, 102, 18, true], [132, 90, 10, true]] as const) {
    grid.polygon([[x - size, y], [x, y - size], [x + size, y]], (px) => (px < x ? '#3a3226' : '#2a241c'))
    grid.polygon([[x - size * 0.3, y], [x, y - size * 0.55], [x + size * 0.3, y]], lit ? '#a8682e' : '#0e0c0a')
  }
  grid.rect(108, 70, 108, 92, '#2a1e14')
  grid.rect(109, 70, 116, 75, '#8a2a22')
  // The firepit, in the one gap the cast leaves however many stand (about 61% across): a ring of stones and stacked logs; its flames are drawn over the scene
  grid.ellipse(122, 132, 12, 4, (x, y) => (y < 131 ? null : (x + y) % 3 ? '#4a4648' : '#3a3638'))
  grid.line(114, 132, 130, 127, '#3a2412')
  grid.line(114, 127, 130, 132, '#4a2e16')
  // Firelight warming the ground around the pit
  grid.ellipse(122, 132, 34, 10, (x, y) => ((x + y) % 2 === 0 && grid.get(x, y)?.startsWith('#1') ? '#2e2a1e' : null))
  return grid
}

/** Where the campfire burns, for the flames and sparks drawn over the camp. */
export const CAMPFIRE: Point = [122, 127]

// ── A dungeon beneath a keep: a barred cell, chains, and wet flagstones ─────

export function paintDungeon(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  masonry(grid, 0, 0, SCENE_WIDTH - 1, 106, '#3e3c48', 12, 7)
  // Darkness pooling under the vault, and two heavy arches holding it up
  grid.rect(0, 0, SCENE_WIDTH - 1, 16, (x, y) => (y < 8 || (x + y) % 2 === 0 ? '#0c0b12' : null))
  for (const [left, right] of [[0, 62], [138, 199]] as const) {
    const middle = (left + right) / 2
    grid.ellipse(middle, 44, (right - left) / 2 - 6, 26, (_x, y) => (y < 44 ? '#16151e' : null))
    grid.rect(left + 6, 44, right - 6, 106, (x, y) => ((x * 3 + y * 7) % 19 === 0 ? '#22202c' : '#16151e'))
  }
  for (const x of [62, 132]) {
    masonry(grid, x, 18, x + 6, 106, '#57545f', 6, 6)
  }
  // The cell: black inside, a slumped shape in the dark, and iron bars
  grid.ellipse(100, 48, 26, 18, (_x, y) => (y < 48 ? '#07070c' : null))
  grid.rect(74, 48, 126, 106, '#07070c')
  grid.polygon([[92, 106], [96, 88], [101, 84], [107, 90], [110, 106]], '#14131c')
  for (let x = 76; x <= 124; x += 6) {
    grid.rect(x, x < 88 || x > 112 ? 38 : 31, x + 1, 106, (px) => (px === x ? '#7a7884' : '#44424e'))
  }
  grid.rect(74, 62, 126, 63, '#5a5864')
  grid.rect(112, 76, 117, 83, '#8a6a2a')
  // Torch brackets either side of the cell, and shackles hanging empty in the arches
  for (const x of [70, 130]) {
    grid.rect(x - 1, 50, x, 60, '#2a1a10')
    grid.rect(x - 2, 58, x + 1, 59, '#5a5864')
  }
  for (const x of [22, 40, 160, 178]) {
    for (let y = 18; y < 62; y += 3) {
      grid.rect(x, y, x + 1, y + 1, y % 2 ? '#6a6874' : '#44424e')
    }
    grid.rect(x - 2, 62, x + 3, 65, '#5a5864')
    grid.rect(x - 1, 63, x + 2, 64, '#16151e')
  }
  // Wet flagstones catching the torchlight, a skull, old bones, and rotten straw
  masonry(grid, 0, 106, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, '#2c2b34', 22, 11)
  grid.rect(0, 106, SCENE_WIDTH - 1, 109, '#0e0d14')
  for (const [x, y, width, height] of [[68, 122, 15, 3], [134, 128, 17, 4], [100, 142, 21, 3]] as const) {
    grid.ellipse(x, y, width, height, (px, py) => (py === y && Math.abs(px - x) < width / 2 ? '#e2803a' : py === y - 1 && Math.abs(px - x) < width / 4 ? '#ffb456' : '#141a26'))
  }
  grid.ellipse(30, 126, 5, 4.5, (x) => (x < 30 ? '#d8ccb0' : '#a69a7c'))
  grid.rect(28, 129, 32, 132, '#a69a7c')
  grid.rect(27, 125, 28, 126, '#0c0b12')
  grid.rect(31, 125, 32, 126, '#0c0b12')
  grid.line(42, 134, 55, 130, '#c8bca0')
  grid.line(170, 120, 184, 124, '#c8bca0')
  for (let x = 150; x < 196; x += 2) {
    grid.line(x, 143, x + ((x * 7) % 5) - 2, 137 + ((x * 3) % 5), x % 4 ? '#7a6a3a' : '#5a4a26')
  }
  return grid
}

/** Where water falls from the dungeon's vault. */
export const DUNGEON_DRIPS: readonly Point[] = [[48, 20], [146, 20], [186, 22]]

// ── An elven forest at dusk: silver trees, a white bridge, and glowing things ─

export function paintElvenForest(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 100, bands([[0, '#1a1848'], [24, '#2a2a6a'], [48, '#2e5a7e'], [72, '#3e8a84'], [90, '#6ab49a']]))
  grid.ellipse(100, 32, 17, 17, (x, y) => (x - 100 + y - 32 > 12 ? '#c8e4d0' : '#f0fae4'))
  // Rows of far-off trunks melting into the mist
  for (let x = 4; x < SCENE_WIDTH; x += 17) {
    const width = 2 + (x * 3) % 3
    grid.rect(x, 20, x + width, 100, x % 2 ? '#2a5a66' : '#346a70')
  }
  // A white elven bridge, curving across the glade, with a lit lantern at each end
  grid.polygon([[46, 92], [64, 76], [100, 68], [136, 76], [154, 92], [142, 92], [128, 82], [100, 76], [72, 82], [58, 92]], (_x, y) => (y < 78 ? '#f4f0e0' : '#c8d0c4'))
  for (const x of [66, 83, 100, 117, 134]) {
    const top = 68 + Math.abs(x - 100) * 0.25
    grid.rect(x, top - 11, x + 1, top, '#e8e4d4')
  }
  grid.polygon([[66, 62], [83, 57], [100, 55], [117, 57], [134, 62], [134, 64], [100, 58], [66, 64]], '#d8d4c4')
  // Moss, ferns, and a stream of still, silver water
  grid.rect(0, 96, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[96, '#2e6a50'], [116, '#1e5040'], [136, '#143a30']]))
  grid.rect(0, 96, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => (speckle(x, y, 8) ? '#3e8a60' : speckle(x, y, 13) ? '#102e26' : null))
  grid.polygon([[70, 96], [130, 96], [120, 108], [80, 108]], (x, y) => ((x + y * 2) % 7 === 0 ? '#e8f4e8' : '#7ab8b0'))
  // Two ancient silver trees framing the glade, roots gripping the moss, boughs meeting overhead
  for (const [left, right, flare] of [[6, 30, -1], [170, 194, 1]] as const) {
    grid.polygon(
      [[left - flare * 2, 0], [right + flare * 2, 0], [right, 100], [right + 8, 118], [left - 8, 118], [left, 100]],
      (x, y) => {
        const light = (x - left) / (right - left)
        return (x * 2 + Math.floor(y / 5)) % 9 === 0 ? '#7a8a94' : light < 0.3 ? '#e4ecec' : light < 0.7 ? '#b4c2c8' : '#7a8a94'
      },
    )
  }
  for (const [x0, y0, x1, y1] of [[28, 30, 74, 8], [172, 26, 124, 6], [28, 56, 52, 40], [172, 50, 150, 36]] as const) {
    for (let thick = 0; thick < 3; thick++) {
      grid.line(x0, y0 + thick, x1, y1 + thick, thick ? '#a4b4bc' : '#d8e4e4')
    }
  }
  // A canopy of gold and teal leaves
  for (let index = 0; index < 110; index++) {
    const x = (index * 41) % SCENE_WIDTH
    // Thickest at the sides, thinning over the moon so the glade stays open.
    const depth = 8 + (Math.abs(x - 100) / 100) * 30
    const y = (index * 17) % depth
    grid.ellipse(x, y, 6 + (index % 4), 3 + (index % 3), index % 7 === 0 ? '#e4c060' : index % 3 === 0 ? '#14665e' : index % 2 ? '#1e7a70' : '#2a9a84')
  }
  // Hanging lanterns, and glowing blue mushrooms in the moss
  for (const [x, y] of [[52, 40], [150, 36], [76, 22], [122, 20]] as const) {
    grid.rect(x, y, x, y + 7, '#d8e4e4')
    grid.rect(x - 2, y + 7, x + 2, y + 12, '#bff4e4')
    grid.rect(x - 1, y + 8, x + 1, y + 11, '#f4fff4')
  }
  for (const [x, y, size] of [[38, 124, 5], [52, 134, 3], [150, 128, 4], [164, 138, 6], [22, 140, 3], [132, 142, 3]] as const) {
    grid.rect(x - 1, y, x, y + size, '#d4f4f0')
    grid.ellipse(x, y, size, size * 0.65, (_px, py) => (py > y ? null : '#5ae4f0'))
    grid.set(x - 1, y - 1, '#e4fcff')
  }
  return grid
}

// ── A black fortress on a volcano, wrapped in a river of lava ────────────────

export function paintVolcanoFortress(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 96, bands([[0, '#120a12'], [20, '#2a0e14'], [42, '#5a1612'], [64, '#a42c10'], [82, '#e25a14']]))
  for (let index = 0; index < 34; index++) {
    grid.ellipse((index * 47) % SCENE_WIDTH, (index * 11) % 26, 9, 3, index % 2 ? '#1e1016' : '#0e080c')
  }
  // The volcano, its crater spilling fire down the slope
  grid.polygon([[18, 92], [78, 18], [122, 18], [182, 92]], (x, y) => ((x * 3 + y) % 13 === 0 ? '#5a3a34' : x < 100 ? '#46302e' : '#301e22'))
  grid.ellipse(100, 18, 22, 4, '#ffd27a')
  grid.ellipse(100, 18, 15, 2.5, '#fff1c4')
  for (const [points, width] of [[[[90, 20], [84, 40], [92, 56], [78, 76]], 2], [[[110, 20], [118, 38], [108, 56], [124, 78]], 2], [[[100, 21], [101, 44]], 1]] as const) {
    for (let index = 0; index + 1 < points.length; index++) {
      const [x0, y0] = points[index]
      const [x1, y1] = points[index + 1]
      for (let offset = 0; offset <= width; offset++) {
        grid.line(x0 + offset, y0, x1 + offset, y1, offset === 1 ? '#ffd27a' : '#f07a1e')
      }
    }
  }
  // A plume of ash boiling up out of the crater
  for (const [x, y, size] of [[100, 12, 11], [90, 5, 13], [112, 3, 12]] as const) {
    grid.ellipse(x, y, size, size * 0.6, (px) => (px < x ? '#3a2a30' : '#241820'))
  }
  // The fortress: black towers, spiked battlements, burning windows
  const basalt = (x: number, y: number) => ((x + Math.floor(y / 6) * 3) % 8 === 0 ? '#0a0810' : (x * 5 + y * 3) % 17 === 0 ? '#322c38' : '#1c1a24')
  grid.rect(44, 62, 156, 98, basalt)
  for (let x = 44; x < 156; x += 8) {
    grid.polygon([[x, 62], [x + 3, 54], [x + 6, 62]], '#1c1a24')
  }
  for (const [x0, x1, top] of [[28, 52, 32], [148, 172, 32], [84, 116, 58]] as const) {
    grid.rect(x0, top, x1, 98, basalt)
    grid.polygon([[x0 - 3, top], [(x0 + x1) / 2, top - 22], [x1 + 3, top]], (x) => (x < (x0 + x1) / 2 ? '#2a2832' : '#14121a'))
    for (const row of top < 40 ? [top + 8, top + 22] : [top + 6]) {
      grid.rect(x0 + 5, row, x0 + 8, row + 5, '#ffb03a')
      grid.rect(x1 - 8, row, x1 - 5, row + 5, '#ffb03a')
    }
  }
  grid.rect(92, 82, 108, 98, '#ffb03a')
  grid.polygon([[92, 82], [100, 74], [108, 82]], '#ffb03a')
  for (let x = 93; x < 108; x += 4) {
    grid.rect(x, 76, x, 98, '#14121a')
  }
  // The lava river, and a black stone bridge across it
  grid.rect(0, 96, SCENE_WIDTH - 1, 114, (x, y) => ((x * 2 + y * 5) % 11 === 0 ? '#fff1c4' : (x + y * 3) % 5 === 0 ? '#ffb03a' : '#e25a14'))
  grid.polygon([[88, 96], [112, 96], [120, 116], [80, 116]], (x) => ((x % 7) === 0 ? '#0a0810' : '#2a2832'))
  // The obsidian ledge you stand on, cracked and glowing from below
  grid.polygon([[0, 112], [40, 110], [80, 114], [120, 114], [160, 110], [200, 112], [200, 150], [0, 150]], (x, y) => ((x * 3 + y) % 19 === 0 ? '#3a3440' : y > 134 ? '#0e0c12' : '#1a1820'))
  for (const [x0, y0, x1, y1] of [[14, 118, 34, 130], [34, 130, 28, 146], [150, 120, 172, 132], [172, 132, 164, 148], [70, 136, 92, 142]] as const) {
    grid.line(x0, y0, x1, y1, '#f07a1e')
  }
  return grid
}

/** Where the lava glows brightest, for the slow pulse drawn over it. */
export const LAVA_GLOWS: readonly Point[] = [[40, 104], [150, 104], [100, 18], [24, 124], [162, 126]]

// ── A desert filled with the bones of dead gods ──────────────────────────────

/** One colossal rib, curving up out of the sand and in toward the spine. */
function godRib(grid: PixelGrid, baseX: number, baseY: number, height: number, lean: number): void {
  for (let step = 0; step <= height; step++) {
    const along = step / height
    const x = baseX + lean * along * along
    const y = baseY - step
    const half = 2.6 - along * 1.4
    grid.rect(Math.round(x - half), y, Math.round(x + half), y, (px) => (px < x - half / 3 ? '#f8f0dc' : px < x + half / 2 ? '#d8ccb0' : '#9a8e72'))
  }
}

export function paintBoneDesert(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 96, bands([[0, '#3a2058'], [22, '#7a3a68'], [44, '#c8604a'], [66, '#f09a48'], [84, '#f8cf78']]))
  grid.ellipse(50, 66, 13, 13, '#fff1c4')
  // Far dunes, and the tiny-looking spines of other giants on the horizon
  grid.polygon([[0, 92], [36, 80], [84, 90], [130, 78], [200, 90], [200, 100], [0, 100]], '#b4703e')
  for (const [x, height] of [[14, 9], [22, 11], [30, 8], [176, 10], [184, 12], [192, 9]] as const) {
    grid.polygon([[x - 2, 88], [x, 88 - height], [x + 2, 88]], '#e4d4b4')
  }
  // The great ribcage, arching over the sand like the ribs of a hall
  grid.rect(0, 96, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[96, '#e4a860'], [116, '#d0924e'], [136, '#b87a3e']]))
  for (const [baseX, height, lean] of [[8, 66, 30], [28, 72, 26], [48, 74, 20], [68, 68, 14], [88, 56, 8]] as const) {
    godRib(grid, baseX, 104, height, lean)
  }
  // The spine running along their tips
  for (let x = 34; x < 100; x += 6) {
    const y = 28 + (x - 34) * 0.32
    grid.ellipse(x, y, 4, 3.4, (px) => (px < x ? '#f8f0dc' : '#b0a488'))
    grid.polygon([[x - 1, y], [x + 1, y - 9], [x + 3, y]], '#d8ccb0')
  }
  // A god's skull, half sunk, bigger than a castle gate, with one great horn
  grid.polygon([[144, 54], [162, 26], [172, 8], [172, 30], [166, 56]], (x) => (x < 164 ? '#f8f0dc' : '#a89c80'))
  grid.ellipse(160, 80, 34, 30, (x, y) => (y > 104 ? null : (x * 3 + y * 7) % 37 === 0 ? '#9a8e72' : x < 148 ? '#f8f0dc' : x < 176 ? '#dcd0b4' : '#a89c80'))
  grid.polygon([[132, 96], [190, 96], [184, 110], [138, 110]], '#c8bca0')
  grid.ellipse(146, 74, 9, 11, '#241418')
  grid.ellipse(174, 74, 7, 10, '#241418')
  grid.ellipse(146, 77, 2.4, 2.4, '#ffb03a')
  grid.polygon([[158, 86], [162, 86], [164, 96], [156, 96]], '#3a2228')
  for (let x = 138; x < 186; x += 6) {
    grid.rect(x, 100, x + 3, 108, x % 12 < 6 ? '#f4ecd8' : '#d8ccb0')
  }
  grid.line(160, 54, 170, 68, '#6a5e48')
  grid.line(170, 68, 165, 76, '#6a5e48')
  // Dunes in front, wind-rippled, burying everything, and scattered finger bones
  grid.polygon([[0, 104], [50, 112], [110, 104], [160, 110], [200, 102], [200, 150], [0, 150]], (x, y) => ((x + y * 4) % 11 === 0 ? '#c88e4e' : y > 136 ? '#c4843e' : '#e8ae68'))
  for (const [x, y, length] of [[18, 128, 16], [64, 138, 11], [118, 126, 14], [176, 136, 18]] as const) {
    grid.line(x, y, x + length, y - 3, '#f4ecd8')
    grid.line(x, y + 1, x + length, y - 2, '#a89c80')
    grid.rect(x + length - 1, y - 5, x + length + 1, y - 2, '#f4ecd8')
  }
  return grid
}

/** Where sand blows across the bones. */
export const DESERT_SAND: readonly Point[] = [[20, 118], [64, 108], [120, 124], [40, 136], [150, 112], [96, 142]]

// ── The Old Watch Fort's burned gate, at dusk ───────────────────────────────

export function paintBurnedGate(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 100, bands([[0, '#241c3a'], [28, '#4a2a4a'], [54, '#8a3e3e'], [78, '#d0703a']]))
  // The road beyond the gate, running off through the open arch
  grid.polygon([[0, 86], [60, 78], [140, 80], [200, 84], [200, 102], [0, 102]], '#2e2430')
  grid.rect(0, 100, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[100, '#4a3a2e'], [124, '#3a2c24'], [140, '#2a201a']]))
  grid.rect(0, 100, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => (speckle(x, y, 7) ? '#5a4836' : speckle(x, y, 11) ? '#1e1712' : null))
  grid.polygon([[82, 100], [118, 100], [150, 149], [50, 149]], (x, y) => ((x + y) % 7 === 0 ? '#6a5844' : '#584838'))
  // Two gate towers, scorched black from the bottom up
  for (const [left, right] of [[18, 70], [130, 182]] as const) {
    masonry(grid, left, 22, right, 108, '#6a6068', 9, 6)
    grid.rect(left, 22, right, 108, (x, y) => (y > 40 + ((x * 7) % 22) ? ((x + y) % 2 ? '#14100f' : null) : null))
    for (let x = left; x < right; x += 12) {
      masonry(grid, x, 14, x + 7, 22, '#6a6068', 5, 4)
    }
    grid.rect((left + right) / 2 - 3, 44, (left + right) / 2 + 2, 56, '#120c10')
  }
  // What's left of the arch and the gate: charred beams and one door hanging open
  grid.polygon([[70, 40], [86, 30], [96, 36], [90, 42], [70, 50]], '#3e383e')
  grid.polygon([[130, 40], [116, 33], [110, 40], [130, 50]], '#3e383e')
  for (const [x0, y0, x1, y1] of [[72, 66, 112, 62], [76, 104, 92, 58], [124, 106, 110, 72]] as const) {
    for (let thick = 0; thick < 3; thick++) {
      grid.line(x0, y0 + thick, x1, y1 + thick, thick === 1 ? '#2a1a14' : '#120c0a')
    }
  }
  grid.polygon([[70, 56], [84, 62], [84, 110], [70, 108]], (x, y) => (x % 4 === 0 ? '#0e0a08' : (x + y) % 9 === 0 ? '#e2803a' : '#241812'))
  grid.rect(71, 74, 83, 76, '#3a3a40')
  grid.rect(71, 92, 83, 94, '#3a3a40')
  // Rubble, a fallen banner, and spent arrows in the dirt
  for (const [x, y, size] of [[26, 122, 8], [40, 130, 5], [166, 126, 9], [182, 136, 6], [146, 138, 4]] as const) {
    grid.ellipse(x, y, size, size * 0.6, (px) => (px < x ? '#7a7078' : '#4a444c'))
  }
  grid.polygon([[56, 134], [92, 128], [96, 136], [60, 144]], '#7a1c18')
  grid.line(58, 139, 94, 132, '#a8281e')
  for (const [x, y] of [[120, 124], [128, 132], [112, 140], [20, 142]] as const) {
    grid.line(x, y, x + 3, y - 7, '#2a1a10')
    grid.set(x + 3, y - 8, '#c8c0a8')
  }
  return grid
}

/** Where the gate's charred timbers still smoulder. */
export const GATE_EMBERS: readonly Point[] = [[78, 84], [100, 62], [116, 90], [76, 104]]

// ── Harrow Ford, as Holt tells it: mud, a red river, and a broken bridge ─────

export function paintHarrowFord(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 84, bands([[0, '#5a5e66'], [26, '#7a7a78'], [50, '#a89a7e'], [70, '#c8ae80']]))
  for (let index = 0; index < 20; index++) {
    grid.ellipse((index * 43) % SCENE_WIDTH, (index * 7) % 30, 16, 5, index % 2 ? '#4a4e58' : '#686a70')
  }
  grid.polygon([[0, 84], [46, 70], [96, 82], [150, 68], [200, 80], [200, 92], [0, 92]], '#4a5044')
  // The far bank bristling with banners and spears, tiny in the rain
  for (let x = 6; x < SCENE_WIDTH; x += 7) {
    const tall = 8 + (x * 5) % 9
    grid.rect(x, 84 - tall, x, 88, '#22242a')
    if (x % 3 === 0) {
      grid.rect(x + 1, 84 - tall, x + 4, 84 - tall + 3, x % 2 ? '#8a2a22' : '#c8a040')
    }
  }
  grid.rect(0, 86, SCENE_WIDTH - 1, 92, '#3a3e30')
  // The river, stained and churning, and the old stone bridge broken in the middle
  grid.rect(0, 92, SCENE_WIDTH - 1, 118, (x, y) => ((x * 3 + y * 7) % 17 === 0 ? '#d8c8b0' : (x + y * 2) % 9 === 0 ? '#8a3a30' : y < 104 ? '#5a4a46' : '#6e3e36'))
  masonry(grid, 0, 72, 58, 96, '#8a8678', 8, 5)
  masonry(grid, 134, 74, 199, 96, '#8a8678', 8, 5)
  grid.polygon([[58, 72], [70, 78], [62, 84], [66, 96], [58, 96]], '#8a8678')
  grid.polygon([[134, 74], [124, 82], [130, 88], [126, 96], [134, 96]], '#8a8678')
  for (const [x, y] of [[80, 104], [96, 110], [112, 102], [70, 112]] as const) {
    grid.ellipse(x, y, 7, 3, (px) => (px < x ? '#a09c8c' : '#5a584e'))
  }
  // A banner pole stuck in the current, the old king's colours still flying
  grid.rect(100, 58, 101, 108, '#2a1a10')
  grid.polygon([[102, 58], [126, 62], [120, 68], [126, 74], [102, 72]], '#c8a040')
  grid.rect(108, 63, 113, 68, '#6e1a14')
  // The near bank: deep mud, boot-prints, a lost boot, and broken shields
  grid.rect(0, 116, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[116, '#4a3c2a'], [134, '#3a2e20']]))
  grid.rect(0, 116, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => (speckle(x, y, 6) ? '#5e4e38' : (x + y * 3) % 23 === 0 ? '#241c12' : null))
  grid.rect(158, 126, 163, 134, '#1e140c')
  grid.rect(158, 134, 170, 137, '#1e140c')
  grid.rect(159, 127, 161, 133, '#3a281a')
  for (const [x, y] of [[30, 130], [64, 142], [132, 138]] as const) {
    grid.ellipse(x, y, 7, 5, (px) => (px < x ? '#8a2a22' : '#5e1814'))
    grid.line(x - 6, y + 4, x + 6, y - 4, '#c8a040')
  }
  return grid
}

// ── The Grey Keep's courtyard, in the snow, with ravens on the wall ──────────

export function paintKeepCourtyard(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 60, bands([[0, '#3a4252'], [24, '#5a6472'], [46, '#8a94a0']]))
  // The great keep behind, grey on grey, with one lit window high up
  masonry(grid, 56, 10, 146, 106, '#5e6068', 11, 7)
  for (let x = 56; x < 144; x += 13) {
    masonry(grid, x, 2, x + 8, 10, '#5e6068', 5, 4)
  }
  for (const x of [38, 146]) {
    masonry(grid, x, 26, x + 18, 106, '#6e7078', 9, 6)
    grid.polygon([[x - 3, 26], [x + 9, 4], [x + 21, 26]], (px) => (px < x + 9 ? '#3a3e4c' : '#262a36'))
  }
  grid.rect(96, 26, 103, 38, '#ffd27a')
  grid.rect(99, 26, 100, 38, '#3a3a40')
  // Thirty-one new banners, stitched this spring, hanging from the wall in tatters
  for (let x = 62; x < 140; x += 13) {
    grid.polygon([[x, 44], [x + 8, 44], [x + 8, 66], [x + 5, 62], [x + 3, 69], [x, 64]], (px) => (px < x + 4 ? '#3a1c28' : '#26121c'))
    grid.rect(x + 3, 50, x + 5, 54, '#c8c8d0')
  }
  // The curtain wall with its snow-capped merlons
  masonry(grid, 0, 60, 38, 106, '#54565e', 9, 6)
  masonry(grid, 163, 60, 199, 106, '#54565e', 9, 6)
  for (const x of [2, 14, 26, 168, 180, 192]) {
    masonry(grid, x, 52, x + 7, 60, '#54565e', 4, 4)
    grid.rect(x, 51, x + 7, 53, '#eef2f6')
  }
  // The doors, thrown open, with a dark hall behind
  grid.rect(84, 76, 116, 106, '#0c0c12')
  grid.polygon([[84, 76], [100, 66], [116, 76]], '#0c0c12')
  grid.polygon([[84, 76], [76, 80], [76, 108], [84, 106]], '#3a2a1c')
  grid.polygon([[116, 76], [124, 80], [124, 108], [116, 106]], '#3a2a1c')
  // Deep snow, a trodden path, a sword planted in a drift, and a well in the corner
  grid.rect(0, 104, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[104, '#e4e8ee'], [126, '#d0d6e0'], [142, '#bcc4d0']]))
  grid.rect(0, 104, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => (speckle(x, y, 13) ? '#ffffff' : null))
  grid.polygon([[90, 106], [110, 106], [136, 149], [64, 149]], (x, y) => ((x * 2 + y) % 8 === 0 ? '#7a828e' : '#a0a8b4'))
  grid.rect(28, 112, 29, 136, '#c8d0d8')
  grid.rect(23, 118, 34, 119, '#c8a040')
  grid.rect(27, 112, 30, 113, '#c8a040')
  grid.ellipse(170, 124, 14, 6, '#5e6068')
  grid.ellipse(170, 122, 14, 6, '#eef2f6')
  grid.ellipse(170, 122, 9, 3, '#12141a')
  return grid
}

// ── The shells of houses on the way into the Cinder Fen ─────────────────────

export function paintBurnedVillage(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 92, bands([[0, '#2a2628'], [30, '#4a3e3a'], [58, '#7a5a44'], [78, '#a0704a']]))
  grid.ellipse(140, 44, 12, 12, '#d8a878')
  grid.ellipse(140, 44, 8, 8, '#f0c898')
  // Dead trees and a far row of ruined houses, faint through the falling ash
  for (const [x, top] of [[20, 58], [64, 66], [118, 62], [182, 56]] as const) {
    grid.polygon([[x, 92], [x + 7, top], [x + 14, 72], [x + 22, top + 4], [x + 28, 92]], '#4a3a36')
  }
  // Black water, reeds, and the walls of three burned houses
  grid.rect(0, 88, SCENE_WIDTH - 1, 106, (x, y) => ((x * 5 + y) % 19 === 0 ? '#7a5a44' : '#16141a'))
  for (const [left, right, top, peak] of [[8, 62, 54, 40], [136, 194, 50, 34], [76, 118, 70, 58]] as const) {
    const middle = (left + right) / 2
    grid.rect(left, top, right, 108, (x, y) => ((x + y) % 2 === 0 ? '#1a1518' : (x * 3 + y) % 7 === 0 ? '#3e2a22' : '#262022'))
    grid.polygon([[left, top], [middle, peak], [middle + 3, top - 2], [middle - 4, top + 8], [left, top + 8]], '#1a1518')
    grid.rect(middle - 5, top + 14, middle + 5, 108, '#050406')
    grid.rect(left + 4, top + 10, left + 11, top + 18, '#ffb03a')
    grid.rect(left + 6, top + 10, left + 7, top + 18, '#1a1518')
    grid.rect(right - 11, top + 10, right - 4, top + 18, '#050406')
    for (const [x0, x1] of [[middle - 14, middle + 8], [middle - 6, middle + 16]]) {
      grid.line(x0, top - 1, x1, peak + 2, '#0a080a')
    }
  }
  // Ash-covered ground, footprints, reeds, and a child's doll burned to the wire
  grid.rect(0, 104, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[104, '#6e6660'], [126, '#5a524e'], [142, '#46403e']]))
  grid.rect(0, 104, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, (x, y) => (speckle(x, y, 9) ? '#7e7670' : speckle(x, y, 71) ? '#e2803a' : null))
  for (let y = 112; y < 148; y += 7) {
    grid.rect(92 + (y % 2) * 8 + (y - 112) / 5, y, 95 + (y % 2) * 8 + (y - 112) / 5, y + 2, '#2e2a2a')
  }
  for (const [x, top] of [[10, 124], [16, 120], [22, 126], [176, 122], [184, 118], [190, 126]] as const) {
    grid.line(x, 140, x + 2, top, '#141014')
  }
  grid.ellipse(146, 130, 2.5, 2.5, '#1a1416')
  grid.line(146, 133, 146, 139, '#3a3638')
  grid.line(141, 134, 151, 134, '#3a3638')
  grid.line(146, 139, 142, 144, '#3a3638')
  grid.line(146, 139, 150, 144, '#3a3638')
  return grid
}

// ── A hill above the camp at night, the lights of town far off on the horizon ─

export function paintMothHill(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 88, bands([[0, '#070818'], [30, '#101438'], [56, '#1e2454'], [76, '#3a3468']]))
  for (let index = 0; index < 110; index++) {
    grid.set((index * 61) % SCENE_WIDTH, (index * 23) % 74, index % 6 === 0 ? '#f4f0e0' : index % 2 ? '#7a80b0' : '#4a5088')
  }
  // The band of the galaxy, a soft smear across the sky
  grid.polygon([[0, 46], [60, 22], [140, 2], [200, 0], [200, 12], [130, 22], [60, 44], [0, 62]], (x, y) => ((x * 3 + y * 5) % 4 === 0 ? '#3a4078' : null))
  // Far hills, and the town on the horizon: a warm, too-bright cluster of lights
  grid.polygon([[0, 88], [50, 76], [110, 84], [160, 78], [200, 86], [200, 100], [0, 100]], '#12142c')
  grid.ellipse(150, 84, 26, 9, (x, y) => ((x + y) % 2 === 0 ? '#5a3a48' : null))
  for (const [x, y] of [[132, 84], [138, 82], [143, 85], [148, 80], [153, 84], [158, 82], [164, 85], [150, 86], [141, 87]] as const) {
    grid.rect(x, y, x + 1, y + 1, '#ffd27a')
  }
  grid.rect(146, 72, 149, 84, '#2a2438')
  grid.polygon([[146, 72], [147.5, 66], [149, 72]], '#2a2438')
  // The valley and your camp, far below, its fires small and red
  grid.polygon([[0, 96], [70, 92], [200, 98], [200, 118], [0, 118]], '#0e1424')
  for (const [x, y, size] of [[26, 104, 5], [44, 100, 4], [62, 106, 5], [84, 102, 4]] as const) {
    grid.polygon([[x - size, y], [x, y - size], [x + size, y]], '#262c3c')
  }
  grid.rect(52, 105, 53, 106, '#e2803a')
  grid.rect(74, 103, 75, 104, '#e2803a')
  // The hilltop you stand on: long silver grass, a standing stone, a twisted tree
  grid.polygon([[0, 118], [50, 106], [120, 110], [200, 104], [200, 150], [0, 150]], (x, y) => ((x * 2 + y) % 6 === 0 ? '#3a5a60' : y > 134 ? '#121e28' : '#1c2c36'))
  for (let x = 1; x < SCENE_WIDTH; x += 3) {
    const height = 4 + (x * 11) % 8
    grid.line(x, 149, x + 2, 149 - height, x % 2 ? '#5a8088' : '#2e4a54')
  }
  grid.polygon([[22, 124], [24, 90], [32, 84], [38, 92], [38, 124]], (x) => (x < 30 ? '#6a7890' : '#3a4458'))
  grid.line(26, 102, 35, 96, '#9ae4d0')
  grid.polygon([[172, 118], [176, 80], [180, 118]], '#0a0c16')
  for (const [x0, y0, x1, y1] of [[176, 92, 158, 76], [177, 86, 192, 68], [176, 80, 172, 60], [166, 84, 158, 66]] as const) {
    grid.line(x0, y0, x1, y1, '#0a0c16')
    grid.line(x0, y0 + 1, x1, y1 + 1, '#0a0c16')
  }
  return grid
}

/** The lights of town on the horizon, for the slow pulse drawn over them. */
export const TOWN_LIGHTS: readonly Point[] = [[138, 83], [148, 81], [158, 83]]

// ── The war circle on the steppe: drums, torches, and Gorrak's riders ─────────

export function paintWarCircle(): PixelGrid {
  const grid = new PixelGrid(SCENE_WIDTH, SCENE_HEIGHT)
  grid.rect(0, 0, SCENE_WIDTH - 1, 74, bands([[0, '#1e1430'], [20, '#4a1c38'], [40, '#8e2a30'], [58, '#d8582a']]))
  grid.ellipse(100, 72, 34, 34, (_x, y) => (y <= 74 ? '#f0963a' : null))
  grid.ellipse(100, 72, 26, 26, (_x, y) => (y <= 74 ? '#ffc25a' : null))
  // Mounted riders in silhouette, ringing the fight, spears raised
  grid.rect(0, 70, SCENE_WIDTH - 1, 100, '#2a1218')
  for (let x = 2; x < SCENE_WIDTH; x += 15) {
    const y = 76 + (x * 3) % 5
    const rider = '#12080c'
    grid.ellipse(x + 6, y + 6, 7, 3.5, rider)
    grid.rect(x + 1, y + 8, x + 2, y + 16, rider)
    grid.rect(x + 10, y + 8, x + 11, y + 16, rider)
    grid.polygon([[x + 12, y + 5], [x + 16, y - 1], [x + 15, y + 5]], rider)
    grid.rect(x + 5, y - 5, x + 8, y + 4, rider)
    grid.ellipse(x + 6.5, y - 7, 2, 2, rider)
    grid.line(x + 3, y + 2, x + 1, y - 20, rider)
    if (x % 2) {
      grid.polygon([[x + 1, y - 20], [x - 7, y - 17], [x + 1, y - 14]], '#a8281e')
    }
  }
  // The trampled circle of bare red earth, ringed with war drums and torch poles
  grid.rect(0, 96, SCENE_WIDTH - 1, SCENE_HEIGHT - 1, bands([[96, '#6a2a1a'], [120, '#7e3620'], [140, '#5a2414']]))
  grid.ellipse(100, 128, 92, 24, (x, y) => ((x * 3 + y * 5) % 9 === 0 ? '#8a3e24' : (x + y) % 13 === 0 ? '#4a1e10' : '#9a4a2a'))
  grid.rect(0, 96, SCENE_WIDTH - 1, 106, (x, y) => ((x * 5 + y) % 3 === 0 ? '#a8502e' : null))
  for (const [x, y] of [[18, 110], [182, 110], [6, 138], [194, 138]] as const) {
    grid.ellipse(x, y, 9, 4, '#c8a878')
    grid.rect(x - 9, y, x + 9, y + 9, (px, py) => ((px + py) % 4 === 0 ? '#6e1a14' : px < x ? '#8a5a2e' : '#5a3a1e'))
    grid.ellipse(x, y + 9, 9, 3, '#3a2212')
  }
  for (const [x, y] of [[44, 104], [156, 104]] as const) {
    grid.rect(x, y - 24, x + 1, y, '#2a1a10')
    grid.rect(x - 2, y - 28, x + 3, y - 24, '#3a2a1e')
    grid.rect(x - 1, y - 31, x + 2, y - 28, '#ffb03a')
  }
  // A broken axe and a dented helm, left from whoever fought here last
  grid.line(122, 134, 142, 124, '#2a1a10')
  grid.polygon([[140, 118], [148, 120], [146, 130], [140, 128]], '#b4c0cf')
  grid.ellipse(58, 136, 6, 5, (x, y) => (y > 137 ? null : x < 58 ? '#b4c0cf' : '#6c7888'))
  grid.polygon([[52, 133], [47, 126], [54, 131]], '#e4dcc8')
  grid.polygon([[64, 133], [69, 126], [62, 131]], '#e4dcc8')
  return grid
}

/** Where the torches burn around the war circle. */
export const WAR_TORCHES: readonly Point[] = [[45, 75], [157, 75]]
