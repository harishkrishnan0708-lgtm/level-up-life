import { levelProgress } from './game'
import type { Hero } from './hero'
import { mightBreakdown, totalMight, type Rival } from './raids'

/**
 * Raiding friends' kingdoms. A player who signs in publishes a small snapshot of their kingdom; a friend with their
 * raid code turns that snapshot into a castle to besiege. Nothing is lost or won yet, so a siege played on one phone
 * can't cost anyone anything.
 */

/** What a player shares with friends: enough to build their castle, and nothing about their habits. */
export interface KingdomSnapshot {
  code: string
  name: string
  level: number
  might: number
  /** How many of each building they own, by id. */
  buildings: Record<string, number>
}

/** Codes skip letters and digits that look alike, so they're easy to read out and type. */
const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const RAID_CODE_LENGTH = 6

export function newRaidCode(random: () => number = Math.random): string {
  return Array.from({ length: RAID_CODE_LENGTH }, () => CODE_LETTERS[Math.floor(random() * CODE_LETTERS.length)]).join('')
}

/** Tidies what a player typed into the form a code is stored in, or null if it can't be a code. */
export function normalizeRaidCode(typed: string): string | null {
  const code = typed.trim().toUpperCase().replace(/[\s-]/g, '')
  return code.length === RAID_CODE_LENGTH && [...code].every((letter) => CODE_LETTERS.includes(letter)) ? code : null
}

export function snapshotOf(hero: Hero, code: string): KingdomSnapshot {
  return {
    code,
    name: hero.name.slice(0, 40),
    level: levelProgress(hero.game.totalXp).level,
    might: totalMight(mightBreakdown(hero.game, hero.holdings, hero.pets)),
    buildings: { ...hero.holdings.buildings },
  }
}

const PLAYER_PREFIX = 'player:'

export function isPlayerRival(rivalId: string): boolean {
  return rivalId.startsWith(PLAYER_PREFIX)
}

/** The account a player-built rival belongs to. */
export function playerOf(rivalId: string): string | null {
  return isPlayerRival(rivalId) ? rivalId.slice(PLAYER_PREFIX.length) : null
}

/**
 * A friend's kingdom as a castle to besiege. Their might mans the walls, their walls and watchtowers make it harder to
 * break, and a higher level means steadier defenders. No loot: friendly raids are for bragging rights.
 */
export function rivalFromKingdom(kingdom: KingdomSnapshot, ownerUid: string): Rival {
  const count = (id: string) => kingdom.buildings[id] ?? 0
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, Math.round(value)))
  const total = Object.values(kingdom.buildings).reduce((sum, owned) => sum + owned, 0)
  return {
    id: `${PLAYER_PREFIX}${ownerUid}`,
    name: `${kingdom.name}’s kingdom`,
    title: `A real player · level ${kingdom.level}`,
    loot: 0,
    reputation: `Built from their own quests: ${total} ${total === 1 ? 'building' : 'buildings'}. Friendly raid, so nothing is won or lost.`,
    garrison: clamp(50 + 10 * kingdom.might, 50, 200),
    gate: clamp(50 + (count('keep') ? 15 : 0) + 3 * count('wall'), 40, 95),
    walls: clamp(45 + 6 * count('wall'), 40, 95),
    towers: clamp(30 + 10 * count('watchtower'), 25, 90),
    morale: clamp(60 + 2 * kingdom.level, 60, 90),
    supplies: clamp(12 + 2 * (count('hut') + count('fountain')), 12, 24),
    reliefDay: 13,
    sallyChance: Math.min(0.45, 0.15 + 0.05 * count('tent')),
    trapChance: 0.25,
    informantCost: 15,
    orderTier: 3,
    openingMoves: ['spotted', 'raid-supplies'],
  }
}

/** Checks a castle saved with a siege, since saved data can be damaged or edited. */
export function isSavedFoe(value: unknown): value is Rival {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const foe = value as Record<string, unknown>
  const numbers = ['loot', 'garrison', 'gate', 'walls', 'towers', 'morale', 'supplies', 'reliefDay', 'sallyChance', 'trapChance', 'informantCost', 'orderTier']
  return (
    typeof foe.id === 'string' &&
    isPlayerRival(foe.id) &&
    typeof foe.name === 'string' &&
    typeof foe.title === 'string' &&
    typeof foe.reputation === 'string' &&
    numbers.every((key) => typeof foe[key] === 'number' && Number.isFinite(foe[key])) &&
    Array.isArray(foe.openingMoves) &&
    foe.openingMoves.length > 0
  )
}

/** Checks a kingdom read back from the server before it's trusted. */
export function isKingdomSnapshot(value: unknown): value is KingdomSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const kingdom = value as Record<string, unknown>
  return (
    typeof kingdom.code === 'string' &&
    typeof kingdom.name === 'string' &&
    Number.isInteger(kingdom.level) &&
    Number.isInteger(kingdom.might) &&
    typeof kingdom.buildings === 'object' &&
    kingdom.buildings !== null &&
    Object.values(kingdom.buildings).every((owned) => Number.isInteger(owned) && (owned as number) >= 0)
  )
}

/** What a raid report says, from the side of whoever reads it. */
export interface RaidReport {
  id: string
  attackerName: string
  outcome: 'victory' | 'defeat' | 'stalemate'
  /** When the raid ended, in milliseconds. */
  at: number
}

export function describeRaidOnYou(report: RaidReport): string {
  switch (report.outcome) {
    case 'victory':
      return `${report.attackerName} raided your kingdom and took it.`
    case 'defeat':
      return `${report.attackerName} raided your kingdom, and your walls held.`
    case 'stalemate':
      return `${report.attackerName} raided your kingdom, then thought better of it and withdrew.`
  }
}
