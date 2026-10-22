import type { QuestCategory } from './game'

export type PetRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export const PET_RARITIES: readonly PetRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export const RARITY_LABELS: Record<PetRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

/** Chance of finding an egg on a day when every quest is done. */
export const EGG_CHANCE = 0.4

/** Chance an egg is each rarity, as Harish chose them. */
export const RARITY_CHANCES: Record<PetRarity, number> = {
  legendary: 0.01,
  epic: 0.09,
  rare: 0.2,
  uncommon: 0.3,
  common: 0.4,
}

/** How many quests it takes to warm an egg until it hatches. */
export const WARMTH_NEEDED: Record<PetRarity, number> = {
  common: 10,
  uncommon: 15,
  rare: 20,
  epic: 30,
  legendary: 50,
}

export interface Pet {
  id: string
  name: string
  rarity: PetRarity
  description: string
  /** Which quests the pet's XP bonus applies to while it follows the hero. */
  bonusFor: QuestCategory | 'all'
  /** Extra XP as a fraction, e.g. 0.05 for +5%. */
  bonus: number
}

export const PETS: readonly Pet[] = [
  { id: 'rat', name: 'Sewer rat', rarity: 'common', bonusFor: 'healthy', bonus: 0.03, description: 'Survives on scraps, and somehow thrives.' },
  { id: 'bat', name: 'Cave bat', rarity: 'common', bonusFor: 'exercise', bonus: 0.03, description: 'Never stops moving. Never.' },
  { id: 'toad', name: 'Bog toad', rarity: 'common', bonusFor: 'healthy', bonus: 0.03, description: 'Sits very still. Sleeps very well.' },
  { id: 'cat', name: 'Black cat', rarity: 'uncommon', bonusFor: 'healthy', bonus: 0.05, description: 'Bad luck for everyone but you. Hisses at shadows nobody else can see.' },
  { id: 'spider', name: 'Grave spider', rarity: 'uncommon', bonusFor: 'exercise', bonus: 0.05, description: 'Eight legs. No rest days.' },
  { id: 'adder', name: 'Marsh adder', rarity: 'uncommon', bonusFor: 'exercise', bonus: 0.05, description: 'Strikes fast, then strikes again.' },
  { id: 'wolf', name: 'Dire wolf', rarity: 'rare', bonusFor: 'exercise', bonus: 0.08, description: 'Runs beside you, and never lets you fall behind.' },
  { id: 'owl', name: 'Barn owl', rarity: 'rare', bonusFor: 'healthy', bonus: 0.08, description: 'Keeps the night watch so you can sleep. Stares into the fog as if waiting for something.' },
  { id: 'panther', name: 'Shadow panther', rarity: 'epic', bonusFor: 'exercise', bonus: 0.12, description: 'Moves like smoke. Hits like a falling wall.' },
  { id: 'scorpion', name: 'Bone scorpion', rarity: 'epic', bonusFor: 'healthy', bonus: 0.12, description: 'Its sting is said to cure as often as it kills.' },
  { id: 'kraken', name: 'Void kraken', rarity: 'legendary', bonusFor: 'all', bonus: 0.2, description: 'A small piece of the endless deep, curled at your feet.' },
  { id: 'stag', name: 'Spectral stag', rarity: 'legendary', bonusFor: 'all', bonus: 0.2, description: 'Seen once a generation. Now it follows you, though it shies from firelight.' },
]

export function petById(petId: string | null): Pet | undefined {
  return PETS.find((pet) => pet.id === petId)
}

/** A short description of a pet's bonus, e.g. "+8% XP on exercise quests". */
export function bonusLabel(pet: Pet): string {
  const percent = Math.round(pet.bonus * 100)
  const which = pet.bonusFor === 'all' ? 'all quests' : pet.bonusFor === 'exercise' ? 'exercise quests' : 'healthy-living quests'
  return `+${percent}% XP on ${which}`
}

export interface Egg {
  id: string
  rarity: PetRarity
  foundDay: string
  /** One entry per quest that warmed it ("day:questId"), so undoing a quest takes the warmth back. */
  warmedBy: string[]
}

export interface PetState {
  eggs: Egg[]
  /** How many of each pet the hero has hatched. */
  owned: Record<string, number>
  /** The pet following the hero, whose bonus applies. */
  activePetId: string | null
  /** The last day the hero rolled for an egg, so each day gets only one roll. */
  lastEggRollDay: string | null
}

export function newPetState(): PetState {
  return { eggs: [], owned: {}, activePetId: null, lastEggRollDay: null }
}

