import { EYE_COLORS, HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES, colorOf, visibleHairStyle, type Appearance } from './hero'
import { PixelGrid, litFromLeft, ramp, shade, type Ramp } from './pixel'

/** The front-facing portrait is 32×32 pixels: an anime-style head and shoulders. */
export const HERO_GRID_SIZE = 32

type Point = readonly [number, number]

const STEEL: Ramp = { light: '#eef3f8', base: '#b4c0cf', dark: '#7c889a' }
const BLACK_STEEL: Ramp = { light: '#5d5d66', base: '#2c2c33', dark: '#151519' }
const BONE: Ramp = { light: '#efe6d0', base: '#d8ccb0', dark: '#a69a7c' }
const LEATHER: Ramp = { light: '#6a5a48', base: '#4a3f33', dark: '#2e261e' }
const HAT_FELT: Ramp = { light: '#7a5aa8', base: '#4a347a', dark: '#2c1f4a' }
const ORB: Ramp = { light: '#d4b0ff', base: '#a070e0', dark: '#6a3aa8' }
const GOLD = '#e8b33a'
const GOLD_DARK = '#a87a1e'
const WOOD = '#7a4a28'
const WOOD_DARK = '#4e2e18'
const BLOOD = '#c0392b'
const LASH = '#2a1630'
const WHITE = '#ffffff'
const LIPS = '#c4566a'
const BLUSH = '#ff9fb0'
const SLIT = '#0a0a0c'
const EMBER = '#e2803a'
const FLAME_CORE = '#ffd27a'
const GLOW = '#fff1c4'
const STAR = '#f4d78a'

/** The middle of the face; the portrait is drawn symmetrically around it. */
const MID = 15.5

const tones = (colors: Ramp) => [colors.light, colors.base, colors.dark]

/** The eyes: a lash line, a three-tone iris, and white highlights. `left` is the eye's leftmost column. */
function paintEye(grid: PixelGrid, left: number, mirrored: boolean, iris: Ramp, brow: string): void {
  const inner = mirrored ? left : left + 1
  const outer = mirrored ? left + 3 : left
  grid.rect(left, 13, left + 3, 13, LASH)
  grid.set(mirrored ? left + 4 : left - 1, 12, LASH)
  grid.rect(inner, 14, inner + 2, 14, iris.dark)
  grid.rect(inner, 15, inner + 2, 15, iris.base)
  grid.rect(inner, 16, inner + 2, 16, iris.light)
  grid.set(outer, 15, WHITE)
  grid.set(outer, 16, WHITE)
  grid.set(mirrored ? left + 1 : left + 2, 14, WHITE)
  grid.rect(inner, 11, inner + 2, 11, brow)
}

function paintBehind(grid: PixelGrid, appearance: Appearance, hair: Ramp, cloth: Ramp): void {
  if (appearance.outfit === 'cloak' && appearance.hat === 'none') {
    grid.ellipse(MID, 12, 10, 10.5, cloth.dark)
  }
  const style = visibleHairStyle(appearance)
  if (style && style !== 'bald' && style !== 'mohawk') {
    grid.ellipse(MID, 12, 9, 9.5, hair.dark)
  }
  if (style === 'long') {
    grid.rect(7, 12, 24, 25, (x, y) => (y > 23 && (x + y) % 2 ? null : x < 11 ? hair.base : hair.dark))
  }
}

/** Which way the hero faces: the front portrait appears around the app, the back only in character customization. */
export type Facing = 'front' | 'back'

