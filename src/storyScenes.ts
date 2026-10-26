import { bands, speckle } from './marketPixels'
import { PixelGrid, shade } from './pixel'

/** Story scenes are painted 200×150 and stretched across the reader's stage. */
export const SCENE_WIDTH = 200
export const SCENE_HEIGHT = 150

type Point = readonly [number, number]

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
