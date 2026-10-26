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

// ── Full-body figures for story scenes ──────────────────────────────────────

/** Story figures are the same anime head on a small chibi body, 32 pixels wide and 56 tall. */
export const FIGURE_WIDTH = 32
export const FIGURE_HEIGHT = 56

/** What a character is doing with their body while they speak, or while they listen. */
export type Pose = 'stand' | 'talk' | 'point' | 'arms-crossed' | 'hand-on-hilt' | 'think' | 'shrug' | 'fist' | 'hand-on-heart' | 'bound'

export const POSES: readonly Pose[] = ['stand', 'talk', 'point', 'arms-crossed', 'hand-on-hilt', 'think', 'shrug', 'fist', 'hand-on-heart', 'bound']

/** An arm as shoulder, elbow, and hand, on the viewer's left and right. */
type Arm = readonly [Point, Point, Point]

const LEFT_SHOULDER: Point = [10, 24]
const RIGHT_SHOULDER: Point = [21, 24]
const LEFT_DOWN: Arm = [LEFT_SHOULDER, [8, 30], [8, 36]]
const RIGHT_DOWN: Arm = [RIGHT_SHOULDER, [23, 30], [23, 36]]

const ARMS: Record<Pose, readonly [Arm, Arm]> = {
  stand: [LEFT_DOWN, RIGHT_DOWN],
  talk: [LEFT_DOWN, [RIGHT_SHOULDER, [26, 29], [26, 23]]],
  point: [LEFT_DOWN, [RIGHT_SHOULDER, [26, 25], [31, 24]]],
  'arms-crossed': [
    [LEFT_SHOULDER, [9, 30], [19, 30]],
    [RIGHT_SHOULDER, [22, 30], [12, 28]],
  ],
  'hand-on-hilt': [LEFT_DOWN, [RIGHT_SHOULDER, [24, 30], [21, 34]]],
  think: [
    [LEFT_SHOULDER, [9, 31], [18, 31]],
    [RIGHT_SHOULDER, [22, 28], [18, 21]],
  ],
  shrug: [
    [LEFT_SHOULDER, [6, 29], [3, 25]],
    [RIGHT_SHOULDER, [25, 29], [28, 25]],
  ],
  fist: [LEFT_DOWN, [RIGHT_SHOULDER, [26, 25], [25, 18]]],
  'hand-on-heart': [LEFT_DOWN, [RIGHT_SHOULDER, [22, 31], [16, 27]]],
  bound: [
    [LEFT_SHOULDER, [10, 31], [14, 34]],
    [RIGHT_SHOULDER, [21, 31], [17, 34]],
  ],
}

/** Where a figure's hand is in a pose, on the viewer's left or right. */
export function handPosition(pose: Pose, side: 'left' | 'right'): Point {
  return ARMS[pose][side === 'left' ? 0 : 1][2]
}

/** A three-pixel-thick limb along a path, lit on its outer edge. */
function limb(grid: PixelGrid, points: readonly Point[], sleeve: Ramp): void {
  for (let index = 1; index < points.length; index++) {
    const [x0, y0] = points[index - 1]
    const [x1, y1] = points[index]
    const flat = Math.abs(x1 - x0) > Math.abs(y1 - y0)
    for (const offset of [-1, 0, 1]) {
      const tone = offset < 0 ? sleeve.light : offset > 0 ? sleeve.dark : sleeve.base
      grid.line(x0 + (flat ? 0 : offset), y0 + (flat ? offset : 0), x1 + (flat ? 0 : offset), y1 + (flat ? offset : 0), tone)
    }
  }
}

/** What the figure wears from the neck down, by outfit. */
function figureClothes(appearance: Appearance, cloth: Ramp) {
  switch (appearance.outfit) {
    case 'armor':
      return { torso: STEEL, sleeve: STEEL, legs: LEATHER, robe: false }
    case 'black-plate':
      return { torso: BLACK_STEEL, sleeve: BLACK_STEEL, legs: BLACK_STEEL, robe: false }
    case 'robe':
      return { torso: cloth, sleeve: cloth, legs: cloth, robe: true }
    default:
      return { torso: { light: cloth.base, base: cloth.dark, dark: shade(cloth.dark, -0.3) }, sleeve: cloth, legs: LEATHER, robe: false }
  }
}