function paintBody(grid: PixelGrid, appearance: Appearance, cloth: Ramp, facing: Facing): void {
  grid.ellipse(MID, 33, 14.5, 9.5, litFromLeft(cloth, MID, 14.5))
  const clothTones = tones(cloth)

  switch (appearance.outfit) {
    case 'armor':
    case 'black-plate': {
      const metal = appearance.outfit === 'armor' ? STEEL : BLACK_STEEL
      if (facing === 'back') {
        // The backplate, with a ridge down the spine.
        grid.rect(11, 24, 20, 31, litFromLeft(metal, MID, 5))
        grid.rect(15, 24, 16, 31, metal.dark)
      } else if (appearance.outfit === 'armor') {
        // A tabard down the middle, with a gold crest.
        grid.rect(13, 24, 18, 31, cloth.base)
        for (const [x, y] of [[15, 26], [16, 26], [14, 27], [15, 27], [16, 27], [17, 27], [15, 28], [16, 28]] as const) {
          grid.set(x, y, GOLD)
        }
        grid.rect(15, 29, 16, 29, GOLD_DARK)
      }
      grid.ellipse(6, 25, 5, 3.6, (_x, y) => (y < 24 ? metal.light : metal.base))
      grid.ellipse(25, 25, 5, 3.6, (_x, y) => (y < 24 ? metal.base : metal.dark))
      grid.rect(12, 21, 19, 23, litFromLeft(metal, MID, 4))
      if (appearance.outfit === 'armor') {
        grid.set(4, 24, WHITE)
        grid.set(13, 22, WHITE)
      } else {
        for (const [x, y] of [[3, 21], [5, 20], [8, 21], [28, 21], [26, 20], [23, 21]] as const) {
          grid.set(x, y, metal.dark)
        }
        for (const [x, y] of [[5, 26], [6, 27], [26, 26], [25, 27], [13, 28], [18, 29]] as const) {
          grid.recolor(x, y, EMBER, [...tones(metal), ...clothTones])
        }
      }
      break
    }
    case 'robe':
      if (facing === 'back') {
        grid.rect(11, 22, 20, 22, GOLD)
        grid.line(15, 24, 15, 31, cloth.dark)
        for (const [x, y] of [[6, 28], [24, 27], [19, 29]] as const) {
          grid.recolor(x, y, STAR, clothTones)
        }
        break
      }
      grid.polygon(
        [
          [11.5, 22],
          [19.5, 22],
          [15.5, 29],
        ],
        GOLD,
      )
      grid.polygon(
        [
          [12.5, 22],
          [18.5, 22],
          [15.5, 27.5],
        ],
        cloth.dark,
      )
      for (const [x, y] of [[6, 28], [24, 27], [10, 30]] as const) {
        grid.recolor(x, y, STAR, clothTones)
      }
      grid.line(21, 28, 22, 31, cloth.dark)
      break
    case 'cloak':
      if (facing === 'back') {
        // The cape hangs over the whole back.
        grid.ellipse(MID, 33, 13.5, 9, litFromLeft({ light: cloth.base, base: cloth.dark, dark: shade(cloth.dark, -0.3) }, MID, 13.5))
        grid.line(15, 25, 15, 31, shade(cloth.dark, -0.3))
        break
      }
      grid.line(9, 24, 7, 31, cloth.dark)
      grid.line(22, 24, 24, 31, cloth.dark)
      grid.rect(15, 23, 16, 24, GOLD)
      grid.set(15, 23, GLOW)
      break
  }
}

function paintFace(grid: PixelGrid, appearance: Appearance, skin: Ramp, hair: Ramp, iris: Ramp): void {
  grid.rect(14, 19, 17, 22, (x) => (x > 15 ? skin.dark : skin.base))
  const shading = litFromLeft(skin, MID, 6.4)
  grid.ellipse(MID, 13.5, 6.4, 6.6, (x, y) => (y > 15 ? null : shading(x, y)))
  grid.polygon(
    [
      [9.1, 14.5],
      [21.9, 14.5],
      [19, 19.5],
      [15.5, 21.5],
      [12, 19.5],
    ] as Point[],
    shading,
  )
  const brow = appearance.hairStyle === 'bald' || appearance.hairStyle === 'mohawk' ? skin.dark : hair.dark
  paintEye(grid, 10, false, iris, brow)
  paintEye(grid, 18, true, iris, brow)
  grid.set(16, 17, skin.dark)
  grid.rect(15, 19, 16, 19, LIPS)
  for (const x of [11, 12, 19, 20]) {
    grid.set(x, 18, BLUSH)
  }
}

