import { PixelGrid, litFromLeft, type Ramp } from './pixel'

/** Pet sprites are 24×24 pixels: chibi creatures with big shiny anime eyes. */
export const PET_SPRITE_SIZE = 24

type Point = readonly [number, number]

const WHITE = '#ffffff'
const PINK = '#e8a0a8'
const BLUSH = '#ff9fb0'
const PUPIL = '#1a1420'

/** Mirrors a column across the middle of the sprite, for symmetrical ears, wings, and legs. */
const mirrorX = (x: number) => PET_SPRITE_SIZE - x
const mirrored = (points: readonly Point[]): Point[] => points.map(([x, y]) => [mirrorX(x), y])

/** A big anime eye, `width`×`height` pixels: a white highlight top-left and a lighter glint bottom-right. */
function eye(grid: PixelGrid, x: number, y: number, iris: string, glint: string, width = 2, height = 3): void {
  grid.rect(x, y, x + width - 1, y + height - 1, iris)
  grid.set(x, y, WHITE)
  grid.set(x + width - 1, y + height - 1, glint)
}

function blush(grid: PixelGrid, y: number, left: number, right: number): void {
  grid.set(left, y, BLUSH)
  grid.set(right, y, BLUSH)
}

const shaded = (tones: Ramp, cx: number, halfWidth: number) => litFromLeft(tones, cx, halfWidth)

function rat(grid: PixelGrid): void {
  const fur: Ramp = { light: '#c4bab0', base: '#9a8f86', dark: '#6e645c' }
  grid.line(17, 19, 20, 17, PINK)
  grid.line(20, 17, 22, 12, PINK)
  grid.ellipse(12, 16, 7, 5.2, shaded(fur, 12, 7))
  for (const x of [7, 17]) {
    grid.ellipse(x, 6.5, 2.6, 2.6, fur.dark)
    grid.ellipse(x, 6.5, 1.4, 1.4, PINK)
  }
  grid.ellipse(12, 11, 5.2, 4.6, shaded(fur, 12, 5.2))
  grid.ellipse(12, 13, 2, 1.2, fur.light)
  eye(grid, 9, 9, PUPIL, '#5a4a4a', 2, 2)
  eye(grid, 14, 9, PUPIL, '#5a4a4a', 2, 2)
  grid.set(12, 13, PINK)
  for (const x of [6, 7, 17, 18]) {
    grid.set(x, 13, fur.dark)
  }
  blush(grid, 12, 8, 16)
  grid.rect(8, 20, 9, 20, PINK)
  grid.rect(14, 20, 15, 20, PINK)
}

function bat(grid: PixelGrid): void {
  const wing: Ramp = { light: '#6a4a7a', base: '#4a2e5a', dark: '#2e1c3a' }
  const body: Ramp = { light: '#5a3a6a', base: '#3a2448', dark: '#241630' }
  const leftWing: Point[] = [[10, 11], [1, 6], [2, 10], [4, 9], [4, 13], [6, 12], [7, 16], [10, 15]]
  grid.polygon(leftWing, wing.base)
  grid.polygon(mirrored(leftWing), wing.dark)
  grid.line(2, 8, 9, 13, wing.dark)
  grid.line(22, 8, 15, 13, wing.light)
  grid.polygon([[9, 9], [9, 4], [11, 8]], body.base)
  grid.polygon(mirrored([[9, 9], [9, 4], [11, 8]]), body.dark)
  grid.ellipse(12, 13, 4, 4.5, shaded(body, 12, 4))
  eye(grid, 10, 11, '#e04a6a', '#ff9ab0', 2, 2)
  eye(grid, 13, 11, '#e04a6a', '#ff9ab0', 2, 2)
  grid.set(11, 16, WHITE)
  grid.set(13, 16, WHITE)
}

