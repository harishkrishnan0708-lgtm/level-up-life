export type QuestCategory = 'exercise' | 'healthy'

export interface Quest {
  id: string
  /** Dark fantasy flavour name, shown above the plain instruction. */
  trial: string
  name: string
  category: QuestCategory
  xp: number
  coins: number
}

export const QUESTS: readonly Quest[] = [
  { id: 'lift', trial: 'Trial of Iron', name: 'Lift at the gym', category: 'exercise', xp: 30, coins: 10 },
  { id: 'sports', trial: 'The Arena', name: 'Play sports', category: 'exercise', xp: 30, coins: 10 },
  { id: 'walk', trial: 'The Long Road', name: 'Walk to class', category: 'exercise', xp: 15, coins: 5 },
  { id: 'sleep', trial: 'Rest at the Hearth', name: 'Sleep 7+ hours', category: 'healthy', xp: 20, coins: 5 },
  { id: 'water', trial: 'Drink from the Spring', name: 'Drink 8 glasses of water', category: 'healthy', xp: 15, coins: 5 },
  { id: 'food', trial: 'Feast of Vigor', name: 'Eat a healthy meal', category: 'healthy', xp: 20, coins: 5 },
  { id: 'screen', trial: 'Resist the Scrying Glass', name: 'Stay under your screen time limit', category: 'healthy', xp: 20, coins: 5 },
]

export type HeroClass = 'warrior' | 'ranger' | 'mage' | 'rogue'

export interface HeroClassInfo {
  id: HeroClass
  name: string
  /** Quests this class earns bonus XP on. */
  favoredQuestIds: readonly string[]
  blurb: string
}

export const HERO_CLASSES: readonly HeroClassInfo[] = [
  { id: 'warrior', name: 'Warrior', favoredQuestIds: ['lift'], blurb: 'Bonus XP for lifting' },
  { id: 'ranger', name: 'Ranger', favoredQuestIds: ['sports', 'walk'], blurb: 'Bonus XP for sports and walking' },
  { id: 'mage', name: 'Mage', favoredQuestIds: ['sleep', 'screen'], blurb: 'Bonus XP for sleep and screen time' },
  { id: 'rogue', name: 'Rogue', favoredQuestIds: ['water', 'food'], blurb: 'Bonus XP for water and food' },
]

export const CLASS_BONUS_MULTIPLIER = 1.5

export function heroClassInfo(heroClass: HeroClass): HeroClassInfo {
  return HERO_CLASSES.find((info) => info.id === heroClass) ?? HERO_CLASSES[0]
}

export function hasClassBonus(quest: Quest, heroClass: HeroClass): boolean {
  return heroClassInfo(heroClass).favoredQuestIds.includes(quest.id)
}

/** XP a quest is worth for a hero of the given class. */
export function questXp(quest: Quest, heroClass: HeroClass): number {
  return hasClassBonus(quest, heroClass) ? Math.round(quest.xp * CLASS_BONUS_MULTIPLIER) : quest.xp
}

export interface GameState {
  totalXp: number
  coins: number
  /** Local calendar date (YYYY-MM-DD) that completedQuestIds belongs to. */
  day: string
  completedQuestIds: string[]
  /** XP each completed quest actually earned, so undo takes back the same amount even if the class changed since. */
  earnedXp?: Record<string, number>
}

export interface LevelProgress {
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
}

/** XP needed to go from `level` to `level + 1`. Each level takes a bit longer than the last. */
export function xpNeededForLevel(level: number): number {
  return 100 + 50 * (level - 1)
}

export function levelProgress(totalXp: number): LevelProgress {
  let level = 1
  let remaining = Math.max(0, totalXp)
  while (remaining >= xpNeededForLevel(level)) {
    remaining -= xpNeededForLevel(level)
    level += 1
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: xpNeededForLevel(level) }
}

function pickByLevel<T extends { minLevel: number }>(tiers: readonly T[], level: number): T {
  return tiers.find((tier) => level >= tier.minLevel) ?? tiers[tiers.length - 1]
}

const RANKS = [
  { minLevel: 12, name: 'Dreadlord' },
  { minLevel: 8, name: 'Warlord' },
  { minLevel: 5, name: 'Knight' },
  { minLevel: 3, name: 'Squire' },
  { minLevel: 1, name: 'Wanderer' },
] as const

export function rankName(level: number): string {
  return pickByLevel(RANKS, level).name
}

export interface Companion {
  name: string
}

const COMPANION_STAGES = [
  { minLevel: 10, name: 'Elder dragon' },
  { minLevel: 5, name: 'Young dragon' },
  { minLevel: 2, name: 'Dragon hatchling' },
  { minLevel: 1, name: 'Dragon egg' },
] as const

/** The hero's dragon companion grows as the hero levels up. */
export function companionAt(level: number): Companion {
  const stage = pickByLevel(COMPANION_STAGES, level)
  return { name: stage.name }
}

export function toLocalDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function newGame(today: string): GameState {
  return { totalXp: 0, coins: 0, day: today, completedQuestIds: [] }
}

/** Quests reset each day; XP and coins are kept. */
export function startDay(state: GameState, today: string): GameState {
  return state.day === today ? state : { ...state, day: today, completedQuestIds: [], earnedXp: {} }
}

/**
 * Marks a quest done (or undoes it if already done) and adjusts XP and coins to match.
 * `xpMultiplier` comes from potions and pets; it never changes coins, so they can't be used to farm money.
 */
export function toggleQuest(state: GameState, questId: string, heroClass: HeroClass, xpMultiplier = 1, quests: readonly Quest[] = QUESTS): GameState {
  const quest = quests.find((candidate) => candidate.id === questId)
  if (!quest) {
    return state
  }
  const { [questId]: previouslyEarned, ...otherEarnedXp } = state.earnedXp ?? {}
  if (state.completedQuestIds.includes(questId)) {
    return {
      ...state,
      totalXp: Math.max(0, state.totalXp - (previouslyEarned ?? questXp(quest, heroClass))),
      coins: Math.max(0, state.coins - quest.coins),
      completedQuestIds: state.completedQuestIds.filter((id) => id !== questId),
      earnedXp: otherEarnedXp,
    }
  }
  const xp = Math.round(questXp(quest, heroClass) * xpMultiplier)
  return {
    ...state,
    totalXp: state.totalXp + xp,
    coins: state.coins + quest.coins,
    completedQuestIds: [...state.completedQuestIds, questId],
    earnedXp: { ...otherEarnedXp, [questId]: xp },
  }
}

export function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.totalXp === 'number' &&
    candidate.totalXp >= 0 &&
    typeof candidate.coins === 'number' &&
    candidate.coins >= 0 &&
    typeof candidate.day === 'string' &&
    Array.isArray(candidate.completedQuestIds) &&
    candidate.completedQuestIds.every((id) => typeof id === 'string') &&
    (candidate.earnedXp === undefined ||
      (typeof candidate.earnedXp === 'object' &&
        candidate.earnedXp !== null &&
        Object.values(candidate.earnedXp).every((xp) => typeof xp === 'number')))
  )
}
