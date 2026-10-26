import { describe, expect, it } from 'vitest'
import { meets, newCastState, type CastState } from './cast'
import { newGame } from './game'
import { EMPTY_ROSTER, activeHero, addHero, loadRoster, newHeroDraft, saveRoster, setHeroProgress } from './hero'
import { markBeaten, newWarRecord } from './raids'
import { sanitizeWarRecord } from './siege'
import { CHAPTERS, castState, chapterScript, chapterStatus, chooseOption, markRead, newStoryState, stagingAt, storyScores, unlockHint } from './story'

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

  it('stages chapter 1 in the fort’s courtyard, its cellar, and the market on the road home', () => {
    const { lines } = chapterScript(firstChapter, 'enlist')
    const scenes = lines.map((_line, index) => stagingAt(lines, index).scene)
    expect(scenes[0]).toBe('fort-yard')
    expect(scenes).toContain('fort-cellar')
    expect(scenes.at(-1)).toBe('market')
    // Everyone who speaks is on stage when they do, apart from the narrator and Wick behind his stall.
    lines.forEach((line, index) => {
      if (line.speaker !== 'narrator' && line.speaker !== 'wick') {
        expect(stagingAt(lines, index).cast, `line ${index}`).toContain(line.speaker)
      }
    })
  })

  it('keeps Brannoc bound until he is taken into the army, and poses each speaker for their line', () => {
    const { lines } = chapterScript(firstChapter, 'enlist')
    const entrance = lines.findIndex((line) => line.cast?.includes('brannoc'))
    const freed = lines.findIndex((line) => line.poses?.brannoc === 'stand')
    expect(stagingAt(lines, entrance).poses.brannoc).toBe('bound')
    expect(stagingAt(lines, freed - 1).poses.brannoc).toBe('bound')
    expect(stagingAt(lines, freed + 1).poses.brannoc).toBe('stand')
    expect(stagingAt(lines, 1).poses).toMatchObject({ holt: 'point', hero: 'hand-on-hilt' })
    expect(stagingAt(lines, 2).poses.holt).toBe('arms-crossed')
  })

  it('drops damaged entries from the saved list of beaten rivals', () => {
    expect(sanitizeWarRecord({ beaten: ['old-fort', 7, 'old-fort'] }).beaten).toEqual(['old-fort'])
  })
})

describe('every written chapter', () => {
  const written = CHAPTERS.filter((chapter) => chapter.opening.length > 0)

  it('puts every speaker on stage when they speak, on every path through the chapter', () => {
    for (const chapter of written) {
      for (const option of chapter.choice?.options ?? [undefined]) {
        for (const ally of ['ally', 'free', 'dead'] as const) {
          // Try each path with the characters who might join the hero all standing the same way.
          const fresh = newCastState()
          const cast = { ...fresh, brannoc: { ...fresh.brannoc, standing: ally }, morwen: { ...fresh.morwen, standing: ally } }
          const { lines } = chapterScript(chapter, option?.id, cast)
          lines.forEach((line, index) => {
            if (line.speaker !== 'narrator' && line.speaker !== 'wick') {
              expect(stagingAt(lines, index).cast, `${chapter.id}/${option?.id}/${ally} line ${index}`).toContain(line.speaker)
            }
            // The stage has marked spots for up to four.
            expect(stagingAt(lines, index).cast.length).toBeLessThanOrEqual(4)
          })
        }
      }
    }
  })

  it('gives every choice an outcome for the Journal, and every chapter a summary', () => {
    for (const chapter of written) {
      expect(chapter.summary, chapter.id).toBeTruthy()
      for (const option of chapter.choice?.options ?? []) {
        expect(option.outcome, `${chapter.id}/${option.id}`).toBeTruthy()
      }
    }
  })
})

describe('chapter 2, the Grey Keep', () => {
  const greyKeep = CHAPTERS.find(({ id }) => id === 'grey-keep')!
  const beatBoth = markBeaten(markBeaten(newWarRecord(), 'old-fort'), 'mordrake')

  it('waits for chapter 1 and the interlude after it, even after Mordrake falls', () => {
    const interlude = CHAPTERS.find(({ id }) => id === 'around-the-fire')!
    const readOne = markRead(newStoryState(), 'lantern-man')
    expect(unlockHint(greyKeep, beatBoth, newStoryState())).toBe('Read “Around the Fire”')
    // The interlude opens from the hero's habits: a three-day streak.
    expect(chapterStatus(interlude, beatBoth, readOne, 2)).toBe('locked')
    expect(unlockHint(interlude, beatBoth, readOne, 2)).toBe('Reach a 3-day streak')
    expect(chapterStatus(interlude, beatBoth, readOne, 3)).toBe('new')
    expect(chapterStatus(greyKeep, beatBoth, readOne, 3)).toBe('locked')
    expect(chapterStatus(greyKeep, beatBoth, markRead(readOne, 'around-the-fire'), 3)).toBe('new')
  })

  it('lets Brannoc speak up only if he rides with the hero', () => {
    const brannocSpeaks = (choice: string) => {
      const story = markRead(chooseOption(newStoryState(), 'lantern-man', choice), 'lantern-man')
      return chapterScript(greyKeep, 'vassal', castState(story, 'grey-keep')).lines.some((line) => line.speaker === 'brannoc')
    }
    expect(brannocSpeaks('enlist')).toBe(true)
    expect(brannocSpeaks('release')).toBe(false)
    expect(brannocSpeaks('hang')).toBe(false)
  })

  it('remembers what became of Mordrake', () => {
    const afterChoice = (choice: string) => {
      const story = markRead(chooseOption(markRead(chooseOption(newStoryState(), 'lantern-man', 'enlist'), 'lantern-man'), 'grey-keep', choice), 'grey-keep')
      return castState(story).mordrake.standing
    }
    expect([afterChoice('vassal'), afterChoice('exile'), afterChoice('execute')]).toEqual(['ally', 'free', 'dead'])
  })
})

