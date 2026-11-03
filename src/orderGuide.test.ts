import { describe, expect, it } from 'vitest'
import { NUMBERS_GUIDE, ORDER_CATEGORIES, ORDER_GUIDE, PHASE_GUIDE, orderTabs } from './orderGuide'
import { PRACTICE_RIVAL, RIVALS, type Rival } from './raids'
import { PHASES, availableActions, chooseEventOption, eventChoices, startSiege, takeAction, tossCoin, type Random, type Siege } from './siege'

function seeded(seed: number): Random {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/** Every order a player could be offered, found by playing many sieges with random choices. */
function ordersOffered(): Set<string> {
  const offered = new Set<string>()
  for (const rival of [PRACTICE_RIVAL, ...RIVALS]) {
    for (let game = 1; game <= 150; game++) {
      const random = seeded(game * 7919)
      let siege: Siege = tossCoin(startSiege({ rival, might: 6, accuracy: 0.7, engines: 1 }, random), 'heads', () => 0.1)
      for (let turn = 0; turn < 80 && !siege.outcome; turn++) {
        if (siege.event) {
          siege = chooseEventOption(siege, eventChoices(siege)[0].id, random)
          continue
        }
        const actions = availableActions(siege)
        actions.forEach(({ id }) => offered.add(id))
        const choices = actions.filter((action) => !action.retreat)
        siege = takeAction(siege, choices[Math.floor(random() * choices.length)].id, random)
      }
    }
  }
  return offered
}

describe('the siege guide', () => {
  it('explains every order a player can be offered, and no order that no longer exists', () => {
    expect([...ordersOffered()].sort()).toEqual(Object.keys(ORDER_GUIDE).sort())
  })

  it('puts every order in a tab, apart from the retreat and the keep’s short list', () => {
    const untabbed = ['retreat', 'storm-keep', 'terms', 'plunder']
    const tabbed = [...ordersOffered()].filter((id) => !untabbed.includes(id))
    expect(tabbed.sort()).toEqual(Object.keys(ORDER_CATEGORIES).sort())
  })

  it('explains every phase', () => {
    for (const { id } of PHASES) {
      expect(PHASE_GUIDE[id], id).toBeTruthy()
    }
  })

  it('explains the numbers on the siege screen', () => {
    expect(NUMBERS_GUIDE.map(({ name }) => name)).toEqual(expect.arrayContaining(['Soldiers', 'Morale', 'Food', 'Foothold']))
  })
})

describe('order tabs', () => {
  const orderIds = (rival: Rival) => {
    const siege = tossCoin(startSiege({ rival, might: 3, accuracy: 0.7, engines: 0 }, seeded(1)), 'heads', () => 0.1)
    return availableActions(siege).filter((action) => !action.retreat)
  }

  it('keeps a short list plain', () => {
    expect(orderTabs(orderIds(PRACTICE_RIVAL))).toEqual([])
  })

  it('splits a long list into tabs without losing any order', () => {
    const orders = orderIds(RIVALS[1])
    const tabs = orderTabs(orders)
    expect(tabs.map(({ name }) => name)).toEqual(['Prepare', 'March'])
    expect(tabs.flatMap((tab) => tab.orders)).toHaveLength(orders.length)
  })
})
