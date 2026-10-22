import { describe, expect, it } from 'vitest'
import { QUESTS, newGame } from './game'
import { RIVALS, newWarRecord, raidReadiness, recordRaid, scoutAccuracy, type Rival } from './raids'
import {
  availableActions,
  chooseEventOption,
  reliefBattleChance,
  sanitizeSiege,
  sanitizeWarRecord,
  startSiege,
  takeAction,
  tossCoin,
  type Random,
  type Siege,
} from './siege'
import { newHoldings } from './wares'

const DAY = '2026-10-14'

/** A repeatable stream of "random" numbers, so every test plays out the same way each run. */
function seeded(seed: number): Random {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const has = (siege: Siege, id: string) => availableActions(siege).some((action) => action.id === id)
const rivalOf = (siege: Siege) => RIVALS.find((rival) => rival.id === siege.rivalId)!

/** Plays like a sensible commander: scouts, builds engines, bombards around their repairs, and times the assault. */
function smartOrder(siege: Siege): string {
  const daysLeft = rivalOf(siege).reliefDay - siege.day
  switch (siege.phase) {
    case 'approach':
      return has(siege, 'scout') ? 'scout' : 'river'
    case 'encircle':
      if (siege.army.engines < 2) return 'build'
      if (has(siege, 'camp') && rivalOf(siege).sallyChance > 0.2) return 'camp'
      return 'begin-bombard'
    case 'bombard':
      if (siege.army.supplies < 1 && siege.flags.forageCount < 3) return 'forage'
      if (daysLeft <= 2 || siege.estimates.gate < 30) return 'begin-assault'
      return siege.reinforced === 'gate' ? 'fire-towers' : 'fire-gate'
    case 'assault':
      if (has(siege, 'sally-port')) return 'sally-port'
      if (siege.army.morale < 40 && has(siege, 'rally')) return 'rally'
      return has(siege, 'breach') ? 'breach' : 'ram'
    case 'keep': {
      const chance = (id: string) => Number(availableActions(siege).find((action) => action.id === id)!.detail.match(/(\d+)%/)![1])
      if (chance('terms') >= 60) return 'terms'
      return chance('storm-keep') >= 45 ? 'storm-keep' : 'plunder'
    }
  }
}

/** Plays like a careless commander: straight down the road and up the ladders. */
function rushOrder(siege: Siege): string {
  return { approach: 'road', encircle: 'begin-assault', bombard: 'begin-assault', assault: 'ladders', keep: 'storm-keep' }[siege.phase]
}

function sensibleEventChoice(siege: Siege): string {
  switch (siege.event) {
    case 'relief-arrives':
      return reliefBattleChance(siege) >= 0.45 ? 'fight' : 'withdraw'
    case 'disease':
      return 'quarantine'
    case 'traitor':
      return 'pay'
    case 'surrender-offer':
      return 'accept'
    default:
      return 'ok'
  }
}

function playSiege(order: (siege: Siege) => string, rival: Rival, might: number, seed: number): Siege {
  const random = seeded(seed)
  let siege = tossCoin(startSiege({ rival, might, accuracy: 0.7, engines: 0 }, random), 'heads', random)
  for (let turn = 0; turn < 100 && !siege.outcome; turn++) {
    siege = siege.event ? chooseEventOption(siege, sensibleEventChoice(siege), random) : takeAction(siege, order(siege), random)
  }
  return siege
}

function winRate(order: (siege: Siege) => string, rival: Rival, might: number, games = 300): number {
  let wins = 0
  for (let seed = 1; seed <= games; seed++) {
    wins += playSiege(order, rival, might, seed * 7919).outcome?.kind === 'victory' ? 1 : 0
  }
  return wins / games
}

describe('siege balance', () => {
  it('lets a smart commander beat a careless rush against every rival', () => {
    for (const rival of RIVALS) {
      expect(winRate(smartOrder, rival, 4), rival.id).toBeGreaterThan(winRate(rushOrder, rival, 4) + 0.4)
    }
  })

  it('rewards a stronger kingdom', () => {
    for (const rival of RIVALS) {
      expect(winRate(smartOrder, rival, 6), rival.id).toBeGreaterThan(winRate(smartOrder, rival, 2))
    }
  })

  it('takes a commander around 15 to 25 decisions, enough for a 5 to 10 minute battle', () => {
    for (const rival of RIVALS) {
      const games = Array.from({ length: 100 }, (_, index) => playSiege(smartOrder, rival, 4, (index + 1) * 104729))
      const averageDecisions = games.reduce((total, siege) => total + siege.decisions, 0) / games.length
      expect(averageDecisions, rival.id).toBeGreaterThanOrEqual(15)
      expect(averageDecisions, rival.id).toBeLessThanOrEqual(25)
      expect(games.every((siege) => siege.outcome !== null)).toBe(true)
    }
  })
})

describe('siege rules', () => {
  const rival = RIVALS[0]
  // A random number under 0.5 makes the coin land heads, so calling heads wins the toss.
  const fresh = () => tossCoin(startSiege({ rival, might: 3, accuracy: 0.7, engines: 0 }, seeded(1)), 'heads', () => 0.1)

  it('starts on the approach, with the bribe and the routes on offer', () => {
    const ids = availableActions(fresh()).map((action) => action.id)
    expect(ids).toEqual(expect.arrayContaining(['scout', 'informant', 'road', 'forest', 'river', 'retreat']))
    expect(availableActions(fresh()).find((action) => action.id === 'informant')?.coinCost).toBe(rival.informantCost)
  })

  it('tells the truth and reveals a secret way in when you bribe an informant', () => {
    const siege = takeAction(fresh(), 'informant', seeded(2))
    expect(siege.estimates.garrison).toBe(siege.enemy.garrison)
    expect(siege.flags.sallyPortKnown).toBe(true)
  })

  it('needs a trebuchet before bombarding', () => {
    const arrived = takeAction(fresh(), 'road', seeded(3))
    const settled = arrived.event ? chooseEventOption(arrived, 'ok', seeded(3)) : arrived
    expect(has(settled, 'begin-bombard')).toBe(false)
    let built = takeAction(settled, 'build', seeded(4))
    built = built.event ? chooseEventOption(built, sensibleEventChoice(built), seeded(4)) : built
    expect(has(built, 'begin-bombard')).toBe(true)
  })

  it('punishes hitting the same section the defenders just shored up', () => {
    const siege: Siege = { ...fresh(), phase: 'bombard', army: { ...fresh().army, engines: 2 }, reinforced: 'gate' }
    const shored = siege.enemy.gate - takeAction(siege, 'fire-gate', () => 0.5).enemy.gate
    const open = siege.enemy.gate - takeAction({ ...siege, reinforced: 'towers' }, 'fire-gate', () => 0.5).enemy.gate
    expect(shored).toBeLessThan(open)
  })

  it('ends in defeat when too many soldiers fall', () => {
    const siege: Siege = { ...fresh(), phase: 'assault', army: { ...fresh().army, troops: 30 } }
    expect(takeAction(siege, 'ladders', () => 0.5).outcome?.kind).toBe('defeat')
  })

  it('always lets you retreat, which costs nothing', () => {
    expect(takeAction(fresh(), 'retreat', seeded(5)).outcome).toEqual(expect.objectContaining({ kind: 'stalemate', loot: 0 }))
  })

  it('restores a saved siege and drops a damaged one', () => {
    const siege = takeAction(fresh(), 'scout', seeded(6))
    expect(sanitizeSiege(JSON.parse(JSON.stringify(siege)))).toEqual(siege)
    expect(sanitizeSiege({ ...siege, rivalId: 'nobody' })).toBeNull()
    expect(sanitizeSiege({ ...siege, army: { troops: 'many' } })).toBeNull()
  })
})

describe('the opening coin toss', () => {
  const untossed = () => startSiege({ rival: RIVALS[2], might: 3, accuracy: 0.7, engines: 0 }, seeded(1))

  it('must happen before any order can be given', () => {
    expect(availableActions(untossed())).toEqual([])
    expect(takeAction(untossed(), 'road', seeded(2))).toEqual(untossed())
  })

  it('gives the first move to you when your call is right, at no cost', () => {
    const won = tossCoin(untossed(), 'heads', () => 0.1)
    expect(won.coin).toEqual({ call: 'heads', landed: 'heads' })
    expect(won.army).toEqual(untossed().army)
    expect(availableActions(won).length).toBeGreaterThan(0)
  })

  it('lets the defender move first when your call is wrong', () => {
    // Gorrak raids your supply wagons when he wins the toss.
    const lost = tossCoin(untossed(), 'tails', () => 0.1)
    expect(lost.coin?.landed).toBe('heads')
    expect(lost.army.supplies).toBe(untossed().army.supplies - 3)
    expect(lost.log.at(-1)?.tone).toBe('bad')
  })

  it('only happens once', () => {
    const won = tossCoin(untossed(), 'heads', () => 0.1)
    expect(tossCoin(won, 'tails', () => 0.9)).toBe(won)
  })
})

describe('when a hero may raid', () => {
  const perfectDay = { ...newGame(DAY), completedQuestIds: QUESTS.map((quest) => quest.id) }

  it('only after every quest is done, once per day, or any time under test luck', () => {
    expect(raidReadiness(newGame(DAY), newWarRecord(), DAY)).toBe('quests-unfinished')
    expect(raidReadiness(perfectDay, newWarRecord(), DAY)).toBe('ready')
    expect(raidReadiness(perfectDay, { ...newWarRecord(), lastRaidDay: DAY }, DAY)).toBe('already-raided')
    expect(raidReadiness(newGame(DAY), { ...newWarRecord(), lastRaidDay: DAY }, DAY, true)).toBe('ready')
  })

  it('sharpens scouts with watchtowers and training, but never past 95%', () => {
    expect(scoutAccuracy({ ...newHoldings(DAY), scoutRank: 2 })).toBeCloseTo(0.7)
    expect(scoutAccuracy({ ...newHoldings(DAY), scoutRank: 4, buildings: { watchtower: 4 } })).toBeCloseTo(0.95)
  })

  it('keeps a record of every outcome, and cleans up damaged saves', () => {
    expect(recordRaid(recordRaid(newWarRecord(), 'victory'), 'stalemate')).toMatchObject({ victories: 1, stalemates: 1 })
    expect(sanitizeWarRecord({ victories: -2, defeats: 'lots', lastRaidDay: DAY, trainingDone: true })).toEqual({
      ...newWarRecord(),
      lastRaidDay: DAY,
      trainingDone: true,
    })
  })
})
