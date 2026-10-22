import { describe, expect, it } from 'vitest'
import { backupFileName, makeBackup, readBackup } from './backup'
import { newGame, toggleQuest } from './game'
import { EMPTY_ROSTER, addHero, newHeroDraft, setHeroProgress, type Roster } from './hero'
import { markBeaten } from './raids'
import { chooseOption, markRead } from './story'

const TODAY = '2026-10-22'
const SAVED_AT = new Date(2026, 9, 22, 9, 30)

function twoHeroes(): Roster {
  let roster = addHero(EMPTY_ROSTER, { ...newHeroDraft(), name: 'Harish' }, toggleQuest(newGame(TODAY), 'lift', 'warrior'))
  roster = addHero(roster, { ...newHeroDraft(), name: 'Second' }, newGame(TODAY))
  const [first] = roster.heroes
  const story = markRead(chooseOption(first.story, 'lantern-man', 'enlist'), 'lantern-man')
  return setHeroProgress(roster, first.id, { story, war: markBeaten(first.war, 'old-fort') })
}

describe('backups', () => {
  it('bring back every hero exactly as they were', () => {
    const roster = twoHeroes()
    const result = readBackup(makeBackup(roster, SAVED_AT), TODAY)
    expect(result).toMatchObject({ ok: true, savedAt: SAVED_AT.toISOString() })
    expect(result.ok && result.roster).toEqual(roster)
  })

  it('name the file after the day it was saved', () => {
    expect(backupFileName(SAVED_AT)).toBe('level-up-life-backup-2026-10-22.json')
  })

  it('refuse files that are not Level Up Life backups', () => {
    for (const text of ['not json at all', '{"app":"some-other-app","version":1,"roster":{}}', 'null', '[]']) {
      expect(readBackup(text, TODAY).ok, text).toBe(false)
    }
  })

  it('refuse a backup with no heroes, or one from a newer version', () => {
    expect(readBackup(makeBackup(EMPTY_ROSTER, SAVED_AT), TODAY).ok).toBe(false)
    const fromTheFuture = JSON.stringify({ ...JSON.parse(makeBackup(twoHeroes(), SAVED_AT)), version: 99 })
    expect(readBackup(fromTheFuture, TODAY)).toMatchObject({ ok: false, problem: expect.stringMatching(/newer version/) })
  })

  it('drop damaged heroes but keep the good ones', () => {
    const backup = JSON.parse(makeBackup(twoHeroes(), SAVED_AT))
    backup.roster.heroes.push({ id: 'broken', name: '' })
    const result = readBackup(JSON.stringify(backup), TODAY)
    expect(result.ok && result.roster.heroes.map((hero) => hero.name)).toEqual(['Harish', 'Second'])
  })
})
