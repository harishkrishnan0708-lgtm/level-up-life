import { levelProgress, toLocalDay, type GameState } from './game'

export type ShopCategory = 'kingdom' | 'gear' | 'potion' | 'training'

/** The part of a hero's appearance a piece of gear replaces. */
export type GearSlot = 'hat' | 'heldItem' | 'outfit'
export type Rarity = 'common' | 'rare' | 'legendary'

/** A tile on the kingdom map, as [column, row]. */
export type Tile = readonly [number, number]

export const KINGDOM_SIZE = 7

export interface ShopItem {
  id: string
  name: string
  /** What the merchant says about it. */
  description: string
  category: ShopCategory
  rarity: Rarity
  price: number
  minLevel: number
  /** How many the merchant brings each day (legendary items only turn up on some days). */
  dailyStock: number
  /** Buildings: where each copy stands on the map. The number of tiles is how many you can own. */
  tiles?: readonly Tile[]
  /** Potions: how many days of double XP one bottle gives. */
  boostDays?: number
  /** Gear: which part of the hero it is worn as. Each piece can only be bought once. */
  equipSlot?: GearSlot
  /** Scout training: the rank this lesson brings the hero's scouts to. Ranks are bought in order, once each. */
  trainingRank?: number
  /** Candles of Respite: each saves the hero's streak through one missed day. */
  candle?: true
}

/** The most Candles of Respite a hero can keep at once. */
export const MAX_CANDLES = 3

