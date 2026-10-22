import { describe, expect, it } from 'vitest'
import { QUESTS, newGame, toggleQuest, type GameState } from './game'
import { EMPTY_ROSTER, activeHero, addHero, newHeroDraft, setHeroProgress, startRosterDay } from './hero'
import { newQuestPlan, toggleQuestDay, type QuestPlan } from './questPlan'
import { claimMilestone, closeDays, currentStreak, dayResult, milestoneReached, newStreakState, questsNeeded } from './streak'
import { addDays, buyItem } from './wares'

const PLAN = newQuestPlan()
// 2026-10-19 is a Monday.
const MONDAY = '2026-10-19'

function finish(day: string, count: number): GameState {
  return QUESTS.slice(0, count).reduce((game, quest) => toggleQuest(game, quest.id, 'warrior'), newGame(day))
}

/** Plays `count` quests a day for a run of days, closing each one out as the app would at midnight. */
function playDays(counts: number[], plan: QuestPlan = PLAN, candles = 0) {
  let streak = newStreakState()
  let left = candles
  counts.forEach((count, index) => {
    const day = addDays(MONDAY, index)
    const closed = closeDays(streak, finish(day, count), plan, addDays(day, 1), left)
    streak = closed.streak
    left = closed.candles
  })
  return { streak, candles: left, today: addDays(MONDAY, counts.length) }
}

describe('streaks', () => {
  it('count a day once most of its quests are done', () => {
    expect(questsNeeded(7)).toBe(5)
    expect(dayResult(finish(MONDAY, 5), PLAN)).toBe('kept')
    expect(dayResult(finish(MONDAY, 4), PLAN)).toBe('missed')
  })

  it('grow day by day, and count today as soon as it’s kept', () => {
    const { streak, today } = playDays([5, 7, 6])
    expect(currentStreak(streak, newGame(today), PLAN).days).toBe(3)
    expect(currentStreak(streak, finish(today, 5), PLAN)).toMatchObject({ days: 4, todayKept: true })
  })

  it('break on a missed day, and remember the best', () => {
    const { streak, today } = playDays([5, 5, 5, 2, 5])
    expect(currentStreak(streak, newGame(today), PLAN).days).toBe(1)
    expect(streak.best).toBe(3)
  })

  it('never break on a rest day', () => {
    // Nothing scheduled on Tuesdays.
    const restTuesdays = QUESTS.reduce((plan, quest) => toggleQuestDay(plan, quest.id, 2), newQuestPlan())
    const { streak, today } = playDays([5, 0, 5], restTuesdays)
    expect(currentStreak(streak, newGame(today), restTuesdays).days).toBe(2)
  })

  it('count days the app wasn’t opened as missed', () => {
    const streak = closeDays(newStreakState(), finish(MONDAY, 7), PLAN, addDays(MONDAY, 3), 0).streak
    expect(currentStreak(streak, newGame(addDays(MONDAY, 3)), PLAN).days).toBe(0)
  })

  it('burn a candle to save a missed day', () => {
    const { streak, candles, today } = playDays([5, 1, 5], PLAN, 1)
    expect(candles).toBe(0)
    expect(currentStreak(streak, newGame(today), PLAN)).toMatchObject({ days: 2, savedByCandle: false })
    const justSaved = playDays([5, 1], PLAN, 1)
    expect(currentStreak(justSaved.streak, newGame(justSaved.today), PLAN).savedByCandle).toBe(true)
  })

  it('pay each milestone once per streak', () => {
    const { streak, today } = playDays([5, 5])
    const before = currentStreak(streak, finish(today, 4), PLAN)
    const after = currentStreak(streak, finish(today, 5), PLAN)
    const milestone = milestoneReached(streak, before, after)
    expect(milestone).toMatchObject({ days: 3 })
    const paid = claimMilestone(streak, after.start!, 3)
    expect(milestoneReached(paid, before, after)).toBeNull()
  })

  it('close out the old day when the app opens on a new one, using a candle bought from Wick', () => {
    const bought = buyItem({ ...newGame(MONDAY), coins: 100 }, activeHero(addHero(EMPTY_ROSTER, { ...newHeroDraft(), name: 'H' }, newGame(MONDAY)))!.holdings, 'respite-candle', MONDAY)
    let roster = addHero(EMPTY_ROSTER, { ...newHeroDraft(), name: 'Harish' }, finish(MONDAY, 1))
    roster = setHeroProgress(roster, activeHero(roster)!.id, { holdings: bought.holdings })
    const hero = activeHero(startRosterDay(roster, addDays(MONDAY, 1)))!
    expect(hero.streak.history[MONDAY]).toBe('saved')
    expect(hero.holdings.candles).toBe(0)
  })
})
