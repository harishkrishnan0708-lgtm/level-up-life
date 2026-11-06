import { describe, expect, it } from 'vitest'
import { newGame } from './game'
import { EMPTY_ROSTER, activeHero, addHero, newHeroDraft, type Hero } from './hero'
import { addItem, canGive, decodeItem, giverSettlement, removeItem, tradeableItems, type Trade } from './trades'

function heroWith(owned: Record<string, number>, activePetId: string | null, gear: string[], hat: Hero['appearance']['hat'] = 'none'): Hero {
  const hero = activeHero(addHero(EMPTY_ROSTER, { ...newHeroDraft(), name: 'Trader' }, newGame('2026-11-05')))!
  return { ...hero, pets: { ...hero.pets, owned, activePetId }, holdings: { ...hero.holdings, gear }, appearance: { ...hero.appearance, hat } }
}

describe('what can be traded', () => {
  it('is pets and costumes, but not the only pet following you or the costume you’re wearing', () => {
    const hero = heroWith({ rat: 1, bat: 2 }, 'rat', ['plague-mask', 'horned-helm'], 'plague-mask')
    expect(tradeableItems(hero)).toEqual([
      { kind: 'pet', id: 'bat' },
      { kind: 'gear', id: 'horned-helm' },
    ])
    expect(canGive(heroWith({ bat: 2 }, 'bat', []), { kind: 'pet', id: 'bat' })).toBe(true)
  })

  it('leaves your hands when offered, so it can’t be promised twice', () => {
    const hero = heroWith({ bat: 1 }, null, ['horned-helm'])
    const offered = removeItem(hero, { kind: 'pet', id: 'bat' })!
    expect(offered.pets.owned.bat).toBeUndefined()
    expect(removeItem({ ...hero, ...offered }, { kind: 'pet', id: 'bat' })).toBeNull()
    expect(removeItem(hero, { kind: 'gear', id: 'horned-helm' })!.holdings.gear).toEqual([])
  })

  it('arrives in the other player’s hands, and only real pets and costumes can', () => {
    const hero = heroWith({}, null, [])
    const received = addItem(addItem(hero, { kind: 'pet', id: 'bat' }), { kind: 'gear', id: 'horned-helm' })
    expect(received.pets.owned.bat).toBe(1)
    expect(received.holdings.gear).toEqual(['horned-helm'])
    expect(decodeItem('pet:dragon-of-lies')).toBeNull()
    expect(decodeItem('gear:keep')).toBeNull()
  })
})

describe('finishing a trade on the giver’s side', () => {
  const trade: Trade = {
    id: 't1',
    fromUid: 'a',
    fromName: 'Harish',
    toUid: 'b',
    toName: 'Max',
    give: { kind: 'pet', id: 'bat' },
    want: null,
    status: 'pending',
    fromSettled: false,
  }

  it('receives on accept, takes back on decline or cancel, and does nothing twice', () => {
    expect(giverSettlement(trade)).toBeNull()
    expect(giverSettlement({ ...trade, status: 'accepted' })).toBe('receive')
    expect(giverSettlement({ ...trade, status: 'declined' })).toBe('return')
    expect(giverSettlement({ ...trade, status: 'cancelled' })).toBe('return')
    expect(giverSettlement({ ...trade, status: 'accepted', fromSettled: true })).toBeNull()
  })
})
