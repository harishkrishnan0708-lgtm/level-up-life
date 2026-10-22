import { levelProgress, type GameState } from './game'
import { isPerfectDay, newQuestPlan, type QuestPlan } from './questPlan'
import { petById, type PetRarity, type PetState } from './pets'
import type { Siege } from './siege'
import type { Holdings } from './wares'

/** What a defender does with the first move when they win the coin toss. */
export type OpeningMove = 'spotted' | 'shore-gate' | 'raid-supplies' | 'ill-omens'

export interface Rival {
  id: string
  name: string
  title: string
  /** Coins for taking the keep outright; terms or plunder pay less. */
  loot: number
  /** A hint about how they fight. */
  reputation: string
  garrison: number
  /** Starting strength of the gate, walls, and towers, out of 100. */
  gate: number
  walls: number
  towers: number
  morale: number
  /** Days of food behind their walls. */
  supplies: number
  /** The siege day their allies arrive to lift the siege. */
  reliefDay: number
  /** Chance on any night that they ride out to raid your camp. */
  sallyChance: number
  /** Chance that ladders, mines, or traitors run into a trap. */
  trapChance: number
  informantCost: number
  /** The first moves this rival likes to make when they win the toss. */
  openingMoves: readonly OpeningMove[]
}

export const RIVALS: readonly Rival[] = [
  {
    id: 'mordrake',
    name: 'Baron Mordrake',
    title: 'Lord of the Grey Keep',
    loot: 20,
    reputation: 'Thick walls and a patient garrison. His allies are slow to come. Lately his soldiers carry new steel.',
    garrison: 65,
    gate: 75,
    walls: 100,
    towers: 55,
    morale: 70,
    supplies: 24,
    reliefDay: 16,
    sallyChance: 0.1,
    trapChance: 0.1,
    informantCost: 10,
    openingMoves: ['shore-gate', 'spotted'],
  },
  {
    id: 'witch',
    name: 'The Ash Witch',
    title: 'Mistress of the Cinder Fen',
    loot: 30,
    reputation: 'Hoards food and loves a trap. Ladders and tunnels are risky here. Moths swarm her towers at night.',
    garrison: 70,
    gate: 70,
    walls: 80,
    towers: 75,
    morale: 75,
    supplies: 28,
    reliefDay: 13,
    sallyChance: 0.15,
    trapChance: 0.35,
    informantCost: 15,
    openingMoves: ['ill-omens', 'spotted'],
  },
  {
    id: 'gorrak',
    name: 'Gorrak the Warlord',
    title: 'Chieftain of the Red Steppe',
    loot: 40,
    reputation: 'A huge war band behind weak walls, short on food, quick to ride out. His allies come fast. His riders are paid in fresh gold.',
    garrison: 110,
    gate: 60,
    walls: 60,
    towers: 40,
    morale: 85,
    supplies: 14,
    reliefDay: 12,
    sallyChance: 0.4,
    trapChance: 0.1,
    informantCost: 20,
    openingMoves: ['raid-supplies', 'spotted'],
  },
]

/** The tutorial target: a crumbling fort held by a few deserters, with no allies coming to help. */
export const PRACTICE_RIVAL: Rival = {
  id: 'old-fort',
  name: 'The Old Watch Fort',
  title: 'Held by a band of deserters',
  loot: 15,
  reputation: 'Crumbling walls and a small, nervous garrison. Nobody is coming to save them. Strangely well armed, for deserters.',
  garrison: 35,
  gate: 55,
  walls: 60,
  towers: 30,
  morale: 50,
  supplies: 12,
  reliefDay: 99,
  sallyChance: 0.05,
  trapChance: 0,
  informantCost: 0,
  openingMoves: ['spotted'],
}

export function rivalById(rivalId: string): Rival | undefined {
  return rivalId === PRACTICE_RIVAL.id ? PRACTICE_RIVAL : RIVALS.find((rival) => rival.id === rivalId)
}