function toad(grid: PixelGrid): void {
  const skin: Ramp = { light: '#8ac86a', base: '#5a9a4a', dark: '#3a6a30' }
  grid.ellipse(5, 20, 2.6, 1.5, skin.dark)
  grid.ellipse(19, 20, 2.6, 1.5, skin.dark)
  grid.ellipse(12, 16, 8.5, 5.5, shaded(skin, 12, 8.5))
  grid.ellipse(12, 18, 5, 3, '#c8d890')
  for (const x of [8, 16]) {
    grid.ellipse(x, 10, 3, 3, x < 12 ? skin.light : skin.base)
    grid.rect(x - 1, 9, x, 10, '#e8b33a')
    grid.rect(x - 1, 10, x, 10, PUPIL)
    grid.set(x - 1, 9, WHITE)
  }
  grid.line(8, 15, 16, 15, skin.dark)
  for (const [x, y] of [[5, 15], [19, 14], [10, 13], [15, 18]] as const) {
    grid.set(x, y, skin.dark)
  }
  blush(grid, 13, 6, 18)
}

function cat(grid: PixelGrid): void {
  const fur: Ramp = { light: '#4a4058', base: '#2a2433', dark: '#17131c' }
  grid.line(17, 20, 21, 17, fur.base)
  grid.line(21, 17, 21, 12, fur.base)
  grid.set(20, 12, fur.light)
  grid.ellipse(12, 18, 6, 4.5, shaded(fur, 12, 6))
  const ear: Point[] = [[6, 9], [6, 3], [10, 7]]
  grid.polygon(ear, fur.base)
  grid.polygon(mirrored(ear), fur.dark)
  grid.ellipse(12, 11, 6, 5, shaded(fur, 12, 6))
  grid.set(7, 6, PINK)
  grid.set(17, 6, PINK)
  eye(grid, 8, 10, '#a8c83a', '#e0f08a')
  eye(grid, 15, 10, '#a8c83a', '#e0f08a')
  grid.set(9, 11, PUPIL)
  grid.set(15, 11, PUPIL)
  grid.set(12, 13, PINK)
  grid.set(11, 14, fur.dark)
  grid.set(13, 14, fur.dark)
  blush(grid, 13, 7, 17)
}

function spider(grid: PixelGrid): void {
  const shell: Ramp = { light: '#6a5a7a', base: '#3a2e48', dark: '#221a2c' }
  for (const leg of [
    [[8, 12], [3, 8], [2, 12]],
    [[8, 14], [2, 13], [1, 17]],
    [[8, 16], [3, 18], [2, 21]],
    [[9, 17], [5, 21], [5, 23]],
  ] as const) {
    grid.line(leg[0][0], leg[0][1], leg[1][0], leg[1][1], shell.dark)
    grid.line(leg[1][0], leg[1][1], leg[2][0], leg[2][1], shell.dark)
    grid.line(mirrorX(leg[0][0]), leg[0][1], mirrorX(leg[1][0]), leg[1][1], shell.dark)
    grid.line(mirrorX(leg[1][0]), leg[1][1], mirrorX(leg[2][0]), leg[2][1], shell.dark)
  }
  grid.ellipse(12, 16, 5, 4.5, shaded(shell, 12, 5))
  grid.rect(11, 15, 13, 17, '#e8e0d0')
  grid.set(11, 16, shell.dark)
  grid.set(13, 16, shell.dark)
  grid.ellipse(12, 10, 3.6, 3, shaded(shell, 12, 3.6))
  eye(grid, 10, 9, '#e0304a', '#ff8a9a', 2, 2)
  eye(grid, 13, 9, '#e0304a', '#ff8a9a', 2, 2)
  grid.set(12, 8, '#e0304a')
}

function adder(grid: PixelGrid): void {
  const scales: Ramp = { light: '#8ac85a', base: '#5a9a3a', dark: '#3a6a24' }
  grid.ellipse(12, 19, 8, 3.5, shaded(scales, 12, 8))
  grid.ellipse(12, 16, 6, 3, shaded(scales, 12, 6))
  grid.ellipse(12, 13.5, 4, 2.4, shaded(scales, 12, 4))
  grid.polygon([[11, 13], [15, 13], [16, 9], [13, 9]], scales.base)
  grid.ellipse(15, 7.5, 4.2, 3, shaded(scales, 15, 4.2))
  for (const [x, y] of [[6, 19], [9, 20], [15, 20], [18, 19], [8, 16], [16, 16], [11, 14]] as const) {
    grid.set(x, y, scales.dark)
  }
  eye(grid, 13, 6, '#e8d040', '#fff2a0', 2, 2)
  eye(grid, 16, 6, '#e8d040', '#fff2a0', 2, 2)
  grid.set(14, 7, PUPIL)
  grid.set(17, 7, PUPIL)
  grid.line(19, 9, 21, 9, '#e0304a')
  grid.set(22, 8, '#e0304a')
  grid.set(22, 10, '#e0304a')
}

