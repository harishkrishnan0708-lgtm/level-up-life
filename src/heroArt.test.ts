import { describe, expect, it } from 'vitest'
import {
  DEFAULT_APPEARANCE,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  HELD_ITEMS,
  OUTFIT_COLORS,
  OUTFIT_STYLES,
  RACES,
  SKIN_TONES,
  type Appearance,
  type Option,
} from './hero'
import { FIGURE_HEIGHT, FIGURE_WIDTH, HERO_GRID_SIZE, POSES, paintFigure, paintHero } from './heroPixels'
import { BACKDROP_HEIGHT, BACKDROP_WIDTH, paintBackdrop, type BackdropTab } from './backdrops'
import { paintCrest } from './crestSprites'
import { paintItem } from './itemSprites'
import { MARKET_HEIGHT, MARKET_WIDTH, dayPhase, paintFarStreet, paintNearStreet, sunPosition } from './marketPixels'
import { paintPet } from './petSprites'
import { PETS } from './pets'
import { PixelGrid } from './pixel'
import { PRACTICE_RIVAL, RIVALS } from './raids'
import { SHOP_ITEMS } from './wares'

const OPTIONS: { [Key in keyof Appearance]: readonly Option[] } = {
  race: RACES,
  skin: SKIN_TONES,
  hairStyle: HAIR_STYLES,
  hairColor: HAIR_COLORS,
  eyes: EYE_COLORS,
  outfit: OUTFIT_STYLES,
  outfitColor: OUTFIT_COLORS,
  hat: HATS,
  heldItem: HELD_ITEMS,
}

const fingerprint = (grid: PixelGrid) => grid.cells.join(',')

describe.each([
  // From behind the eyes can't be seen, so eye colour is the one option the back view doesn't show.
  { view: 'front', paint: (look: Appearance) => paintHero(look, 'front'), hidden: [] as string[] },
  { view: 'back', paint: (look: Appearance) => paintHero(look, 'back'), hidden: ['eyes'] },
])('the $view view', ({ paint, hidden }) => {
  const width = HERO_GRID_SIZE
  const height = HERO_GRID_SIZE
  const plain = fingerprint(paint(DEFAULT_APPEARANCE))

  it('is drawn at its full size', () => {
    const grid = paint(DEFAULT_APPEARANCE)
    expect([grid.width, grid.height]).toEqual([width, height])
    expect(grid.cells.filter(Boolean).length).toBeGreaterThan(width * 10)
  })

  it.each((Object.keys(OPTIONS) as (keyof Appearance)[]).filter((slot) => !hidden.includes(slot)))('visibly shows every %s option', (slot) => {
    for (const option of OPTIONS[slot]) {
      if (option.id === DEFAULT_APPEARANCE[slot]) {
        continue
      }
      const changed = fingerprint(paint({ ...DEFAULT_APPEARANCE, [slot]: option.id } as Appearance))
      expect(changed, `${slot}: ${option.id}`).not.toBe(plain)
    }
  })
})

describe('full-body story figures', () => {
  it('stand at full height in every pose, and every pose looks different', () => {
    const fingerprints = POSES.map((pose) => {
      const grid = paintFigure(DEFAULT_APPEARANCE, pose)
      expect([grid.width, grid.height]).toEqual([FIGURE_WIDTH, FIGURE_HEIGHT])
      expect(grid.get(12, FIGURE_HEIGHT - 2), `${pose} has feet`).not.toBeNull()
      return fingerprint(grid)
    })
    expect(new Set(fingerprints).size).toBe(POSES.length)
  })

  it('show every appearance option, just as the portrait does', () => {
    const plain = fingerprint(paintFigure(DEFAULT_APPEARANCE, 'stand'))
    for (const slot of Object.keys(OPTIONS) as (keyof Appearance)[]) {
      for (const option of OPTIONS[slot]) {
        if (option.id !== DEFAULT_APPEARANCE[slot]) {
          expect(fingerprint(paintFigure({ ...DEFAULT_APPEARANCE, [slot]: option.id } as Appearance, 'stand')), `${slot}: ${option.id}`).not.toBe(plain)
        }
      }
    }
  })
})

