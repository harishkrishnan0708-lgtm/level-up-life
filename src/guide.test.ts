import { describe, expect, it } from 'vitest'
import { GUIDE_STEPS, guideDone, markGuideDone } from './guide'

describe('the first-time tour', () => {
  it('visits every tab and ends by planning the week', () => {
    expect(new Set(GUIDE_STEPS.map(({ tab }) => tab))).toEqual(new Set(['quests', 'shop', 'kingdom', 'war', 'pets', 'journal']))
    expect(GUIDE_STEPS.at(-1)).toMatchObject({ tab: 'quests', title: 'Plan your week' })
  })

  it('shows once per phone', () => {
    const data = new Map<string, string>()
    const store = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) }
    expect(guideDone(store)).toBe(false)
    markGuideDone(store)
    expect(guideDone(store)).toBe(true)
  })

  it('never mentions Wick by name, so it stays out of the mystery', () => {
    for (const { title, text } of GUIDE_STEPS) {
      expect(`${title} ${text}`).not.toMatch(/wick|moth/i)
    }
  })
})
