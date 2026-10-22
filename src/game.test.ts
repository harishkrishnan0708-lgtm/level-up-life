import { describe, expect, it } from 'vitest'
import { companionAt, levelProgress, newGame, rankName, startDay, toggleQuest } from './game'

describe('completing quests', () => {
  it('earns the quest XP and coins', () => {
    const state = toggleQuest(newGame('2026-10-06'), 'sleep', 'warrior')
    expect(state.totalXp).toBe(20)
    expect(state.coins).toBe(5)
    expect(state.completedQuestIds).toEqual(['sleep'])
  })

  it('gives bonus XP on quests the class favors', () => {
    expect(toggleQuest(newGame('2026-10-06'), 'lift', 'warrior').totalXp).toBe(45)
    expect(toggleQuest(newGame('2026-10-06'), 'lift', 'mage').totalXp).toBe(30)
  })

  it('takes the reward back when the quest is tapped again', () => {
    const state = toggleQuest(toggleQuest(newGame('2026-10-06'), 'lift', 'warrior'), 'lift', 'warrior')
    expect(state.totalXp).toBe(0)
    expect(state.coins).toBe(0)
    expect(state.completedQuestIds).toEqual([])
  })

  it('undo takes back what the quest earned even after a class change', () => {
    const asMage = toggleQuest(newGame('2026-10-06'), 'lift', 'mage')
    const undoneAsWarrior = toggleQuest(asMage, 'lift', 'warrior')
    expect(undoneAsWarrior.totalXp).toBe(0)
  })

  it('ignores unknown quests', () => {
    const state = newGame('2026-10-06')
    expect(toggleQuest(state, 'not-a-quest', 'warrior')).toBe(state)
  })

  it('levels up after a full day of quests', () => {
    let state = newGame('2026-10-06')
    for (const id of ['lift', 'sports', 'walk', 'sleep', 'water', 'food', 'screen']) {
      state = toggleQuest(state, id, 'ranger')
    }
    expect(levelProgress(state.totalXp).level).toBe(2)
  })
})

describe('levels', () => {
  it('starts at level 1 and needs more XP for each level', () => {
    expect(levelProgress(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100 })
    expect(levelProgress(99).level).toBe(1)
    expect(levelProgress(100)).toEqual({ level: 2, xpIntoLevel: 0, xpForNextLevel: 150 })
    expect(levelProgress(250).level).toBe(3)
  })

  it('raises the rank and grows the dragon companion at higher levels', () => {
    expect(rankName(1)).toBe('Wanderer')
    expect(rankName(5)).toBe('Knight')
    expect(rankName(40)).toBe('Dreadlord')
    expect(companionAt(1).name).toBe('Dragon egg')
    expect(companionAt(2).name).toBe('Dragon hatchling')
    expect(companionAt(10).name).toBe('Elder dragon')
  })
})

describe('daily reset', () => {
  it('clears quests on a new day but keeps XP and coins', () => {
    const yesterday = toggleQuest(newGame('2026-10-05'), 'lift', 'mage')
    const today = startDay(yesterday, '2026-10-06')
    expect(today.completedQuestIds).toEqual([])
    expect(today.totalXp).toBe(30)
    expect(today.coins).toBe(10)
  })
})
