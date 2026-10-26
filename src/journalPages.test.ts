import { describe, expect, it } from 'vitest'
import { mothClues, peopleMet, storySoFar } from './journalPages'
import { markBeaten, newWarRecord } from './raids'
import { CHAPTERS, chooseOption, markRead, newStoryState } from './story'

const afterChapterOne = (choice: string) => markRead(chooseOption(newStoryState(), 'lantern-man', choice), 'lantern-man')

describe('the journal', () => {
  it('starts empty', () => {
    expect(storySoFar(newStoryState())).toEqual([])
    expect(peopleMet(newStoryState())).toEqual([])
    expect(mothClues(newStoryState(), newWarRecord())).toEqual([])
  })

  it('tells each chapter read, ending with the hero’s own choice', () => {
    const [entry] = storySoFar(afterChapterOne('release'))
    expect(entry).toMatchObject({ title: 'The Moth', outcome: 'You sent Brannoc and his men into the wilds, unarmed.' })
    expect(entry.summary).toContain('Old Watch Fort')
  })

  it('lists the people met, where they stand, and what the hero knows about them', () => {
    const people = peopleMet(afterChapterOne('enlist'))
    expect(people.map(({ who }) => who)).toEqual(['holt', 'brannoc', 'wick'])
    const brannoc = people.find(({ who }) => who === 'brannoc')!
    expect(brannoc).toMatchObject({ standing: 'Rides in your army', feeling: 'Trusts you' })
    expect(brannoc.facts.some((fact) => fact.includes('coin'))).toBe(true)
    expect(people.find(({ who }) => who === 'holt')!.feeling).toBe('Wary of you')
  })

  it('remembers the dead without guessing at their feelings', () => {
    const brannoc = peopleMet(afterChapterOne('hang')).find(({ who }) => who === 'brannoc')!
    expect(brannoc).toMatchObject({ standing: 'Hanged at the Old Watch Fort', feeling: null })
  })

  it('collects clues about the Moth from the story and from the spoils of every win', () => {
    const clues = mothClues(afterChapterOne('enlist'), markBeaten(markBeaten(newWarRecord(), 'old-fort'), 'mordrake'))
    expect(clues.some((clue) => clue.includes('paper burning'))).toBe(true)
    expect(clues.some((clue) => clue.includes('ledger'))).toBe(true)
  })

  it('admits a romance once it has begun', () => {
    let story = afterChapterOne('enlist')
    for (const [chapter, choice] of [['grey-keep', 'vassal'], ['cinder-fen', 'trust']]) {
      story = markRead(chooseOption(story, chapter, choice), chapter)
    }
    const morwen = peopleMet(story).find(({ who }) => who === 'morwen')!
    expect(morwen.feeling).toMatch(/something unspoken between you/)
  })

  it('never ties the Moth to Wick, in any chapter', () => {
    let story = newStoryState()
    for (const chapter of CHAPTERS) {
      story = markRead(story, chapter.id)
    }
    const clues = mothClues(story, ['old-fort', 'mordrake', 'witch', 'gorrak'].reduce(markBeaten, newWarRecord()))
    for (const clue of clues) {
      expect(clue).not.toMatch(/wick|lantern merchant|market/i)
    }
  })
})
