import { describe, expect, it } from 'vitest'
import { newGame, toggleQuest, type GameState } from './game'
import { GEAR_SLOT_OPTIONS } from './hero'
import {
  KINGDOM_SIZE,
  MAX_CANDLES,
  SHOP_ITEMS,
  addDays,
  buyItem,
  newHoldings,
  placedBuildings,
  sanitizeHoldings,
  shopItem,
  stockForDay,
  stockLeft,
  xpMultiplier,
} from './wares'

const TODAY = '2026-10-08'

function richHero(coins: number, totalXp = 0): GameState {
  return { ...newGame(TODAY), coins, totalXp }
}

/** XP needed to reach a level, for testing level locks. */
const LEVEL_8_XP = 1750

describe('buying from the merchant', () => {
  it('takes the coins and builds the building', () => {
    const outcome = buyItem(richHero(100), newHoldings(TODAY), 'hut', TODAY)
    expect(outcome.result).toBe('ok')
    expect(outcome.game.coins).toBe(40)
    expect(placedBuildings(outcome.holdings).map(({ item }) => item.id)).toEqual(['hut'])
  })

  it('refuses when the hero cannot afford it, and changes nothing', () => {
    const game = richHero(10)
    const holdings = newHoldings(TODAY)
    const outcome = buyItem(game, holdings, 'hut', TODAY)
    expect(outcome.result).toBe('too-poor')
    expect(outcome.game).toBe(game)
    expect(outcome.holdings).toBe(holdings)
  })

  it('locks prestige items behind a level', () => {
    const colossus = shopItem('colossus')!
    const legendaryDay = findDayWithStock('colossus')
    expect(buyItem({ ...richHero(5000), day: legendaryDay }, newHoldings(legendaryDay), 'colossus', legendaryDay).result).toBe('locked')
    expect(colossus.price).toBeGreaterThanOrEqual(30 * 45 * 0.9)
    expect(buyItem({ ...richHero(5000, LEVEL_8_XP), day: legendaryDay }, newHoldings(legendaryDay), 'colossus', legendaryDay).result).toBe('ok')
  })

  it('sells out after the day’s stock is bought, and restocks the next day', () => {
    let game = richHero(1000)
    let holdings = newHoldings(TODAY)
    for (let index = 0; index < 2; index++) {
      ;({ game, holdings } = buyItem(game, holdings, 'hut', TODAY))
    }
    expect(stockLeft(holdings, shopItem('hut')!, TODAY)).toBe(0)
    expect(buyItem(game, holdings, 'hut', TODAY).result).toBe('sold-out')

    const tomorrow = addDays(TODAY, 1)
    expect(buyItem(game, holdings, 'hut', tomorrow).result).toBe('ok')
  })

  it('stops selling a building once every spot for it is taken', () => {
    let game = richHero(1000)
    let holdings = newHoldings(TODAY)
    ;({ game, holdings } = buyItem(game, holdings, 'bonfire', TODAY))
    expect(buyItem(game, holdings, 'bonfire', addDays(TODAY, 1)).result).toBe('max-owned')
  })

  it('only brings legendary wares on some days', () => {
    const days = Array.from({ length: 60 }, (_, index) => addDays(TODAY, index))
    const daysInStock = days.filter((day) => stockForDay(shopItem('colossus')!, day) > 0).length
    expect(daysInStock).toBeGreaterThan(10)
    expect(daysInStock).toBeLessThan(50)
  })
})

describe('gear', () => {
  it('is added to the hero’s gear and can only be bought once', () => {
    const { game, holdings, result } = buyItem(richHero(100), newHoldings(TODAY), 'lantern', TODAY)
    expect(result).toBe('ok')
    expect(holdings.gear).toEqual(['lantern'])
    expect(buyItem(game, holdings, 'lantern', addDays(TODAY, 1)).result).toBe('max-owned')
  })

  it('matches a wearable option in the slot it is sold for', () => {
    for (const item of SHOP_ITEMS.filter((candidate) => candidate.category === 'gear')) {
      const option = GEAR_SLOT_OPTIONS[item.equipSlot!].find((candidate) => candidate.id === item.id)
      expect(option?.premium, item.id).toBe(true)
    }
  })

  it('keeps every non-legendary piece cheaper than a potion', () => {
    const cheapestPotion = Math.min(...SHOP_ITEMS.filter((item) => item.boostDays).map((item) => item.price))
    const everydayGear = SHOP_ITEMS.filter((item) => item.category === 'gear' && item.rarity !== 'legendary')
    expect(everydayGear.every((item) => item.price < cheapestPotion)).toBe(true)
  })
})

