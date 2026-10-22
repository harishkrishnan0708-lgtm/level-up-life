import { describe, expect, it } from 'vitest'
import {
  PETS,
  RARITY_CHANCES,
  TEST_LUCK_RULES,
  WARMTH_NEEDED,
  afterQuestToggle,
  newPetState,
  petXpMultiplier,
  rollEggRarity,
  sanitizePets,
  setActivePet,
  type PetRarity,
  type PetState,
} from './pets'

const DAY = '2026-10-13'

/** A "random" source that returns the given numbers in order, then repeats the last one. */
function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]
}

function finishDay(state: PetState, day: string, random: () => number) {
  return afterQuestToggle(state, { day, questId: 'screen', completed: true, allQuestsDone: true }, random)
}

function stateWithEgg(rarity: PetRarity): PetState {
  return { ...newPetState(), eggs: [{ id: 'egg', rarity, foundDay: DAY, warmedBy: [] }] }
}

describe('finding eggs', () => {
  it('gives an egg on a perfect day when the roll is under the egg chance', () => {
    expect(finishDay(newPetState(), DAY, sequence(0.39, 0.9, 0.5)).foundEgg?.rarity).toBe('common')
    expect(finishDay(newPetState(), DAY, sequence(0.41)).foundEgg).toBeNull()
  })

  it('only rolls once per day, even if a quest is undone and redone', () => {
    const first = finishDay(newPetState(), DAY, sequence(0.9))
    expect(first.foundEgg).toBeNull()
    const second = finishDay(first.state, DAY, sequence(0))
    expect(second.foundEgg).toBeNull()
    expect(finishDay(first.state, '2026-10-14', sequence(0, 0.5, 0.5)).foundEgg).not.toBeNull()
  })

  it('does not roll until every quest is done', () => {
    const outcome = afterQuestToggle(newPetState(), { day: DAY, questId: 'lift', completed: true, allQuestsDone: false }, sequence(0))
    expect(outcome.foundEgg).toBeNull()
    expect(outcome.state.lastEggRollDay).toBeNull()
  })

  it('splits rarities 1% legendary, 9% epic, 20% rare, 30% uncommon, 40% common', () => {
    expect(rollEggRarity(() => 0.005)).toBe('legendary')
    expect(rollEggRarity(() => 0.05)).toBe('epic')
    expect(rollEggRarity(() => 0.2)).toBe('rare')
    expect(rollEggRarity(() => 0.5)).toBe('uncommon')
    expect(rollEggRarity(() => 0.95)).toBe('common')

    const rolls = 10_000
    const counts: Record<string, number> = {}
    for (let index = 0; index < rolls; index++) {
      const rarity = rollEggRarity(() => index / rolls)
      counts[rarity] = (counts[rarity] ?? 0) + 1
    }
    for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
      expect(counts[rarity] / rolls).toBeCloseTo(chance, 5)
    }
  })
})

describe('warming and hatching', () => {
  it('hatches an egg once enough different quests have warmed it', () => {
    let state = stateWithEgg('common')
    for (let index = 0; index < WARMTH_NEEDED.common - 1; index++) {
      state = afterQuestToggle(state, { day: `2026-10-${10 + index}`, questId: 'lift', completed: true, allQuestsDone: false }, sequence(0)).state
    }
    expect(state.eggs).toHaveLength(1)
    const outcome = afterQuestToggle(state, { day: DAY, questId: 'walk', completed: true, allQuestsDone: false }, sequence(0))
    expect(outcome.hatched.map((pet) => pet.rarity)).toEqual(['common'])
    expect(outcome.state.eggs).toHaveLength(0)
    expect(outcome.state.owned[outcome.hatched[0].id]).toBe(1)
  })

  it('takes warmth back when a quest is undone, so toggling cannot hatch an egg', () => {
    let state = stateWithEgg('common')
    for (let index = 0; index < 20; index++) {
      state = afterQuestToggle(state, { day: DAY, questId: 'lift', completed: true, allQuestsDone: false }, sequence(0)).state
      state = afterQuestToggle(state, { day: DAY, questId: 'lift', completed: false, allQuestsDone: false }, sequence(0)).state
    }
    expect(state.eggs[0].warmedBy).toEqual([])
  })

  it('makes the first pet ever hatched follow the hero', () => {
    const outcome = afterQuestToggle(stateWithEgg('rare'), { day: DAY, questId: 'lift', completed: true, allQuestsDone: false }, sequence(0), TEST_LUCK_RULES)
    expect(outcome.state.activePetId).toBe(outcome.hatched[0].id)
  })
})

describe('pet bonuses', () => {
  it('apply only to the quests the active pet favours', () => {
    const state = { ...newPetState(), owned: { wolf: 1 }, activePetId: 'wolf' }
    expect(petXpMultiplier(state, 'exercise')).toBeCloseTo(1.08)
    expect(petXpMultiplier(state, 'healthy')).toBe(1)
  })

  it('are biggest for legendary pets, on every quest', () => {
    const state = setActivePet({ ...newPetState(), owned: { kraken: 1 } }, 'kraken')
    expect(petXpMultiplier(state, 'exercise')).toBeCloseTo(1.2)
    expect(petXpMultiplier(state, 'healthy')).toBeCloseTo(1.2)
    const legendaryBonus = Math.min(...PETS.filter((pet) => pet.rarity === 'legendary').map((pet) => pet.bonus))
    expect(PETS.filter((pet) => pet.rarity !== 'legendary').every((pet) => pet.bonus < legendaryBonus)).toBe(true)
  })

  it('cannot come from a pet the hero has not hatched', () => {
    expect(setActivePet(newPetState(), 'kraken').activePetId).toBeNull()
  })
})

describe('saved pets', () => {
  it('drops damaged eggs, unknown pets, and an active pet the hero does not own', () => {
    const state = sanitizePets({
      eggs: [{ id: 'a', rarity: 'epic', foundDay: DAY, warmedBy: [] }, { id: 'b', rarity: 'mythic', foundDay: DAY, warmedBy: [] }],
      owned: { wolf: 2, unicorn: 1, owl: 0 },
      activePetId: 'owl',
    })
    expect(state.eggs.map((egg) => egg.id)).toEqual(['a'])
    expect(state.owned).toEqual({ wolf: 2 })
    expect(state.activePetId).toBeNull()
  })
})