/** Spiky anime bangs that fall between the eyes. */
const BANGS: Point[][] = [
  [[8, 8], [7.5, 15], [11, 9]],
  [[10, 9], [11.5, 14], [13.5, 9]],
  [[13, 9], [15, 13.5], [17, 9]],
  [[16.5, 9], [19, 14], [20.5, 9]],
  [[19.5, 9], [22.5, 16], [23.5, 8]],
]

/** The shine band across the top of the hair. */
const SHINE: Point[] = [[11, 5], [12, 5], [13, 4], [14, 4], [15, 4], [16, 4], [17, 4], [18, 5], [19, 5]]

function paintHair(grid: PixelGrid, appearance: Appearance, hair: Ramp, skin: Ramp, cloth: Ramp): void {
  const shading = litFromLeft(hair, MID, 7.5)
  const capAndBangs = (sideLength: number) => {
    grid.ellipse(MID, 9, 7.6, 5.6, (x, y) => (y <= 9 ? shading(x, y) : null))
    for (const bang of BANGS) {
      grid.polygon(bang, shading)
    }
    grid.rect(8, 10, 9, sideLength, hair.base)
    grid.rect(22, 10, 23, sideLength, hair.dark)
    for (const [x, y] of SHINE) {
      grid.set(x, y, hair.light)
    }
  }

  switch (visibleHairStyle(appearance)) {
    case 'short':
      capAndBangs(17)
      break
    case 'long':
      capAndBangs(24)
      break
    case 'spiky':
      for (const spike of [
        [[11, 4], [9, 0], [15, 3]],
        [[16, 3], [21, 0], [20, 5]],
        [[13, 4], [15.5, -1], [18, 4]],
      ] as const) {
        grid.polygon(spike, shading)
      }
      capAndBangs(19)
      break
    case 'topknot':
      grid.ellipse(MID, 3, 2.8, 2.6, shading)
      capAndBangs(16)
      grid.rect(14, 5, 17, 5, BLOOD)
      break
    case 'mohawk':
      grid.rect(10, 8, 21, 9, (x) => ((x + 1) % 2 ? skin.dark : skin.base))
      grid.rect(14, 1, 17, 10, (x) => (x === 14 ? hair.light : x === 17 ? hair.dark : hair.base))
      grid.set(14, 0, hair.base)
      grid.set(16, 0, hair.base)
      break
    case 'bald':
      grid.rect(12, 8, 13, 8, skin.light)
      break
  }

  if (appearance.outfit === 'cloak' && appearance.hat === 'none') {
    // The hood drapes over the top of the head.
    grid.ellipse(MID, 9, 9, 6.5, (x, y) => (y <= 6 ? litFromLeft(cloth, MID, 9)(x, y) : null))
  }
}