describe('pet sprites', () => {
  it('exist for every pet, and every pet looks different', () => {
    const fingerprints = PETS.map((pet) => {
      const grid = paintPet(pet.id)
      expect(grid, pet.id).not.toBeNull()
      expect(grid!.cells.filter(Boolean).length, pet.id).toBeGreaterThan(60)
      return fingerprint(grid!)
    })
    expect(new Set(fingerprints).size).toBe(PETS.length)
  })
})

describe('shop item sprites', () => {
  it('exist for every item and building, and every one looks different', () => {
    const fingerprints = SHOP_ITEMS.map((item) => {
      const grid = paintItem(item.id)
      expect(grid, item.id).not.toBeNull()
      expect(grid!.cells.filter(Boolean).length, item.id).toBeGreaterThan(50)
      return fingerprint(grid!)
    })
    expect(new Set(fingerprints).size).toBe(SHOP_ITEMS.length)
  })
})

describe('rival insignia', () => {
  it('exist for every rival, and every one looks different', () => {
    const rivals = [...RIVALS, PRACTICE_RIVAL]
    const fingerprints = rivals.map((rival) => {
      const grid = paintCrest(rival.id)
      expect(grid, rival.id).not.toBeNull()
      return fingerprint(grid!)
    })
    expect(new Set(fingerprints).size).toBe(rivals.length)
  })
})

it('draws lines with fractional ends instead of looping forever', () => {
  const grid = new PixelGrid(8)
  grid.line(0.4, 0, 5.6, 3.3, '#fff')
  expect(grid.get(6, 3)).toBe('#fff')
})

describe('tab backdrops', () => {
  const tabs: BackdropTab[] = ['quests', 'shop', 'kingdom', 'war', 'pets']

  it('fill the whole screen for every tab at every time of day', () => {
    for (const tab of tabs) {
      for (const [phase, hour] of [['dawn', 6], ['day', 12], ['dusk', 19], ['night', 23]] as const) {
        const grid = paintBackdrop(tab, phase, hour)
        expect([grid.width, grid.height]).toEqual([BACKDROP_WIDTH, BACKDROP_HEIGHT])
        expect(grid.cells.every(Boolean), `${tab} at ${phase}`).toBe(true)
      }
    }
  })

  it('give every tab a different place', () => {
    expect(new Set(tabs.map((tab) => fingerprint(paintBackdrop(tab, 'night', 23)))).size).toBe(tabs.length)
  })
})

describe('the night market', () => {
  it('fills the whole sky and street, with no holes', () => {
    const far = paintFarStreet()
    expect([far.width, far.height]).toEqual([MARKET_WIDTH, MARKET_HEIGHT])
    expect(far.cells.every(Boolean)).toBe(true)
  })

  it('follows the clock through dawn, day, dusk, and night', () => {
    expect([3, 6, 9, 13, 17, 19, 22].map(dayPhase)).toEqual(['night', 'dawn', 'day', 'day', 'day', 'dusk', 'night'])
  })

  it('moves the sun from left to right, highest around noon', () => {
    const [morning, noon, evening] = [8, 12, 17].map(sunPosition)
    expect(morning[0]).toBeLessThan(noon[0])
    expect(noon[0]).toBeLessThan(evening[0])
    expect(noon[1]).toBeLessThan(morning[1])
    expect(noon[1]).toBeLessThan(evening[1])
  })

  it('has a brighter sky by day than by night', () => {
    const brightness = (color: string | null) => [1, 3, 5].reduce((sum, start) => sum + parseInt(color!.slice(start, start + 2), 16), 0)
    expect(brightness(paintFarStreet('day', 12).get(1, 1))).toBeGreaterThan(brightness(paintFarStreet('night').get(1, 1)) + 200)
  })

  it('frames the stall with matching houses on both sides', () => {
    const near = paintNearStreet()
    for (let x = 0; x < 39; x++) {
      expect(near.get(MARKET_WIDTH - 1 - x, 150), `column ${x}`).toBe(near.get(x, 150))
    }
  })
})

it('draws the back of the hero differently from the front', () => {
  expect(fingerprint(paintHero(DEFAULT_APPEARANCE, 'back'))).not.toBe(fingerprint(paintHero(DEFAULT_APPEARANCE, 'front')))
})