/** One rank of scout training; each makes scout reports 5% more reliable for good. */
function scoutTraining(rank: number, price: number, minLevel: number, rarity: Rarity, lesson: string): ShopItem {
  return {
    id: `scout-${rank}`,
    name: `Scout training, rank ${rank}`,
    description: `${lesson} Scout reports become 5% more reliable, for good.`,
    category: 'training',
    rarity,
    price,
    minLevel,
    dailyStock: 1,
    trainingRank: rank,
  }
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    id: 'pine',
    name: 'Gnarled pine',
    description: 'A twisted tree that has seen too many winters.',
    category: 'kingdom',
    rarity: 'common',
    price: 15,
    minLevel: 1,
    dailyStock: 2,
    tiles: [[1, 2], [5, 2], [1, 4], [5, 4]],
  },
  {
    id: 'banner',
    name: 'War banner',
    description: 'Your colours, raised high.',
    category: 'kingdom',
    rarity: 'common',
    price: 20,
    minLevel: 1,
    dailyStock: 2,
    tiles: [[2, 1], [4, 1], [2, 3], [4, 3]],
  },
  {
    id: 'wall',
    name: 'Stone wall',
    description: 'One section of the wall that keeps the dark out.',
    category: 'kingdom',
    rarity: 'common',
    price: 25,
    minLevel: 1,
    dailyStock: 4,
    tiles: [
      [2, 6], [4, 6], [1, 6], [5, 6], [0, 5], [6, 5], [0, 4], [6, 4], [0, 3], [6, 3],
      [0, 2], [6, 2], [0, 1], [6, 1], [1, 0], [5, 0], [2, 0], [4, 0], [3, 0],
    ],
  },
  {
    id: 'bonfire',
    name: 'Bonfire',
    description: 'Rest here, and remember why you fight.',
    category: 'kingdom',
    rarity: 'common',
    price: 30,
    minLevel: 1,
    dailyStock: 1,
    tiles: [[3, 5]],
  },
  {
    id: 'hut',
    name: 'Peasant hut',
    description: 'Shelter for the folk who follow you.',
    category: 'kingdom',
    rarity: 'common',
    price: 60,
    minLevel: 1,
    dailyStock: 2,
    tiles: [[2, 5], [4, 5], [1, 5], [5, 5], [2, 4], [4, 4]],
  },
  {
    id: 'fountain',
    name: 'Fountain',
    description: 'Clean water, a rare thing in these lands.',
    category: 'kingdom',
    rarity: 'common',
    price: 90,
    minLevel: 2,
    dailyStock: 1,
    tiles: [[1, 3]],
  },
  {
    id: 'tent',
    name: 'War tent',
    description: 'Where your soldiers train and sharpen their blades.',
    category: 'kingdom',
    rarity: 'rare',
    price: 150,
    minLevel: 2,
    dailyStock: 1,
    tiles: [[2, 2], [4, 2]],
  },
  {
    id: 'watchtower',
    name: 'Watchtower',
    description: 'Eyes on every road. Stands at a corner of your walls. Lookouts swear a light moves between the enemy camps at night.',
    category: 'kingdom',
    rarity: 'rare',
    price: 200,
    minLevel: 3,
    dailyStock: 1,
    tiles: [[0, 6], [6, 6], [0, 0], [6, 0]],
  },
  {
    id: 'forge',
    name: 'Blacksmith',
    description: 'The ring of hammer on steel, day and night. Your smith swears some enemy blades are better than anything he can forge.',
    category: 'kingdom',
    rarity: 'rare',
    price: 250,
    minLevel: 3,
    dailyStock: 1,
    tiles: [[5, 3]],
  },
  {
    id: 'chapel',
    name: 'Chapel',
    description: 'Candles for the fallen. The priest lights one extra every night, and won’t say for whom.',
    category: 'kingdom',
    rarity: 'rare',
    price: 400,
    minLevel: 4,
    dailyStock: 1,
    tiles: [[1, 1]],
  },
  {
    id: 'roost',
    name: 'Dragon roost',
    description: 'A nest of blackened stone for your companion.',
    category: 'kingdom',
    rarity: 'legendary',
    price: 600,
    minLevel: 5,
    dailyStock: 1,
    tiles: [[5, 1]],
  },
  {
    id: 'keep',
    name: 'Castle keep',
    description: 'The seat of your power. Every kingdom needs a heart.',
    category: 'kingdom',
    rarity: 'legendary',
    price: 900,
    minLevel: 6,
    dailyStock: 1,
    tiles: [[3, 1]],
  },
  {
    id: 'colossus',
    name: 'Golden Colossus',
    description: 'A towering statue of you, in solid gold. Only the most devoted ever raise one.',
    category: 'kingdom',
    rarity: 'legendary',
    price: 1350,
    minLevel: 8,
    dailyStock: 1,
    tiles: [[3, 3]],
  },
  {
    id: 'lantern',
    name: 'Spare lantern',
    description: 'One of my own. It has never once gone out.',
    category: 'gear',
    rarity: 'common',
    price: 60,
    minLevel: 1,
    dailyStock: 1,
    equipSlot: 'heldItem',
  },
  {
    id: 'plague-mask',
    name: 'Plague mask',
    description: 'Beaked leather and smoked glass. Keeps out the miasma, they say.',
    category: 'gear',
    rarity: 'rare',
    price: 120,
    minLevel: 2,
    dailyStock: 1,
    equipSlot: 'hat',
  },
  {
    id: 'horned-helm',
    name: 'Horned helm',
    description: 'Iron, with the horns of something you’d rather not meet.',
    category: 'gear',
    rarity: 'rare',
    price: 180,
    minLevel: 3,
    dailyStock: 1,
    equipSlot: 'hat',
  },
  {
    id: 'black-plate',
    name: 'Blackened plate',
    description: 'Armor scorched in dragonfire. Still warm.',
    category: 'gear',
    rarity: 'rare',
    price: 250,
    minLevel: 4,
    dailyStock: 1,
    equipSlot: 'outfit',
  },
  {
    id: 'flame-sword',
    name: 'Flaming sword',
    description: 'A blade that burns without ever being lit.',
    category: 'gear',
    rarity: 'rare',
    price: 280,
    minLevel: 4,
    dailyStock: 1,
    equipSlot: 'heldItem',
  },
  {
    id: 'scythe',
    name: 'Reaper’s scythe',
    description: 'Its last owner stopped needing it. Rather suddenly.',
    category: 'gear',
    rarity: 'legendary',
    price: 450,
    minLevel: 5,
    dailyStock: 1,
    equipSlot: 'heldItem',
  },
  {
    id: 'ember-crown',
    name: 'Crown of Embers',
    description: 'Worn by the last lord of the ash. It burns, but never the wearer.',
    category: 'gear',
    rarity: 'legendary',
    price: 650,
    minLevel: 6,
    dailyStock: 1,
    equipSlot: 'hat',
  },
  scoutTraining(1, 50, 2, 'common', 'An old ranger teaches your scouts to count campfires.'),
  scoutTraining(2, 120, 3, 'rare', 'Your scouts learn to read a wall’s cracks from a mile away.'),
  scoutTraining(3, 250, 4, 'rare', 'Disguises, forged passes, and a gift for listening at doors.'),
  scoutTraining(4, 500, 6, 'legendary', 'Your scouts become shadows. Little in a castle escapes them.'),
  {
    id: 'vigor',
    name: 'Draught of Vigor',
    description: 'Double XP from quests for the rest of today. You still have to do the quests.',
    category: 'potion',
    rarity: 'rare',
    price: 300,
    minLevel: 2,
    dailyStock: 1,
    boostDays: 1,
  },
  {
    id: 'ancients',
    name: 'Elixir of the Ancients',
    description: 'Double XP from quests for three days. You still have to do the quests.',
    category: 'potion',
    rarity: 'legendary',
    price: 700,
    minLevel: 5,
    dailyStock: 1,
    boostDays: 3,
  },
  {
    id: 'respite-candle',
    name: 'Candle of Respite',
    description: 'When a day gets away from you, it burns down in your place, and your streak lives on.',
    category: 'potion',
    rarity: 'common',
    price: 60,
    minLevel: 1,
    dailyStock: 2,
    candle: true,
  },
]

