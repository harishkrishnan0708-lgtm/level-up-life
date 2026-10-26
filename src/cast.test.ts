import { describe, expect, it } from 'vitest'
import { CHARACTER_FACTS, characterLook, develop, meets, newCastState } from './cast'
import { castState, chapterScript, chooseOption, markRead, newStoryState, type Chapter } from './story'

function afterChapterOne(choice: string) {
  return markRead(chooseOption(newStoryState(), 'lantern-man', choice), 'lantern-man')
}

describe('the cast', () => {
  it('starts with nobody met', () => {
    expect(castState(newStoryState())).toEqual(newCastState())
  })

  it('remembers how chapter 1 left everyone, by the choice made', () => {
    const enlisted = castState(afterChapterOne('enlist'))
    expect(enlisted.brannoc).toMatchObject({ standing: 'ally', bond: 2 })
    expect(enlisted.holt).toMatchObject({ standing: 'ally', bond: -1 })
    expect(enlisted.wick.standing).toBe('ally')

    const hanged = castState(afterChapterOne('hang'))
    expect(hanged.brannoc.standing).toBe('dead')
    expect(hanged.holt.bond).toBe(1)

    expect(castState(afterChapterOne('release')).brannoc).toMatchObject({ standing: 'free', bond: 1 })
  })

  it('stages a chapter with the cast as it was before that chapter, so re-reading looks the same', () => {
    expect(castState(afterChapterOne('enlist'), 'lantern-man')).toEqual(newCastState())
  })

  it('learns facts about characters that the Journal can show', () => {
    const { brannoc, holt } = castState(afterChapterOne('enlist'))
    expect(brannoc.known).toEqual(expect.arrayContaining(['brannoc-coin', 'brannoc-moth', 'brannoc-debt']))
    expect(holt.known).toEqual(expect.arrayContaining(['holt-counts', 'holt-carving']))
    for (const fact of [...brannoc.known, ...holt.known]) {
      expect(CHARACTER_FACTS[fact], fact).toBeDefined()
    }
  })

  it('keeps bonds between -3 and 3', () => {
    let cast = newCastState()
    for (let step = 0; step < 6; step++) {
      cast = develop(cast, { who: 'holt', bond: 1 })
    }
    expect(cast.holt.bond).toBe(3)
  })

  it('dresses Brannoc in the hero’s colours once he joins them', () => {
    const { brannoc } = castState(afterChapterOne('enlist'))
    expect(characterLook('brannoc', brannoc).appearance).toMatchObject({ outfitColor: 'crimson', heldItem: 'sword' })
    expect(characterLook('brannoc', castState(afterChapterOne('release')).brannoc).appearance.outfitColor).toBe('onyx')
  })

  it('plays a line only for the path it was written for', () => {
    const chapter: Chapter = {
      id: 'test',
      act: 2,
      number: 9,
      title: 'Test',
      unlockedBy: 'mordrake',
      opening: [
        { speaker: 'narrator', text: 'Everyone sees this.' },
        { speaker: 'brannoc', text: 'Only if Brannoc rides with you.', when: { who: 'brannoc', standing: ['ally'] } },
        { speaker: 'holt', text: 'Only if Holt trusts you.', when: { who: 'holt', bondAtLeast: 1 } },
      ],
      closing: [],
    }
    const texts = (story: ReturnType<typeof afterChapterOne>) => chapterScript(chapter, undefined, castState(story)).lines.map(({ text }) => text)
    expect(texts(afterChapterOne('enlist'))).toEqual(['Everyone sees this.', 'Only if Brannoc rides with you.'])
    expect(texts(afterChapterOne('hang'))).toEqual(['Everyone sees this.', 'Only if Holt trusts you.'])
    expect(meets({ who: 'wick', stageAtLeast: 1 }, castState(afterChapterOne('release')))).toBe(true)
  })
})