function paintHat(grid: PixelGrid, appearance: Appearance, iris: Ramp, facing: Facing): void {
  const front = facing === 'front'
  switch (appearance.hat) {
    case 'pointed':
      grid.polygon(
        [
          [8, 8.5],
          [23, 8.5],
          [19, 1],
          [17, -1],
        ],
        litFromLeft(HAT_FELT, MID, 7),
      )
      grid.set(20, 0, HAT_FELT.base)
      grid.set(21, 1, HAT_FELT.dark)
      grid.rect(9, 7, 22, 7, GOLD)
      grid.set(12, 7, GLOW)
      grid.rect(4, 8, 27, 9, (_x, y) => (y === 8 ? HAT_FELT.base : HAT_FELT.dark))
      grid.set(17, 3, STAR)
      break
    case 'helm':
      grid.ellipse(MID, 13, 7.2, 8.6, litFromLeft(STEEL, MID, 7.2))
      grid.rect(15, 5, 16, 13, STEEL.light)
      if (front) {
        grid.rect(9, 15, 22, 15, SLIT)
        grid.set(12, 15, iris.base)
        grid.set(19, 15, iris.base)
        for (const [x, y] of [[18, 18], [20, 18], [18, 20], [20, 20]] as const) {
          grid.set(x, y, SLIT)
        }
      } else {
        for (const [x, y] of [[10, 13], [21, 13], [12, 19], [19, 19]] as const) {
          grid.set(x, y, STEEL.dark)
        }
      }
      grid.set(11, 8, WHITE)
      break
    case 'crown':
      grid.rect(9, 6, 22, 7, litFromLeft({ light: '#ffe08a', base: GOLD, dark: GOLD_DARK }, MID, 6.5))
      for (const x of [9, 12, 15, 16, 19, 22]) {
        grid.rect(x, x === 15 || x === 16 ? 2 : 3, x, 5, GOLD)
      }
      if (front) {
        grid.rect(15, 6, 16, 6, BLOOD)
      }
      break
    case 'plague-mask':
      if (!front) {
        // From behind, only the mask's strap shows under the hat.
        grid.rect(8, 14, 23, 14, LEATHER.dark)
        grid.rect(5, 7, 26, 7, '#1d1a16')
        grid.rect(9, 2, 22, 6, (x) => (x < 12 ? '#3a342c' : '#1d1a16'))
        grid.rect(9, 6, 22, 6, '#4d1a16')
        break
      }
      grid.ellipse(MID, 14.5, 6.6, 3.6, litFromLeft(LEATHER, MID, 6.6))
      grid.polygon(
        [
          [12.5, 16],
          [18.5, 16],
          [16.5, 25],
          [15.5, 26],
        ],
        litFromLeft(LEATHER, MID, 3),
      )
      for (const left of [11, 18]) {
        grid.rect(left, 13, left + 2, 15, '#1c2a24')
        grid.set(left, 13, '#7fa898')
      }
      grid.rect(5, 7, 26, 7, '#1d1a16')
      grid.rect(9, 2, 22, 6, (x) => (x < 12 ? '#3a342c' : '#1d1a16'))
      grid.rect(9, 6, 22, 6, '#4d1a16')
      break
    case 'horned-helm': {
      const horn: Point[] = [
        [10, 7],
        [7, 4],
        [4, 0],
        [3, -2],
        [5, 2],
        [7, 6],
        [9, 9],
      ]
      grid.polygon(horn, (_x, y) => (y < 3 ? BONE.light : BONE.base))
      grid.polygon(
        horn.map(([x, y]) => [2 * MID - x, y] as const),
        (_x, y) => (y < 3 ? BONE.base : BONE.dark),
      )
      grid.ellipse(MID, 9, 7.8, 5.8, (x, y) => (y <= 9 ? litFromLeft(STEEL, MID, 7.8)(x, y) : null))
      grid.rect(8, 9, 9, 17, STEEL.base)
      grid.rect(22, 9, 23, 17, STEEL.dark)
      if (front) {
        grid.rect(15, 8, 16, 15, STEEL.dark)
      }
      grid.set(10, 5, WHITE)
      break
    }
    case 'ember-crown':
      for (const flame of [
        [[8.5, 6], [10, 0], [11.5, 6]],
        [[11.5, 6], [14, -2], [16, 6]],
        [[15, 6], [17.5, -1], [19.5, 6]],
        [[19.5, 6], [21.5, 1], [23, 6]],
      ] as const) {
        grid.polygon(flame, EMBER)
      }
      grid.rect(13, 1, 14, 5, FLAME_CORE)
      grid.rect(17, 2, 17, 5, FLAME_CORE)
      grid.rect(10, 3, 10, 5, FLAME_CORE)
      grid.rect(9, 6, 22, 7, litFromLeft({ light: '#ffe08a', base: GOLD, dark: GOLD_DARK }, MID, 6.5))
      if (front) {
        grid.rect(15, 6, 16, 6, '#ffb347')
      }
      break
  }
}