export function shopItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId)
}

/** Everything a hero has bought, plus what the merchant has already sold them today. */
export interface Holdings {
  buildings: Record<string, number>
  /** Ids of gear the hero owns. */
  gear: string[]
  /** Scout training rank bought from the merchant, 0 to 4. */
  scoutRank: number
  /** Last day (YYYY-MM-DD) of double XP, or null if no potion is active. */
  xpBoostUntil: string | null
  /** The day `boughtToday` refers to; stock resets when the day changes. */
  stockDay: string
  boughtToday: Record<string, number>
  /** Candles of Respite waiting to save a streak. */
  candles: number
}

export function newHoldings(today: string): Holdings {
  return { buildings: {}, gear: [], scoutRank: 0, xpBoostUntil: null, stockDay: today, boughtToday: {}, candles: 0 }
}

/** A repeatable number in [0, 1) for a piece of text, so stock is the same all day without being saved. */
export function seededRandom(text: string): number {
  let hash = 2166136261
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 2 ** 32
}

/** How many the merchant brought today. Legendary wares only turn up about every other day. */
export function stockForDay(item: ShopItem, day: string): number {
  if (item.rarity === 'legendary' && seededRandom(`${day}:${item.id}`) >= 0.5) {
    return 0
  }
  return item.dailyStock
}

export function stockLeft(holdings: Holdings, item: ShopItem, today: string): number {
  const bought = holdings.stockDay === today ? (holdings.boughtToday[item.id] ?? 0) : 0
  return Math.max(0, stockForDay(item, today) - bought)
}

export function ownedCount(holdings: Holdings, item: ShopItem): number {
  if (item.candle) {
    return holdings.candles
  }
  if (item.trainingRank) {
    return holdings.scoutRank >= item.trainingRank ? 1 : 0
  }
  if (item.equipSlot) {
    return holdings.gear.includes(item.id) ? 1 : 0
  }
  return holdings.buildings[item.id] ?? 0
}

export function maxOwned(item: ShopItem): number {
  if (item.candle) {
    return MAX_CANDLES
  }
  if (item.equipSlot || item.trainingRank) {
    return 1
  }
  return item.tiles?.length ?? Infinity
}

export type PurchaseCheck = 'ok' | 'locked' | 'needs-training' | 'max-owned' | 'sold-out' | 'too-poor'

/** Why the hero can or can't buy this item right now, checked in the order the merchant would say it. */
export function checkPurchase(game: GameState, holdings: Holdings, item: ShopItem, today: string): PurchaseCheck {
  if (levelProgress(game.totalXp).level < item.minLevel) {
    return 'locked'
  }
  if (ownedCount(holdings, item) >= maxOwned(item)) {
    return 'max-owned'
  }
  if (item.trainingRank && holdings.scoutRank < item.trainingRank - 1) {
    return 'needs-training'
  }
  if (stockLeft(holdings, item, today) === 0) {
    return 'sold-out'
  }
  if (game.coins < item.price) {
    return 'too-poor'
  }
  return 'ok'
}