const PET_MIGHT: Record<PetRarity, number> = { common: 0, uncommon: 0, rare: 1, epic: 1, legendary: 2 }

export interface MightPart {
  label: string
  amount: number
}

/** Where the hero's might comes from: their level, kingdom, and pet. Each point of might is ten more soldiers. */
export function mightBreakdown(game: GameState, holdings: Holdings, pets: PetState): MightPart[] {
  const parts: MightPart[] = [{ label: 'Your banner', amount: 1 }]
  const levelMight = Math.floor(levelProgress(game.totalXp).level / 3)
  if (levelMight > 0) {
    parts.push({ label: 'Hero level', amount: levelMight })
  }
  const tents = holdings.buildings.tent ?? 0
  if (tents > 0) {
    parts.push({ label: tents === 1 ? 'War tent' : 'War tents', amount: tents })
  }
  if (holdings.buildings.keep) {
    parts.push({ label: 'Castle keep', amount: 2 })
  }
  const pet = petById(pets.activePetId)
  if (pet && PET_MIGHT[pet.rarity] > 0) {
    parts.push({ label: pet.name, amount: PET_MIGHT[pet.rarity] })
  }
  return parts
}

export function totalMight(parts: readonly MightPart[]): number {
  return parts.reduce((total, part) => total + part.amount, 0)
}

export const MAX_SCOUT_ACCURACY = 0.95

/** How reliable scout reports are: better with watchtowers and scout training from the merchant. */
export function scoutAccuracy(holdings: Holdings): number {
  return Math.min(MAX_SCOUT_ACCURACY, 0.6 + 0.1 * (holdings.buildings.watchtower ?? 0) + 0.05 * holdings.scoutRank)
}

/** A blacksmith sends a ready-built trebuchet along with the army. */
export function startingEngines(holdings: Holdings): number {
  return holdings.buildings.forge ? 1 : 0
}

export type RaidOutcome = 'victory' | 'defeat' | 'stalemate'

export interface WarRecord {
  /** The last day the hero marched, since a hero may raid once a day. */
  lastRaidDay: string | null
  victories: number
  defeats: number
  stalemates: number
  /** A siege in progress, kept so leaving the app doesn't lose it. */
  activeSiege: Siege | null
  /** Whether the hero has finished (or skipped) the practice siege. */
  trainingDone: boolean
  /** Every rival the hero has beaten at least once, practice fort included, in the order they fell. Unlocks story chapters. */
  beaten: string[]
}

export function newWarRecord(): WarRecord {
  return { lastRaidDay: null, victories: 0, defeats: 0, stalemates: 0, activeSiege: null, trainingDone: false, beaten: [] }
}

/** Notes a rival as beaten, once. */
export function markBeaten(war: WarRecord, rivalId: string): WarRecord {
  return war.beaten.includes(rivalId) ? war : { ...war, beaten: [...war.beaten, rivalId] }
}

export type RaidReadiness = 'ready' | 'quests-unfinished' | 'already-raided'

/** Raiding is the reward for a perfect day, once per day. Test luck lifts both limits on the development server. */
export function raidReadiness(game: GameState, war: WarRecord, today: string, testLuck = false, plan: QuestPlan = newQuestPlan()): RaidReadiness {
  if (testLuck) {
    return 'ready'
  }
  if (war.lastRaidDay === today) {
    return 'already-raided'
  }
  return game.day === today && isPerfectDay(game, plan) ? 'ready' : 'quests-unfinished'
}

export function recordRaid(war: WarRecord, outcome: RaidOutcome): WarRecord {
  return {
    ...war,
    victories: war.victories + (outcome === 'victory' ? 1 : 0),
    defeats: war.defeats + (outcome === 'defeat' ? 1 : 0),
    stalemates: war.stalemates + (outcome === 'stalemate' ? 1 : 0),
  }
}
