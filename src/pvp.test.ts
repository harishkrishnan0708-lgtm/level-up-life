import { describe, expect, it } from 'vitest'
import { newGame } from './game'
import { EMPTY_ROSTER, activeHero, addHero, newHeroDraft } from './hero'
import {
  RAID_CODE_LENGTH,
  describeRaidOnYou,
  isKingdomSnapshot,
  isPlayerRival,
  newRaidCode,
  normalizeRaidCode,
  playerOf,
  rivalFromKingdom,
  snapshotOf,
  type KingdomSnapshot,
} from './pvp'
import { availableActions, sanitizeSiege, startSiege, takeAction, tossCoin } from './siege'

const bare: KingdomSnapshot = { code: 'K7Q2MX', name: 'Max', level: 2, might: 1, buildings: {} }
const fortified: KingdomSnapshot = { code: 'K7Q2MX', name: 'Max', level: 12, might: 7, buildings: { wall: 6, watchtower: 4, keep: 1, tent: 3 } }

describe('raid codes', () => {
  it('are six easy-to-read characters, and typing one is forgiving', () => {
    const code = newRaidCode()
    expect(code).toHaveLength(RAID_CODE_LENGTH)
    expect(code).not.toMatch(/[01IOL]/)
    expect(normalizeRaidCode(' k7q2-mx ')).toBe('K7Q2MX')
    expect(normalizeRaidCode('K7Q2M')).toBeNull()
    expect(normalizeRaidCode('K7Q2M0')).toBeNull()
  })
})

describe('a friend’s kingdom as a castle', () => {
  it('gets harder to take the more the friend has built and grown', () => {
    const easy = rivalFromKingdom(bare, 'max-uid')
    const hard = rivalFromKingdom(fortified, 'max-uid')
    for (const stat of ['garrison', 'gate', 'walls', 'towers', 'morale'] as const) {
      expect(hard[stat], stat).toBeGreaterThan(easy[stat])
    }
  })

  it('pays no loot and remembers whose it is', () => {
    const castle = rivalFromKingdom(bare, 'max-uid')
    expect(castle.loot).toBe(0)
    expect(isPlayerRival(castle.id)).toBe(true)
    expect(playerOf(castle.id)).toBe('max-uid')
    expect(playerOf('mordrake')).toBeNull()
  })

  it('plays as a full siege that survives closing the app', () => {
    const castle = rivalFromKingdom(fortified, 'max-uid')
    let siege = tossCoin(startSiege({ rival: castle, might: 4, accuracy: 0.7, engines: 0 }, () => 0.5), 'heads', () => 0.1)
    expect(availableActions(siege).length).toBeGreaterThan(0)
    siege = takeAction(siege, 'scout', () => 0.5)
    const reloaded = sanitizeSiege(JSON.parse(JSON.stringify(siege)))
    expect(reloaded?.foe?.name).toBe('Max’s kingdom')
    expect(sanitizeSiege({ ...siege, foe: { ...castle, garrison: 'lots' } })).toBeNull()
  })
})

describe('what a player shares', () => {
  it('is their name, level, might, and buildings, and nothing about their habits', () => {
    const hero = activeHero(addHero(EMPTY_ROSTER, { ...newHeroDraft(), name: 'Harish' }, newGame('2026-11-05')))!
    const shared = snapshotOf(hero, 'K7Q2MX')
    expect(Object.keys(shared).sort()).toEqual(['buildings', 'code', 'level', 'might', 'name'])
    expect(isKingdomSnapshot(shared)).toBe(true)
    expect(isKingdomSnapshot({ ...shared, level: 'high' })).toBe(false)
  })

  it('tells the defender how a raid on them went', () => {
    expect(describeRaidOnYou({ id: '1', attackerName: 'Max', outcome: 'defeat', at: 0 })).toContain('your walls held')
  })
})