/** XP multiplier from the active pet for a quest of this kind. */
export function petXpMultiplier(state: PetState, category: QuestCategory): number {
  const pet = petById(state.activePetId)
  return pet && (pet.bonusFor === 'all' || pet.bonusFor === category) ? 1 + pet.bonus : 1
}

/** Picks an egg rarity using RARITY_CHANCES, rarest first. */
export function rollEggRarity(random: () => number): PetRarity {
  const roll = random()
  let cumulative = 0
  for (const rarity of [...PET_RARITIES].reverse()) {
    cumulative += RARITY_CHANCES[rarity]
    if (roll < cumulative) {
      return rarity
    }
  }
  return 'common'
}

/** Normal rules, or the test-luck rules used on the development server to see eggs quickly. */
export interface EggRules {
  eggChance: number
  warmthNeeded: (rarity: PetRarity) => number
}

export const NORMAL_RULES: EggRules = { eggChance: EGG_CHANCE, warmthNeeded: (rarity) => WARMTH_NEEDED[rarity] }
export const TEST_LUCK_RULES: EggRules = { eggChance: 1, warmthNeeded: () => 1 }

export interface QuestToggle {
  day: string
  questId: string
  /** True when the quest was just completed, false when it was undone. */
  completed: boolean
  /** True when every quest for the day is now done. */
  allQuestsDone: boolean
}

export interface PetOutcome {
  state: PetState
  foundEgg: Egg | null
  hatched: Pet[]
}

/** Warms (or cools) eggs for a quest toggle, hatches any that are ready, and rolls for an egg on a perfect day. */
export function afterQuestToggle(state: PetState, toggle: QuestToggle, random: () => number, rules: EggRules = NORMAL_RULES): PetOutcome {
  const warmth = `${toggle.day}:${toggle.questId}`
  const warmedEggs = state.eggs.map((egg) => {
    if (toggle.completed) {
      return egg.warmedBy.includes(warmth) ? egg : { ...egg, warmedBy: [...egg.warmedBy, warmth] }
    }
    return { ...egg, warmedBy: egg.warmedBy.filter((key) => key !== warmth) }
  })

  const hatched: Pet[] = []
  const owned = { ...state.owned }
  let activePetId = state.activePetId
  const eggs = warmedEggs.filter((egg) => {
    if (egg.warmedBy.length < rules.warmthNeeded(egg.rarity)) {
      return true
    }
    const choices = PETS.filter((pet) => pet.rarity === egg.rarity)
    const pet = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))]
    hatched.push(pet)
    owned[pet.id] = (owned[pet.id] ?? 0) + 1
    // The first pet ever hatched starts following the hero right away.
    activePetId ??= pet.id
    return false
  })

  let foundEgg: Egg | null = null
  let lastEggRollDay = state.lastEggRollDay
  if (toggle.completed && toggle.allQuestsDone && lastEggRollDay !== toggle.day) {
    lastEggRollDay = toggle.day
    if (random() < rules.eggChance) {
      const rarity = rollEggRarity(random)
      foundEgg = { id: `${toggle.day}-${Math.floor(random() * 1e9).toString(36)}`, rarity, foundDay: toggle.day, warmedBy: [] }
      eggs.push(foundEgg)
    }
  }

  return { state: { eggs, owned, activePetId, lastEggRollDay }, foundEgg, hatched }
}

export function setActivePet(state: PetState, petId: string): PetState {
  return (state.owned[petId] ?? 0) > 0 ? { ...state, activePetId: petId } : state
}

/** Rebuilds pet state from saved data, dropping anything damaged. */
export function sanitizePets(value: unknown): PetState {
  if (typeof value !== 'object' || value === null) {
    return newPetState()
  }
  const saved = value as Record<string, unknown>
  const eggs = Array.isArray(saved.eggs)
    ? saved.eggs.filter(
        (egg): egg is Egg =>
          typeof egg === 'object' &&
          egg !== null &&
          typeof egg.id === 'string' &&
          PET_RARITIES.includes(egg.rarity) &&
          typeof egg.foundDay === 'string' &&
          Array.isArray(egg.warmedBy) &&
          egg.warmedBy.every((key: unknown) => typeof key === 'string'),
      )
    : []
  const owned: Record<string, number> = {}
  if (typeof saved.owned === 'object' && saved.owned !== null) {
    for (const [petId, count] of Object.entries(saved.owned)) {
      if (petById(petId) && Number.isInteger(count) && count > 0) {
        owned[petId] = count
      }
    }
  }
  const activePetId = typeof saved.activePetId === 'string' && owned[saved.activePetId] ? saved.activePetId : null
  const lastEggRollDay = typeof saved.lastEggRollDay === 'string' ? saved.lastEggRollDay : null
  return { eggs, owned, activePetId, lastEggRollDay }
}