function paintHeldItem(grid: PixelGrid, appearance: Appearance): void {
  switch (appearance.heldItem) {
    case 'wand':
      grid.line(24, 31, 28, 21, WOOD)
      grid.set(28, 20, GLOW)
      for (const [x, y] of [[27, 19], [29, 19], [28, 18]] as const) {
        grid.set(x, y, FLAME_CORE)
      }
      break
    case 'staff':
      grid.rect(27, 6, 28, 31, (x) => (x === 27 ? WOOD : WOOD_DARK))
      grid.ellipse(28, 3.5, 2.6, 2.6, (x) => (x < 28 ? ORB.light : ORB.base))
      grid.set(27, 2, WHITE)
      grid.set(31, 1, ORB.light)
      for (let y = 24; y <= 27; y++) {
        grid.set(y % 2 ? 27 : 28, y, '#3a2416')
      }
      break
    case 'sword':
      grid.rect(27, 6, 27, 23, STEEL.light)
      grid.rect(28, 6, 28, 23, STEEL.base)
      grid.set(27, 5, STEEL.light)
      grid.rect(25, 24, 30, 24, GOLD)
      grid.rect(27, 25, 28, 31, (_x, y) => (y % 2 ? '#3a2416' : '#6a4228'))
      break
    case 'lantern':
      for (const [x, y] of [[26, 20], [27, 19], [28, 19], [29, 20]] as const) {
        grid.set(x, y, '#3a3226')
      }
      grid.rect(25, 21, 30, 27, '#5a4520')
      grid.rect(26, 22, 29, 26, '#ffc56b')
      grid.rect(27, 23, 28, 25, GLOW)
      break
    case 'flame-sword':
      grid.rect(27, 6, 28, 23, (_x, y) => (y < 11 ? GLOW : y < 17 ? '#ffb347' : EMBER))
      grid.set(27, 5, GLOW)
      for (const [x, y] of [[26, 9], [29, 12], [26, 16], [29, 19]] as const) {
        grid.set(x, y, EMBER)
      }
      grid.rect(25, 24, 30, 24, BLACK_STEEL.base)
      grid.rect(27, 25, 28, 31, (_x, y) => (y % 2 ? '#3a2416' : '#6a4228'))
      break
    case 'scythe':
      grid.line(25, 31, 29, 3, WOOD)
      grid.polygon(
        [
          [29.5, 1],
          [29.5, 3.5],
          [24, 3.5],
          [19, 5.5],
          [15.5, 8],
          [17.5, 4],
          [23, 1.5],
        ],
        (_x, y) => (y <= 3 ? STEEL.light : STEEL.base),
      )
      break
  }
}

const HORN: Ramp = { light: '#f0e6cc', base: '#cdbd98', dark: '#8f7f62' }
const TIEFLING_HORN: Ramp = { light: '#8a6a90', base: '#5a3e62', dark: '#36243c' }
const TUSK = '#f4ecdc'

/** Paints a shape on the left of the face and its mirror image on the right. */
function pair(grid: PixelGrid, points: readonly Point[], tones: Ramp): void {
  grid.polygon(points, (_x, y) => (y < Math.min(...points.map(([, py]) => py)) + 2 ? tones.light : tones.base))
  grid.polygon(
    points.map(([x, y]) => [2 * MID - x, y] as const),
    tones.dark,
  )
}

/** A dwarf's beard; from behind, only the sides poke out past the jaw. */
function paintBeard(grid: PixelGrid, hair: Ramp, facing: Facing): void {
  if (facing === 'back') {
    grid.rect(8, 17, 9, 19, hair.base)
    grid.rect(22, 17, 23, 19, hair.dark)
    return
  }
  grid.polygon(
    [
      [9.5, 16],
      [21.5, 16],
      [20, 22],
      [15.5, 26.5],
      [11, 22],
    ],
    litFromLeft(hair, MID, 6),
  )
  grid.rect(13, 18, 18, 18, hair.base)
  grid.line(13, 21, 15, 25, hair.dark)
  grid.line(18, 21, 16, 25, hair.dark)
}