/** What the figure carries: in the hanging left hand, or at the hip when the pose rests a hand on the hilt. */
function figureItem(grid: PixelGrid, appearance: Appearance, pose: Pose, hand: Point): void {
  const swordLike = appearance.heldItem === 'sword' || appearance.heldItem === 'flame-sword'
  if (pose === 'hand-on-hilt') {
    // A sword at the hip, the hand on its hilt.
    grid.line(22, 35, 27, 50, LEATHER.dark)
    grid.line(23, 35, 28, 50, LEATHER.base)
    grid.rect(19, 33, 23, 33, GOLD)
    grid.rect(21, 31, 21, 32, '#3a2416')
  }
  const [downX, downY] = LEFT_DOWN[2]
  if (hand[0] !== downX || hand[1] !== downY || (swordLike && pose === 'hand-on-hilt')) {
    return
  }
  const [x, y] = hand
  switch (appearance.heldItem) {
    case 'sword':
    case 'flame-sword': {
      const fire = appearance.heldItem === 'flame-sword'
      grid.rect(x - 2, y + 2, x + 2, y + 2, fire ? BLACK_STEEL.base : GOLD)
      grid.rect(x, y + 3, x, y + 16, (_px, py) => (fire ? (py > y + 12 ? GLOW : py > y + 7 ? '#ffb347' : EMBER) : STEEL.light))
      grid.rect(x + 1, y + 3, x + 1, y + 15, fire ? EMBER : STEEL.base)
      break
    }
    case 'staff':
      grid.rect(x - 1, 10, x - 1, 55, (_px, py) => (py % 3 ? WOOD : WOOD_DARK))
      grid.ellipse(x - 1, 8, 2.6, 2.6, (px) => (px < x - 1 ? ORB.light : ORB.base))
      break
    case 'wand':
      grid.line(x, y + 1, x + 3, y + 7, WOOD)
      grid.set(x + 3, y + 8, GLOW)
      break
    case 'lantern':
      grid.rect(x, y + 2, x, y + 3, '#3a3226')
      grid.rect(x - 2, y + 4, x + 2, y + 10, '#5a4520')
      grid.rect(x - 1, y + 5, x + 1, y + 9, '#ffc56b')
      break
    case 'scythe':
      grid.rect(x - 1, 8, x - 1, 55, WOOD)
      grid.polygon([[x - 1, 7], [x - 1, 10], [x - 8, 12], [x - 12, 17], [x - 9, 11], [x - 5, 8]], (_px, py) => (py < 10 ? STEEL.light : STEEL.base))
      break
  }
}

/** A scattering of lighter pixels, for textures like fur. */
function speckle(x: number, y: number): boolean {
  return (x * 7 + y * 13) % 5 === 0
}

/** What sets a story character apart from a hero built in the creator: age, scars, and the things they carry. */
export interface CharacterFeatures {
  /** An older face: narrowed eyes under heavy brows, crow's feet, and no rosy cheeks. */
  weathered?: boolean
  /** An eye on the viewer's right, blinded and scarred. */
  blindEye?: boolean
  moustache?: boolean
  stubble?: boolean
  /** A short clay pipe, always in the mouth. */
  pipe?: boolean
  /** The ear on the viewer's left is gone; only a ragged scar remains. */
  missingEar?: boolean
  /** Dark rings of sleepless nights under the eyes. */
  eyeBags?: boolean
  /** Hollow cheeks and heavy, half-closed lids: someone who has stopped expecting much. */
  worn?: boolean
  /** A bandage wound round the forearm on the viewer's left. */
  bandage?: boolean
  /** Patches sewn over the cloak. */
  patched?: boolean
  /** Wider shoulders and a heavier frame. */
  broad?: boolean
  /** A little carved wooden bird hanging from the belt on a cord. */
  carving?: boolean
  /** A full beard, in the hair colour, over the chin and chest. */
  beard?: boolean
  /** A heavy fur collar over the shoulders, the mark of a lord. */
  furMantle?: boolean
  /** Smudges of soot on the cheek and the robe. */
  soot?: boolean
  /** Red stripes of war paint across the cheeks. */
  warPaint?: boolean
  /** A great axe slung over the shoulder, its head beside the face. */
  greatAxe?: boolean
}

const SCAR = '#9a5048'
const MILKY_EYE = '#d4d8dc'
const CLAY = { light: '#efe2c8', base: '#cdbd98', dark: '#8f7f62' }
const BANDAGE = ['#e8e0d0', '#c8c0b0']

