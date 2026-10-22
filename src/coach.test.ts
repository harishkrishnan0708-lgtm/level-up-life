import { describe, expect, it } from 'vitest'
import { coachAdvice } from './coach'
import { PRACTICE_RIVAL } from './raids'
import { availableActions, chooseEventOption, eventChoices, startSiege, takeAction, tossCoin, type Random, type Siege } from './siege'

function seeded(seed: number): Random {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/** Plays the practice siege the way a new player would: doing whatever the sergeant suggests. */
function followTheSergeant(seed: number): { siege: Siege; badSuggestions: number; longestRepeat: number } {
  const random = seeded(seed)
  let siege = tossCoin(startSiege({ rival: PRACTICE_RIVAL, might: 1, accuracy: 0.6, engines: 0, practice: true }, random), 'heads', random)
  let badSuggestions = 0
  let longestRepeat = 0
  let repeat = 0
  let lastSuggestion: string | null = null
  for (let turn = 0; turn < 80 && !siege.outcome; turn++) {
    if (siege.event) {
      siege = chooseEventOption(siege, eventChoices(siege)[0].id, random)
      continue
    }
    const actions = availableActions(siege)
    const { suggestedActionId } = coachAdvice(siege)
    if (suggestedActionId && !actions.some((action) => action.id === suggestedActionId)) {
      badSuggestions++
    }
    // Bombarding the same target twice in a row is fine; anything else repeated over and over is the coach going in circles.
    repeat = suggestedActionId === lastSuggestion && !suggestedActionId?.startsWith('fire-') ? repeat + 1 : 1
    longestRepeat = Math.max(longestRepeat, repeat)
    lastSuggestion = suggestedActionId
    // With no suggestion (in the keep), a new player picks the safe-sounding terms.
    siege = takeAction(siege, suggestedActionId ?? 'terms', random)
  }
  return { siege, badSuggestions, longestRepeat }
}

describe('the practice siege coach', () => {
  it('only ever suggests orders the player can actually give', () => {
    for (let seed = 1; seed <= 200; seed++) {
      expect(followTheSergeant(seed * 31).badSuggestions).toBe(0)
    }
  })

  it('never gives the same advice over and over without progress', () => {
    for (let seed = 1; seed <= 200; seed++) {
      expect(followTheSergeant(seed * 53).longestRepeat).toBeLessThanOrEqual(3)
    }
  })

  it('leads a brand-new hero to victory almost every time', () => {
    const games = Array.from({ length: 200 }, (_, index) => followTheSergeant((index + 1) * 977).siege)
    const wins = games.filter((siege) => siege.outcome?.kind === 'victory').length
    expect(wins / games.length).toBeGreaterThan(0.85)
  })

  it('asks for the coin toss before anything else', () => {
    const untossed = startSiege({ rival: PRACTICE_RIVAL, might: 1, accuracy: 0.6, engines: 0, practice: true }, seeded(1))
    expect(coachAdvice(untossed).tip).toMatch(/coin toss/)
  })
})