describe('scout training', () => {
  it('is bought one rank at a time, in order', () => {
    const veteran = richHero(2000, LEVEL_8_XP)
    expect(buyItem(veteran, newHoldings(TODAY), 'scout-2', TODAY).result).toBe('needs-training')
    const first = buyItem(veteran, newHoldings(TODAY), 'scout-1', TODAY)
    expect(first.holdings.scoutRank).toBe(1)
    expect(buyItem(first.game, first.holdings, 'scout-1', TODAY).result).toBe('max-owned')
    expect(buyItem(first.game, first.holdings, 'scout-2', TODAY).holdings.scoutRank).toBe(2)
  })
})

describe('potions', () => {
  it('cost more than any common building', () => {
    const cheapestPotion = Math.min(...SHOP_ITEMS.filter((item) => item.boostDays).map((item) => item.price))
    const commonBuildings = SHOP_ITEMS.filter((item) => item.category === 'kingdom' && item.rarity === 'common')
    expect(commonBuildings.every((item) => item.price < cheapestPotion)).toBe(true)
  })

  it('double quest XP for their duration but never coins', () => {
    const { game, holdings } = buyItem(richHero(400, 100), newHoldings(TODAY), 'vigor', TODAY)
    expect(xpMultiplier(holdings, TODAY)).toBe(2)
    expect(xpMultiplier(holdings, addDays(TODAY, 1))).toBe(1)

    const afterQuest = toggleQuest(game, 'sleep', 'warrior', xpMultiplier(holdings, TODAY))
    expect(afterQuest.totalXp - game.totalXp).toBe(40)
    expect(afterQuest.coins - game.coins).toBe(5)
  })

  it('a second potion extends the boost instead of overlapping', () => {
    let game = richHero(2000, LEVEL_8_XP)
    let holdings = newHoldings(TODAY)
    ;({ game, holdings } = buyItem(game, holdings, 'vigor', TODAY))
    const tomorrow = addDays(TODAY, 1)
    ;({ holdings } = buyItem(game, holdings, 'vigor', tomorrow))
    expect(holdings.xpBoostUntil).toBe(addDays(TODAY, 1))
  })
})

describe('the kingdom map', () => {
  it('gives every building its own tile inside the map', () => {
    const tiles = SHOP_ITEMS.flatMap((item) => item.tiles ?? []).map((tile) => tile.join(','))
    expect(new Set(tiles).size).toBe(tiles.length)
    expect(tiles.every((tile) => tile.split(',').map(Number).every((value) => value >= 0 && value < KINGDOM_SIZE))).toBe(true)
  })

  it('cleans up damaged saved holdings', () => {
    const holdings = sanitizeHoldings(
      { buildings: { hut: 99, unicorn: 2, bonfire: -1 }, gear: ['lantern', 'lantern', 'hut', 7], xpBoostUntil: 'soon' },
      TODAY,
    )
    expect(holdings.buildings).toEqual({ hut: 6 })
    expect(holdings.gear).toEqual(['lantern'])
    expect(holdings.xpBoostUntil).toBeNull()
  })
})

function findDayWithStock(itemId: string): string {
  for (let offset = 0; offset < 30; offset++) {
    const day = addDays(TODAY, offset)
    if (stockForDay(shopItem(itemId)!, day) > 0) {
      return day
    }
  }
  throw new Error(`${itemId} never in stock`)
}

describe('candles of respite', () => {
  it('are cheap, stack up to three, and are counted as owned', () => {
    const candle = SHOP_ITEMS.find((item) => item.candle)!
    let holdings = newHoldings(TODAY)
    let game = { ...newGame(TODAY), coins: 1000 }
    for (const day of [TODAY, '2026-10-12', '2026-10-13', '2026-10-14']) {
      const outcome = buyItem(game, holdings, candle.id, day)
      game = outcome.game
      holdings = outcome.holdings
    }
    expect(holdings.candles).toBe(MAX_CANDLES)
    expect(game.coins).toBe(1000 - MAX_CANDLES * candle.price)
  })
})