function paintFeatures(grid: PixelGrid, features: CharacterFeatures, skin: Ramp, hair: Ramp, sleeve: Ramp, leftHand: Point): void {
  const face = [skin.light, skin.base, skin.dark]
  if (features.weathered) {
    for (const left of [10, 18]) {
      // Narrow, steady eyes under one bushy brow, instead of wide anime ones
      grid.rect(left - 1, 11, left + 4, 16, skin.base)
      grid.rect(left - 1, 12, left + 4, 12, hair.base)
      grid.rect(left, 14, left + 3, 14, skin.dark)
      grid.rect(left, 15, left + 3, 15, LASH)
      grid.set(left + (left < MID ? 2 : 1), 15, '#4a3a30')
      grid.set(left < MID ? left - 1 : left + 4, 16, skin.dark)
    }
    for (const x of [11, 12, 19, 20]) {
      grid.recolor(x, 18, skin.base, [BLUSH])
    }
    grid.set(12, 18, skin.dark)
    grid.set(19, 18, skin.dark)
  }
  if (features.blindEye) {
    grid.rect(19, 14, 21, 15, MILKY_EYE)
    grid.line(20, 9, 21, 19, SCAR)
  }
  if (features.worn) {
    for (const left of [10, 18]) {
      grid.rect(left, 13, left + 3, 14, skin.dark)
      grid.rect(left, 14, left + 3, 14, LASH)
    }
    for (const x of [11, 12, 19, 20]) {
      grid.recolor(x, 18, skin.base, [BLUSH])
    }
    grid.set(11, 18, skin.dark)
    grid.set(20, 18, skin.dark)
  }
  if (features.eyeBags) {
    for (const left of [10, 18]) {
      grid.rect(left + 1, 17, left + 3, 17, shade(skin.dark, -0.25))
    }
  }
  if (features.stubble) {
    grid.ellipse(MID, 20, 5, 2, (x, y) => (y >= 20 && (x * 2 + y) % 3 === 0 && face.includes(grid.get(x, y) ?? '') ? shade(skin.dark, -0.15) : null))
  }
  if (features.moustache) {
    grid.rect(12, 18, 19, 18, hair.base)
    grid.rect(13, 19, 18, 19, hair.dark)
    grid.set(12, 19, hair.dark)
    grid.set(19, 20, hair.dark)
    grid.set(12, 20, hair.dark)
  }
  if (features.pipe) {
    grid.line(17, 20, 21, 22, CLAY.dark)
    grid.rect(21, 19, 23, 22, (x) => (x === 21 ? CLAY.light : CLAY.base))
    grid.rect(21, 19, 23, 19, '#3a2a1e')
    grid.set(22, 19, EMBER)
  }
  if (features.missingEar) {
    // Hair swept back on that side to show what's left
    grid.rect(7, 13, 9, 19, (x, y) => (x === 9 || y > 13 ? skin.base : null))
    for (const [x, y] of [[8, 14], [9, 15], [8, 16], [9, 17]] as const) {
      grid.set(x, y, SCAR)
    }
  }
  if (features.bandage) {
    const [handX, handY] = leftHand
    for (let y = handY - 6; y <= handY - 2; y++) {
      for (let x = handX - 2; x <= handX + 2; x++) {
        // Only the sleeve itself, so the wrapping never spills onto the chest
        grid.recolor(x, y, BANDAGE[y % 2], tones(sleeve))
      }
    }
  }
  if (features.warPaint) {
    for (const [x, y] of [[10, 17], [11, 17], [12, 17], [19, 17], [20, 17], [21, 17], [10, 18], [21, 18]] as const) {
      grid.set(x, y, '#a8281e')
    }
  }
  if (features.greatAxe) {
    grid.line(24, 52, 27, 14, WOOD_DARK)
    grid.line(25, 52, 28, 14, WOOD)
    grid.polygon([[27, 10], [31, 7], [31, 21], [27, 18]], (x, y) => (x > 29 ? STEEL.light : y < 14 ? STEEL.base : STEEL.dark))
    grid.set(28, 11, WHITE)
  }
  if (features.soot) {
    for (const [x, y] of [[11, 17], [12, 18], [20, 16], [13, 30], [18, 41], [10, 46], [21, 49]] as const) {
      grid.set(x, y, '#2a2226')
    }
  }
  if (features.furMantle) {
    grid.ellipse(MID, 22.5, 10, 3, (x, y) => (speckle(x, y) ? '#b8aa98' : y < 22 ? '#a89a86' : '#7a6e60'))
  }
  if (features.beard) {
    paintBeard(grid, hair, 'front')
    grid.recolor(15, 19, LIPS, [hair.base, hair.light, hair.dark])
    grid.set(16, 19, LIPS)
  }
  if (features.carving) {
    grid.rect(19, 35, 19, 36, '#3a2a1e')
    grid.rect(18, 37, 20, 38, WOOD)
    grid.set(21, 37, WOOD)
    grid.set(17, 38, WOOD_DARK)
    grid.set(20, 37, '#1a120c')
  }
  if (features.patched) {
    for (const [x, y] of [[11, 26], [19, 31], [7, 42]] as const) {
      grid.rect(x, y, x + 2, y + 2, '#5a4a3a')
      grid.set(x + 1, y + 1, '#8a7a5a')
    }
  }
}

