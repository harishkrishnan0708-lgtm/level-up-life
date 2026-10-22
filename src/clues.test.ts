import { describe, expect, it } from 'vitest'
import { dailyRumour, marketChatter, spoilsClue, wickGreetings, wickThanks } from './clues'
import { PRACTICE_RIVAL, RIVALS } from './raids'
import { markRead, newStoryState } from './story'

const fresh = newStoryState()
const afterChapterOne = markRead(fresh, 'lantern-man')
/** Every clue unlocked, as if the hero were deep into the story. */
const deepIntoStory = Array.from({ length: 30 }, (_, index) => `chapter-${index}`).reduce(markRead, fresh)
const days = Array.from({ length: 60 }, (_, index) => `2026-11-${String((index % 30) + 1).padStart(2, '0')}-${index}`)

describe('story clues', () => {
  it('give one tavern rumour a day, and different ones on different days', () => {
    expect(dailyRumour('2026-10-20', fresh)).toBe(dailyRumour('2026-10-20', fresh))
    expect(new Set(days.map((day) => dailyRumour(day, fresh))).size).toBeGreaterThan(4)
  })

  it('save the sharper rumours for after the first chapter', () => {
    const mentionsStamp = (rumour: string) => rumour.includes('stamped with a little moth')
    expect(days.map((day) => dailyRumour(day, fresh)).some(mentionsStamp)).toBe(false)
    expect(days.map((day) => dailyRumour(day, afterChapterOne)).some(mentionsStamp)).toBe(true)
  })

  it('add market gossip and a greeting from Wick after chapter 1', () => {
    expect(marketChatter(afterChapterOne).length).toBeGreaterThan(marketChatter(fresh).length)
    expect(wickGreetings(fresh)).toHaveLength(0)
    expect(wickGreetings(afterChapterOne).length).toBeGreaterThan(0)
  })

  it('never tie the Moth to Wick or his lanterns in so many words, even late in the story', () => {
    const everyClue = [
      ...days.map((day) => dailyRumour(day, deepIntoStory)),
      ...marketChatter(deepIntoStory),
      ...wickGreetings(deepIntoStory),
      ...wickThanks(deepIntoStory),
    ]
    for (const clue of everyClue) {
      expect(clue).not.toMatch(/moth.*(wick|lantern)|(wick|lantern).*moth/i)
      expect(clue).not.toMatch(/sold .* rival|good for business|lantern (man|merchant)/i)
    }
  })

  it('point suspicion at the Ash Witch after chapter 1, as a red herring', () => {
    const gossip = [...days.map((day) => dailyRumour(day, afterChapterOne)), ...marketChatter(afterChapterOne)]
    expect(gossip.some((line) => /Ash Witch/.test(line) && /moth/i.test(line))).toBe(true)
  })

  it('leave the Moth’s mark in every rival’s spoils', () => {
    for (const rival of [...RIVALS, PRACTICE_RIVAL]) {
      expect(spoilsClue(rival.id), rival.id).toMatch(/moth/i)
    }
  })
})