describe('chapter 3, Cinder Fen', () => {
  const throughChapterTwo = markRead(
    chooseOption(markRead(chooseOption(newStoryState(), 'lantern-man', 'enlist'), 'lantern-man'), 'grey-keep', 'vassal'),
    'grey-keep',
  )
  const afterFen = (choice: string) => castState(markRead(chooseOption(throughChapterTwo, 'cinder-fen', choice), 'cinder-fen'))

  it('begins a romance with Morwen only if the hero trusts her', () => {
    expect(afterFen('trust').morwen).toMatchObject({ standing: 'ally', romance: 1 })
    expect(afterFen('peace').morwen.romance).toBe(0)
    expect(afterFen('drive-out').morwen.romance).toBe(0)
  })

  it('clears the Ash Witch of suspicion, whatever the hero decides', () => {
    const fen = CHAPTERS.find(({ id }) => id === 'cinder-fen')!
    expect(fen.summary).toMatch(/never raising an army/)
    expect(afterFen('drive-out').morwen.known).toContain('morwen-oil')
  })
})

describe('chapter 4, the Red Steppe', () => {
  const steppe = CHAPTERS.find(({ id }) => id === 'red-steppe')!
  const throughChapterThree = (['lantern-man', 'grey-keep', 'cinder-fen'] as const).reduce(
    (story, chapter, index) => markRead(chooseOption(story, chapter, ['enlist', 'vassal', 'trust'][index]), chapter),
    newStoryState(),
  )

  it('lets Morwen name what the Moth is doing, if she hunts with the hero', () => {
    const lines = chapterScript(steppe, 'duel', castState(throughChapterThree, 'red-steppe')).lines
    expect(lines.some((line) => line.speaker === 'morwen' && line.text.includes('farming them'))).toBe(true)
  })

  it('remembers what became of Gorrak and his horde', () => {
    const after = (choice: string) => castState(markRead(chooseOption(throughChapterThree, 'red-steppe', choice), 'red-steppe')).gorrak.standing
    expect([after('duel'), after('hire'), after('disband')]).toEqual(['ally', 'ally', 'free'])
  })

  it('ends Act I with every rival armed by the Moth', () => {
    expect(steppe.summary).toMatch(/armed every side/)
  })
})

describe('interludes', () => {
  const nightWatch = CHAPTERS.find(({ id }) => id === 'night-watch')!
  const withMorwen: CastState = { ...newCastState(), morwen: { ...newCastState().morwen, standing: 'ally', romance: 1 } }

  it('offer staying up with Morwen only if she hunts the Moth with the hero', () => {
    const offered = (cast: CastState) => nightWatch.choice!.options.filter((option) => !option.when || meets(option.when, cast)).map(({ id }) => id)
    expect(offered(withMorwen)).toContain('stay')
    expect(offered(newCastState())).not.toContain('stay')
  })

  it('carry the romance a step further if the hero stays with her', () => {
    let story = newStoryState()
    for (const [chapter, choice] of [
      ['lantern-man', 'enlist'],
      ['around-the-fire', 'bird'],
      ['grey-keep', 'vassal'],
      ['cinder-fen', 'trust'],
      ['night-watch', 'stay'],
    ]) {
      story = markRead(chooseOption(story, chapter, choice), chapter)
    }
    expect(castState(story).morwen.romance).toBe(2)
    expect(castState(story).holt.known).toContain('holt-bird-son')
  })
})

it('lets someone who joins the hero during a chapter speak at its close', () => {
  const steppe = CHAPTERS.find(({ id }) => id === 'red-steppe')!
  const speaks = (choice: string) => chapterScript(steppe, choice).lines.some((line) => line.speaker === 'gorrak' && line.text.includes('slept so well'))
  expect(speaks('duel')).toBe(true)
  expect(speaks('disband')).toBe(false)
})