export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number)
  return toLocalDay(new Date(year, month - 1, date + days))
}

export function isBoostActive(holdings: Holdings, today: string): boolean {
  // YYYY-MM-DD strings sort in date order, so they can be compared directly.
  return holdings.xpBoostUntil !== null && holdings.xpBoostUntil >= today
}

export function xpMultiplier(holdings: Holdings, today: string): number {
  return isBoostActive(holdings, today) ? 2 : 1
}

export interface PurchaseOutcome {
  result: PurchaseCheck
  game: GameState
  holdings: Holdings
}

/** Buys one of the item if allowed; otherwise returns the hero unchanged with the reason. */
export function buyItem(game: GameState, holdings: Holdings, itemId: string, today: string): PurchaseOutcome {
  const item = shopItem(itemId)
  if (!item) {
    return { result: 'sold-out', game, holdings }
  }
  const result = checkPurchase(game, holdings, item, today)
  if (result !== 'ok') {
    return { result, game, holdings }
  }

  const boughtToday = holdings.stockDay === today ? holdings.boughtToday : {}
  let updated: Holdings = {
    ...holdings,
    stockDay: today,
    boughtToday: { ...boughtToday, [item.id]: (boughtToday[item.id] ?? 0) + 1 },
  }
  if (item.tiles) {
    updated = { ...updated, buildings: { ...updated.buildings, [item.id]: ownedCount(holdings, item) + 1 } }
  }
  if (item.equipSlot) {
    updated = { ...updated, gear: [...updated.gear, item.id] }
  }
  if (item.trainingRank) {
    updated = { ...updated, scoutRank: item.trainingRank }
  }
  if (item.candle) {
    updated = { ...updated, candles: holdings.candles + 1 }
  }
  if (item.boostDays) {
    // A second potion extends an active boost instead of wasting the days that overlap.
    const startAfter = isBoostActive(holdings, today) ? holdings.xpBoostUntil! : addDays(today, -1)
    updated = { ...updated, xpBoostUntil: addDays(startAfter, item.boostDays) }
  }
  return { result, game: { ...game, coins: game.coins - item.price }, holdings: updated }
}

export interface PlacedBuilding {
  item: ShopItem
  tile: Tile
}

/** Where every building the hero owns stands on the kingdom map. */
export function placedBuildings(holdings: Holdings): PlacedBuilding[] {
  return SHOP_ITEMS.flatMap((item) => (item.tiles ?? []).slice(0, ownedCount(holdings, item)).map((tile) => ({ item, tile })))
}

export const KINGDOM_TILE_COUNT = SHOP_ITEMS.reduce((total, item) => total + (item.tiles?.length ?? 0), 0)

/** Keeps only the entries of a saved record that are whole, positive counts. */
function validCounts(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => Number.isInteger(entry[1]) && entry[1] > 0),
  )
}

/** Rebuilds holdings from saved data, keeping only buildings that exist and fit on the map. */
export function sanitizeHoldings(value: unknown, today: string): Holdings {
  if (typeof value !== 'object' || value === null) {
    return newHoldings(today)
  }
  const saved = value as Record<string, unknown>
  const buildings: Record<string, number> = {}
  for (const [itemId, count] of Object.entries(validCounts(saved.buildings))) {
    const item = shopItem(itemId)
    if (item?.tiles) {
      buildings[itemId] = Math.min(count, item.tiles.length)
    }
  }
  const isDay = (day: unknown): day is string => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
  const gear = Array.isArray(saved.gear)
    ? [...new Set(saved.gear.filter((itemId): itemId is string => typeof itemId === 'string' && shopItem(itemId)?.equipSlot !== undefined))]
    : []
  return {
    buildings,
    gear,
    scoutRank: Number.isInteger(saved.scoutRank) ? Math.min(4, Math.max(0, saved.scoutRank as number)) : 0,
    xpBoostUntil: isDay(saved.xpBoostUntil) ? saved.xpBoostUntil : null,
    stockDay: isDay(saved.stockDay) ? saved.stockDay : today,
    boughtToday: validCounts(saved.boughtToday),
    candles: Number.isInteger(saved.candles) ? Math.min(MAX_CANDLES, Math.max(0, saved.candles as number)) : 0,
  }
}