function wolf(grid: PixelGrid): void {
  const fur: Ramp = { light: '#e0e4ec', base: '#8a90a0', dark: '#5a6070' }
  const ear: Point[] = [[6, 9], [5, 2], [10, 6]]
  grid.polygon(ear, fur.base)
  grid.polygon(mirrored(ear), fur.dark)
  grid.set(6, 6, '#3a3040')
  grid.set(18, 6, '#3a3040')
  const cheek: Point[] = [[6, 13], [3, 18], [8, 17]]
  grid.polygon(cheek, fur.light)
  grid.polygon(mirrored(cheek), fur.base)
  grid.ellipse(12, 13, 7, 6, shaded(fur, 12, 7))
  grid.rect(11, 7, 12, 10, fur.light)
  grid.ellipse(12, 16, 3.4, 2.6, '#f0f2f6')
  grid.rect(11, 14, 12, 14, PUPIL)
  grid.set(12, 17, fur.dark)
  eye(grid, 8, 11, '#3aa8e0', '#9ae0ff', 2, 2)
  eye(grid, 14, 11, '#3aa8e0', '#9ae0ff', 2, 2)
}

function owl(grid: PixelGrid): void {
  const feathers: Ramp = { light: '#e0bc88', base: '#a87a4a', dark: '#6a4a2a' }
  grid.ellipse(12, 14, 7, 8, shaded(feathers, 12, 7))
  grid.ellipse(6, 15, 2.6, 5, feathers.dark)
  grid.ellipse(18, 15, 2.6, 5, feathers.dark)
  grid.ellipse(9.5, 11, 3.4, 3.6, '#f4eadc')
  grid.ellipse(14.5, 11, 3.4, 3.6, '#f4eadc')
  eye(grid, 8, 10, PUPIL, '#5a4a6a', 3, 3)
  eye(grid, 13, 10, PUPIL, '#5a4a6a', 3, 3)
  grid.set(12, 13, '#e8b33a')
  grid.set(12, 14, '#c08020')
  for (const [x, y] of [[10, 17], [13, 18], [11, 20], [14, 16]] as const) {
    grid.set(x, y, feathers.dark)
  }
  grid.set(10, 22, '#e8a040')
  grid.set(14, 22, '#e8a040')
}

function panther(grid: PixelGrid): void {
  const fur: Ramp = { light: '#4a3a5a', base: '#241c30', dark: '#120e18' }
  grid.ellipse(12, 19, 7, 4, shaded(fur, 12, 7))
  grid.ellipse(7, 7, 2.4, 2.4, fur.base)
  grid.ellipse(17, 7, 2.4, 2.4, fur.dark)
  grid.ellipse(12, 12, 6.5, 5.5, shaded(fur, 12, 6.5))
  grid.rect(8, 11, 10, 12, '#b07ae8')
  grid.rect(14, 11, 16, 12, '#b07ae8')
  grid.set(9, 11, PUPIL)
  grid.set(15, 11, PUPIL)
  grid.set(8, 11, WHITE)
  grid.set(14, 11, WHITE)
  grid.set(12, 14, '#5a4a6a')
  for (const [x, y] of [[6, 18], [17, 19], [14, 21], [9, 20]] as const) {
    grid.set(x, y, fur.light)
  }
  for (const [x, y] of [[3, 10], [21, 8], [20, 16]] as const) {
    grid.set(x, y, '#d0a8ff')
  }
}