/** What makes each race look like itself: ears, horns, tusks, beards, and scales. Drawn over the hair and under any hat. */
function paintRaceFeatures(grid: PixelGrid, appearance: Appearance, skin: Ramp, hair: Ramp, iris: Ramp, facing: Facing): void {
  const front = facing === 'front'
  switch (appearance.race) {
    case 'elf':
      pair(
        grid,
        [
          [9.5, 12.5],
          [3.5, 8],
          [5, 11],
          [9.5, 16],
        ],
        skin,
      )
      grid.set(6, 10, skin.dark)
      grid.set(25, 10, skin.dark)
      break
    case 'orc':
      pair(
        grid,
        [
          [9.5, 12.5],
          [6.5, 10.5],
          [9.5, 15.5],
        ],
        skin,
      )
      if (front) {
        // A heavy brow and tusks rising beside the mouth.
        grid.rect(10, 12, 13, 12, skin.dark)
        grid.rect(18, 12, 21, 12, skin.dark)
        for (const x of [14, 17]) {
          grid.rect(x, 18, x, 19, TUSK)
        }
      }
      break
    case 'dwarf':
      paintBeard(grid, hair, facing)
      break
    case 'dragonborn':
      pair(
        grid,
        [
          [10.5, 8],
          [8.5, 2],
          [7, -0.5],
          [9.5, 3],
          [12, 7.5],
        ],
        HORN,
      )
      if (front) {
        for (const [x, y] of [[12, 9], [14, 8], [17, 8], [19, 9], [10, 16], [21, 16], [11, 17], [20, 17]] as const) {
          grid.recolor(x, y, skin.dark, [skin.light, skin.base, skin.dark])
        }
        // Nostrils instead of a nose, and slit pupils.
        grid.set(15, 17, skin.dark)
        grid.set(16, 17, skin.dark)
        for (const x of [12, 19]) {
          grid.rect(x, 14, x, 16, iris.dark)
        }
      } else {
        for (const [x, y] of [[14, 20], [17, 21], [15, 22]] as const) {
          grid.set(x, y, shade(skin.dark, -0.2))
        }
      }
      break
    case 'tiefling':
      pair(
        grid,
        [
          [11.5, 7.5],
          [10.5, 3.5],
          [8, 0.5],
          [6, 2],
          [8, 2.2],
          [9.5, 4.5],
          [10, 7.5],
        ],
        TIEFLING_HORN,
      )
      pair(
        grid,
        [
          [9.5, 12.5],
          [6.5, 10.5],
          [9.5, 15.5],
        ],
        skin,
      )
      break
  }
}