/** A full-body figure for story scenes: the same head as the portrait, a chibi body in the hero's outfit, posed. */
export function paintFigure(appearance: Appearance, pose: Pose, features: CharacterFeatures = {}): PixelGrid {
  const grid = new PixelGrid(FIGURE_WIDTH, FIGURE_HEIGHT)
  const { skin, hair, cloth, iris } = heroPalette(appearance)
  const clothes = figureClothes(appearance, cloth)
  const [leftArm, rightArm] = ARMS[pose]

  paintBehind(grid, appearance, hair, cloth)
  if (appearance.outfit === 'cloak') {
    // The cape hangs behind the body, nearly to the heels.
    grid.polygon([[8, 22], [23, 22], [26, 50], [5, 50]], litFromLeft({ light: cloth.base, base: cloth.dark, dark: shade(cloth.dark, -0.3) }, MID, 10))
  }
  grid.rect(14, 19, 17, 23, skin.dark)

  if (clothes.robe) {
    grid.polygon([[10, 22], [21, 22], [25, 53], [6, 53]], litFromLeft(clothes.torso, MID, 10))
    grid.rect(7, 52, 24, 53, GOLD_DARK)
    grid.line(MID, 26, MID, 51, cloth.dark)
    grid.rect(9, 54, 12, 55, LEATHER.dark)
    grid.rect(19, 54, 22, 55, LEATHER.dark)
  } else {
    for (const [left, right] of [[11, 14], [17, 20]] as const) {
      grid.rect(left, 36, right, 50, litFromLeft(clothes.legs, (left + right) / 2, 2))
      grid.rect(left, 50, right + (left < MID ? 0 : 1), 54, (_x, y) => (y === 50 ? '#3a2a1e' : '#2a2018'))
      grid.rect(left - (left < MID ? 1 : 0), 54, right + (left < MID ? 0 : 1), 55, '#1e160f')
    }
  }
  grid.rect(features.broad ? 9 : 10, 22, features.broad ? 22 : 21, 35, litFromLeft(clothes.torso, MID, 6))
  grid.rect(10, 34, 21, 35, appearance.outfit === 'robe' ? GOLD : LEATHER.dark)
  grid.set(15, 34, GOLD)
  if (appearance.outfit === 'armor') {
    grid.rect(13, 24, 18, 39, cloth.base)
    for (const [x, y] of [[15, 26], [16, 26], [14, 27], [15, 27], [16, 27], [17, 27], [15, 28], [16, 28]] as const) {
      grid.set(x, y, GOLD)
    }
  }
  if (appearance.outfit === 'black-plate') {
    for (const [x, y] of [[12, 26], [19, 29], [13, 31], [18, 24]] as const) {
      grid.set(x, y, EMBER)
    }
  }
  if (appearance.outfit === 'cloak') {
    grid.rect(15, 22, 16, 23, GOLD)
  }
  if (appearance.outfit === 'armor' || appearance.outfit === 'black-plate') {
    const metal = appearance.outfit === 'armor' ? STEEL : BLACK_STEEL
    grid.ellipse(9, 24, 3.6, 2.6, (_x, y) => (y < 24 ? metal.light : metal.base))
    grid.ellipse(22, 24, 3.6, 2.6, (_x, y) => (y < 24 ? metal.base : metal.dark))
  }

  for (const arm of [leftArm, rightArm]) {
    limb(grid, arm, clothes.sleeve)
    const [handX, handY] = arm[2]
    grid.ellipse(handX + 0.5, handY + 0.5, 1.7, 1.7, (x) => (x <= handX ? skin.light : skin.base))
  }
  if (pose === 'bound') {
    grid.rect(13, 33, 18, 35, (x) => (x % 2 ? '#a08a5a' : '#7a6a42'))
  }
  figureItem(grid, appearance, pose, leftArm[2])

  paintFace(grid, appearance, skin, hair, iris)
  paintHair(grid, appearance, hair, skin, cloth)
  paintRaceFeatures(grid, appearance, skin, hair, iris, 'front')
  paintHat(grid, appearance, iris, 'front')
  beardOverHelm(grid, appearance, hair, 'front')
  paintFeatures(grid, features, skin, hair, clothes.sleeve, leftArm[2])
  grid.outline()
  return grid
}
