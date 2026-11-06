import type { Hero } from './hero'
import { petById } from './pets'
import { shopItem } from './wares'

/**
 * Trading pets and costume pieces with friends. An offered item leaves the giver's hands while the offer waits, so it
 * can't be promised twice, and comes back if the offer is declined or cancelled. Trades are honest-client: each phone
 * gives up its own side, which is fine between friends.
 */

export type TradeItem = { kind: 'pet' | 'gear'; id: string }

/** A trade as stored online. `want` is null for a gift. */
export interface Trade {
  id: string
  fromUid: string
  fromName: string
  toUid: string
  toName: string
  give: TradeItem
  want: TradeItem | null
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  /** Whether the giver's phone has already taken back or received its side, so it never happens twice. */
  fromSettled: boolean
}

export type Inventory = Pick<Hero, 'pets' | 'holdings'>

export function itemName(item: TradeItem): string {
  return (item.kind === 'pet' ? petById(item.id)?.name : shopItem(item.id)?.name) ?? 'Something unknown'
}

export function sameItem(first: TradeItem, second: TradeItem): boolean {
  return first.kind === second.kind && first.id === second.id
}

/**
 * What the hero could trade away: pets they own, except the one following them if it's their only one, and costume
 * pieces they aren't wearing.
 */
export function tradeableItems(hero: Pick<Hero, 'pets' | 'holdings' | 'appearance'>): TradeItem[] {
  const pets = Object.entries(hero.pets.owned)
    .filter(([id, count]) => count > (id === hero.pets.activePetId ? 1 : 0))
    .map(([id]): TradeItem => ({ kind: 'pet', id }))
  const gear = hero.holdings.gear
    .filter((id) => {
      const slot = shopItem(id)?.equipSlot
      return slot !== undefined && hero.appearance[slot] !== id
    })
    .map((id): TradeItem => ({ kind: 'gear', id }))
  return [...pets, ...gear]
}

export function canGive(hero: Pick<Hero, 'pets' | 'holdings' | 'appearance'>, item: TradeItem): boolean {
  return tradeableItems(hero).some((candidate) => sameItem(candidate, item))
}

/** Takes an item out of the hero's hands, or returns null if they no longer have it free to give. */
export function removeItem(hero: Pick<Hero, 'pets' | 'holdings' | 'appearance'>, item: TradeItem): Inventory | null {
  if (!canGive(hero, item)) {
    return null
  }
  if (item.kind === 'pet') {
    const count = hero.pets.owned[item.id] - 1
    const { [item.id]: _given, ...rest } = hero.pets.owned
    return { pets: { ...hero.pets, owned: count > 0 ? { ...rest, [item.id]: count } : rest }, holdings: hero.holdings }
  }
  return { pets: hero.pets, holdings: { ...hero.holdings, gear: hero.holdings.gear.filter((id) => id !== item.id) } }
}

/** Puts an item into the hero's hands. A costume piece they already own adds nothing. */
export function addItem(hero: Inventory, item: TradeItem): Inventory {
  if (item.kind === 'pet') {
    return petById(item.id) ? { ...hero, pets: { ...hero.pets, owned: { ...hero.pets.owned, [item.id]: (hero.pets.owned[item.id] ?? 0) + 1 } } } : hero
  }
  return shopItem(item.id)?.equipSlot && !hero.holdings.gear.includes(item.id) ? { ...hero, holdings: { ...hero.holdings, gear: [...hero.holdings.gear, item.id] } } : hero
}

/** Tradeable items as short codes, for sharing with friends in the kingdom snapshot. */
export function encodeItems(items: readonly TradeItem[]): string[] {
  return items.map(({ kind, id }) => `${kind}:${id}`)
}

export function decodeItem(code: string): TradeItem | null {
  const [kind, id] = code.split(':')
  const item = { kind, id } as TradeItem
  return (kind === 'pet' && petById(id)) || (kind === 'gear' && shopItem(id)?.equipSlot) ? item : null
}

/** What the giver's phone still has to do for a trade, once its friend has answered. */
export function giverSettlement(trade: Trade): 'receive' | 'return' | null {
  if (trade.fromSettled || trade.status === 'pending') {
    return null
  }
  return trade.status === 'accepted' ? 'receive' : 'return'
}

export function isTradeItem(value: unknown): value is TradeItem {
  const item = value as TradeItem | null
  return typeof item === 'object' && item !== null && typeof item.id === 'string' && decodeItem(`${item.kind}:${item.id}`) !== null
}
