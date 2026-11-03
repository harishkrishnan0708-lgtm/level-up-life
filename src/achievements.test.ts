import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, awardAchievements, newlyEarned, sanitizeAchievements } from './achievements'
import { QUESTS, newGame, toggleQuest } from './game'
import { EMPTY_ROSTER, activeHero, addHero, newHeroDraft, type Hero } from './hero'
import { markBeaten, newWarRecord } from './raids'
import { chooseOption, markRead, newStoryState } from './story'
import { closeDays, newStreakState } from './streak'
import { addDays } from './wares'

const TODAY = '2026-10-26'

function newHero(): Hero {
  return activeHero(addHero(EMPTY_ROSTER, { ...newHeroDraft(), name: 'Tester' }, newGame(TODAY)))!
}

const ids = (hero: Hero) => newlyEarned(hero).map(({ id }) => id)

describe('achievements', () => {
  it('a new hero has earned nothing', () => {
    expect(newlyEarned(newHero())).toEqual([])
  })

  it('finishing a quest earns First Step and pays its coins, only once', () => {
    let hero = newHero()
    hero = { ...hero, game: toggleQuest(hero.game, 'water', 'warrior') }
    expect(ids(hero)).toEqual(['first-quest'])
    const coinsBefore = hero.game.coins
    hero = { ...hero, ...awardAchievements(hero, newlyEarned(hero), TODAY) }
    expect(hero.game.coins).toBe(coinsBefore + 10)
    expect(hero.achievements['first-quest']).toBe(TODAY)
    expect(newlyEarned(hero)).toEqual([])
    expect(awardAchievements(hero, ACHIEVEMENTS.filter(({ id }) => id === 'first-quest'), TODAY).game.coins).toBe(hero.game.coins)
  })

  it('pays out for things already done before achievements existed', () => {
    const hero = newHero()
    const veteran: Hero = {
      ...hero,
      game: { ...hero.game, totalXp: 2000 },
      war: { ...['old-fort', 'mordrake'].reduce(markBeaten, newWarRecord()), victories: 2 },
      story: markRead(chooseOption(newStoryState(), 'lantern-man', 'release'), 'lantern-man'),
    }
    expect(ids(veteran)).toEqual(expect.arrayContaining(['level-5', 'first-win', 'beat-mordrake', 'mercy']))
    expect(ids(veteran)).not.toContain('iron-law')
  })

  it('counts quests across days, so lifetime goals add up', () => {
    let streak = newStreakState()
    for (let back = 25; back >= 1; back--) {
      const day = addDays(TODAY, -back)
      const game = QUESTS.reduce((state, quest) => toggleQuest(state, quest.id, 'warrior'), newGame(day))
      streak = closeDays(streak, game, newHero().plan, addDays(day, 1), 0).streak
    }
    const hero = { ...newHero(), streak }
    expect(ids(hero)).toEqual(expect.arrayContaining(['lift-25', 'perfect-10', 'quests-100', 'streak-7']))
    expect(ids(hero)).not.toContain('water-50')
  })

  it('keeps earned achievements through a save, dropping unknown ones', () => {
    expect(sanitizeAchievements({ 'first-quest': TODAY, 'made-up': TODAY, 'streak-3': 5 })).toEqual({ 'first-quest': TODAY })
  })

  it('has a unique id and a reward for every achievement', () => {
    expect(new Set(ACHIEVEMENTS.map(({ id }) => id)).size).toBe(ACHIEVEMENTS.length)
    expect(ACHIEVEMENTS.every(({ coins }) => coins > 0)).toBe(true)
  })
})