/** The back of the head: neck, ears, and the hair (or hood) seen from behind. */
function paintBackOfHead(grid: PixelGrid, appearance: Appearance, skin: Ramp, hair: Ramp, cloth: Ramp): void {
  grid.rect(14, 19, 17, 22, skin.dark)
  grid.rect(9, 13, 9, 15, skin.base)
  grid.rect(22, 13, 22, 15, skin.dark)
  grid.ellipse(MID, 13.5, 6.4, 6.6, litFromLeft(skin, MID, 6.4))

  const shading = litFromLeft(hair, MID, 7.5)
  const fullHead = (nape: number) => {
    grid.ellipse(MID, 12, 7, 7.6, shading)
    for (let x = 10; x <= 21; x++) {
      if (x % 2 === 0) {
        grid.set(x, nape, shading(x, nape))
      }
    }
    for (const [x, y] of SHINE) {
      grid.set(x, y, hair.light)
    }
  }

  switch (visibleHairStyle(appearance)) {
    case 'short':
      fullHead(19)
      break
    case 'spiky':
      for (const spike of [
        [[11, 4], [9, 0], [15, 3]],
        [[16, 3], [21, 0], [20, 5]],
        [[13, 4], [15.5, -1], [18, 4]],
        [[9, 9], [5, 7], [9, 13]],
        [[22, 9], [26, 7], [22, 13]],
      ] as const) {
        grid.polygon(spike, shading)
      }
      fullHead(19)
      break
    case 'long':
      grid.rect(8, 12, 23, 25, (x, y) => (y > 23 && (x + y) % 2 ? null : shading(x, y)))
      fullHead(19)
      grid.line(12, 14, 11, 24, hair.dark)
      grid.line(19, 14, 20, 24, hair.dark)
      break
    case 'topknot':
      grid.ellipse(MID, 3, 2.8, 2.6, shading)
      fullHead(18)
      grid.rect(14, 5, 17, 5, BLOOD)
      break
    case 'mohawk':
      grid.rect(14, 1, 17, 19, (x) => (x === 14 ? hair.light : x === 17 ? hair.dark : hair.base))
      break
    case 'bald':
      grid.rect(12, 8, 13, 8, skin.light)
      break
  }

  if (appearance.outfit === 'cloak' && appearance.hat === 'none') {
    // The hood, seen from behind, covers the whole head and comes to a soft point.
    grid.ellipse(MID, 12.5, 8.8, 9.2, litFromLeft(cloth, MID, 8.8))
    grid.polygon(
      [
        [13, 4],
        [18, 4],
        [15.5, 1],
      ],
      cloth.base,
    )
    grid.line(15, 6, 15, 20, cloth.dark)
  }
}

/** A great helm covers the face, but a dwarf's beard spills out from under it. */
function beardOverHelm(grid: PixelGrid, appearance: Appearance, hair: Ramp, facing: Facing): void {
  if (appearance.race === 'dwarf' && appearance.hat === 'helm') {
    paintBeard(grid, hair, facing)
  }
}

function heroPalette(appearance: Appearance) {
  const irisBase = colorOf(EYE_COLORS, appearance.eyes)
  return {
    skin: ramp(colorOf(SKIN_TONES, appearance.skin), 0.18, 0.3),
    hair: ramp(colorOf(HAIR_COLORS, appearance.hairColor), 0.3, 0.4),
    cloth: ramp(colorOf(OUTFIT_COLORS, appearance.outfitColor), 0.3, 0.45),
    iris: { light: shade(irisBase, 0.45), base: irisBase, dark: shade(irisBase, -0.45) },
  }
}

/** Paints the hero's anime-style head-and-shoulders portrait, from the front or from behind. */
export function paintHero(appearance: Appearance, facing: Facing = 'front'): PixelGrid {
  const grid = new PixelGrid(HERO_GRID_SIZE)
  const { skin, hair, cloth, iris } = heroPalette(appearance)

  if (facing === 'front') {
    paintBehind(grid, appearance, hair, cloth)
    paintBody(grid, appearance, cloth, facing)
    paintFace(grid, appearance, skin, hair, iris)
    paintHair(grid, appearance, hair, skin, cloth)
    paintRaceFeatures(grid, appearance, skin, hair, iris, facing)
    paintHat(grid, appearance, iris, facing)
    beardOverHelm(grid, appearance, hair, facing)
    paintHeldItem(grid, appearance)
  } else {
    paintBody(grid, appearance, cloth, facing)
    paintBackOfHead(grid, appearance, skin, hair, cloth)
    paintRaceFeatures(grid, appearance, skin, hair, iris, facing)
    paintHat(grid, appearance, iris, facing)
    beardOverHelm(grid, appearance, hair, facing)
    // Seen from behind, the hand holding the item is on the other side.
    const item = new PixelGrid(HERO_GRID_SIZE)
    paintHeldItem(item, appearance)
    item.cells.forEach((color, index) => {
      if (color) {
        grid.set(HERO_GRID_SIZE - 1 - (index % HERO_GRID_SIZE), Math.floor(index / HERO_GRID_SIZE), color)
      }
    })
  }
  grid.outline()
  return grid
}