function scorpion(grid: PixelGrid): void {
  const bone: Ramp = { light: '#f4ecdc', base: '#d8ccb0', dark: '#a69a7c' }
  for (const [x0, y0, x1, y1] of [[8, 18, 6, 21], [10, 19, 9, 22], [14, 19, 15, 22], [16, 18, 18, 21]] as const) {
    grid.line(x0, y0, x1, y1, bone.dark)
  }
  grid.line(8, 15, 5, 12, bone.base)
  grid.ellipse(4, 10.5, 2.4, 2, bone.light)
  grid.set(3, 9, bone.dark)
  grid.line(16, 16, 19, 18, bone.base)
  grid.ellipse(21, 18, 2.2, 1.8, bone.base)
  for (const [cx, cy] of [[17, 13], [19, 10], [19, 7], [17, 4.5]] as const) {
    grid.ellipse(cx, cy, 2, 2, bone.base)
  }
  grid.polygon([[15.5, 3], [13, 1.5], [15, 5.5]], '#c0392b')
  grid.ellipse(12, 16, 5, 3.5, shaded(bone, 12, 5))
  grid.line(10, 17, 14, 17, bone.dark)
  eye(grid, 10, 14, '#e0304a', '#ff8a9a', 2, 2)
  eye(grid, 13, 14, '#e0304a', '#ff8a9a', 2, 2)
}

function kraken(grid: PixelGrid): void {
  const hide: Ramp = { light: '#9a7af0', base: '#5a3ab8', dark: '#36207a' }
  for (const [start, sway] of [[7, -2], [9, -1], [12, 0], [15, 1], [17, 2]] as const) {
    grid.line(start, 14, start + sway, 19, hide.dark)
    grid.line(start + sway, 19, start + sway * 2 - Math.sign(sway || 1), 22, hide.dark)
    grid.set(start + sway, 18, hide.light)
  }
  grid.ellipse(12, 9, 7, 6.5, shaded(hide, 12, 7))
  for (const [x, y] of [[8, 5], [16, 4], [12, 3], [14, 6]] as const) {
    grid.set(x, y, '#e6f8ff')
  }
  eye(grid, 8, 9, '#3ad8f0', '#bff6ff')
  eye(grid, 14, 9, '#3ad8f0', '#bff6ff')
  blush(grid, 13, 7, 17)
}

function stag(grid: PixelGrid): void {
  const spirit: Ramp = { light: '#f0fcff', base: '#a8e0f0', dark: '#6ab0c8' }
  for (const [x0, y0, x1, y1] of [[9, 6, 6, 2], [7, 4, 4, 3], [6, 2, 5, 0], [8, 5, 9, 1]] as const) {
    grid.line(x0, y0, x1, y1, spirit.light)
    grid.line(mirrorX(x0), y0, mirrorX(x1), y1, spirit.base)
  }
  grid.polygon([[9, 15], [15, 15], [17, 23], [7, 23]], shaded(spirit, 12, 5))
  grid.ellipse(7, 9, 2.2, 1.2, spirit.base)
  grid.ellipse(17, 9, 2.2, 1.2, spirit.dark)
  grid.ellipse(12, 11, 4, 4.5, shaded(spirit, 12, 4))
  grid.ellipse(12, 15, 2.6, 2.4, spirit.light)
  eye(grid, 9, 10, '#3ad8f0', '#bff6ff', 2, 2)
  eye(grid, 14, 10, '#3ad8f0', '#bff6ff', 2, 2)
  grid.set(12, 16, spirit.dark)
  for (const [x, y] of [[3, 12], [20, 6], [19, 18], [4, 20]] as const) {
    grid.set(x, y, WHITE)
  }
}

const PAINTERS: Record<string, (grid: PixelGrid) => void> = {
  rat,
  bat,
  toad,
  cat,
  spider,
  adder,
  wolf,
  owl,
  panther,
  scorpion,
  kraken,
  stag,
}

/** Paints a pet as a 24×24 pixel sprite, or null for a pet id with no sprite. */
export function paintPet(petId: string): PixelGrid | null {
  const painter = PAINTERS[petId]
  if (!painter) {
    return null
  }
  const grid = new PixelGrid(PET_SPRITE_SIZE)
  painter(grid)
  grid.outline()
  return grid
}
