import { describe, expect, it } from 'vitest'
import { newGame } from './game'
import { EMPTY_ROSTER, activeHero, addHero, loadRoster, newHeroDraft, saveRoster, setHeroProgress } from './hero'
import { markBeaten, newWarRecord } from './raids'
import { sanitizeWarRecord } from './siege'
import { CHAPTERS, chapterScript, chapterStatus, chooseOption, markRead, newStoryState, storyScores } from './story'

const TODAY = '2026-10-20'
const [firstChapter] = CHAPTERS

function memoryStore() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

describe('the Chronicle', () => {
  it('keeps chapter 1 locked until the Old Watch Fort falls', () => {
    const story = newStoryState()
    expect(chapterStatus(firstChapter, newWarRecord(), story)).toBe('locked')
    const war = markBeaten(newWarRecord(), 'old-fort')
    expect(chapterStatus(firstChapter, war, story)).toBe('new')
    expect(chapterStatus(firstChapter, war, markRead(story, firstChapter.id))).toBe('read')
  })

  it('remembers each rival only once, in the order they fell', () => {
    const war = markBeaten(markBeaten(markBeaten(newWarRecord(), 'old-fort'), 'mordrake'), 'old-fort')
    expect(war.beaten).toEqual(['old-fort', 'mordrake'])
  })

  it('stops before the choice, then continues with the chosen replies', () => {
    const before = chapterScript(firstChapter, undefined)
    expect(before.lines).toHaveLength(before.choiceAt!)
    const after = chapterScript(firstChapter, 'enlist')
    expect(after.lines.length).toBeGreaterThan(before.lines.length)
    expect(after.lines.at(-1)?.speaker).toBe('wick')
  })

  it('makes choices final and counts what they say about the hero', () => {
    const merciful = chooseOption(newStoryState(), firstChapter.id, 'enlist')
    expect(chooseOption(merciful, firstChapter.id, 'hang')).toBe(merciful)
    expect(storyScores(merciful)).toMatchObject({ mercy: 1, allies: ['brannoc'] })
    expect(storyScores(chooseOption(newStoryState(), firstChapter.id, 'hang')).mercy).toBe(-1)
    expect(chooseOption(newStoryState(), firstChapter.id, 'not-an-option')).toEqual(newStoryState())
  })

  it('survives closing and reopening the app', () => {
    const store = memoryStore()
    let roster = addHero(EMPTY_ROSTER, { ...newHeroDraft(), name: 'Harish' }, newGame(TODAY))
    const hero = activeHero(roster)!
    const story = markRead(chooseOption(hero.story, firstChapter.id, 'release'), firstChapter.id)
    roster = setHeroProgress(roster, hero.id, { story, war: markBeaten(hero.war, 'old-fort') })
    saveRoster(store, roster)
    const reopened = activeHero(loadRoster(store, TODAY))!
    expect(reopened.story).toEqual(story)
    expect(reopened.war.beaten).toEqual(['old-fort'])
  })

  it('drops damaged entries from the saved list of beaten rivals', () => {
    expect(sanitizeWarRecord({ beaten: ['old-fort', 7, 'old-fort'] }).beaten).toEqual(['old-fort'])
  })
})
