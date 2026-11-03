import { describe, expect, it } from 'vitest'
import { newGame } from './game'
import { WAR_UNLOCK_LEVEL, newWarRecord, warUnlockProgress, warUnlocked } from './raids'

const TODAY = '2026-10-28'

describe('opening the War', () => {
  it('stays closed for a new hero until level 3, then opens', () => {
    const fresh = newGame(TODAY)
    expect(WAR_UNLOCK_LEVEL).toBe(3)
    expect(warUnlocked(fresh, newWarRecord())).toBe(false)
    expect(warUnlocked({ ...fresh, totalXp: 249 }, newWarRecord())).toBe(false)
    expect(warUnlocked({ ...fresh, totalXp: 250 }, newWarRecord())).toBe(true)
  })

  it('shows how much XP is left, never more than the goal', () => {
    expect(warUnlockProgress({ ...newGame(TODAY), totalXp: 110 })).toEqual({ earned: 110, needed: 250 })
    expect(warUnlockProgress({ ...newGame(TODAY), totalXp: 900 })).toEqual({ earned: 250, needed: 250 })
  })

  it('stays open for heroes who had already trained or fought before it was locked', () => {
    const fresh = newGame(TODAY)
    expect(warUnlocked(fresh, { ...newWarRecord(), trainingDone: true })).toBe(true)
    expect(warUnlocked(fresh, { ...newWarRecord(), beaten: ['old-fort'] })).toBe(true)
  })
})
