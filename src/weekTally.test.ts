import { describe, expect, it } from 'vitest'
import { QUESTS, newGame, toggleQuest, type GameState } from './game'
import { newQuestPlan, toggleQuestDay } from './questPlan'
import { closeDays, newStreakState, sanitizeStreak, type StreakState } from './streak'
import { addDays } from './wares'
import { weekStart, weekSummary } from './weekTally'

const PLAN = newQuestPlan()
// 2026-10-19 is a Monday.
const MONDAY = '2026-10-19'

function finish(day: string, questIds: string[]): GameState {
  return questIds.reduce((game, id) => toggleQuest(game, id, 'warrior'), newGame(day))
}

/** Plays the given quests each day from Monday, closing each day out as the app does at midnight. */
function playWeek(daysOfQuests: string[][], streak: StreakState = newStreakState()) {
  daysOfQuests.forEach((questIds, index) => {
    const day = addDays(MONDAY, index)
    streak = closeDays(streak, finish(day, questIds), PLAN, addDays(day, 1), 0).streak
  })
  return { streak, today: addDays(MONDAY, daysOfQuests.length) }
}

const ALL = QUESTS.map(({ id }) => id)

describe('the weekly summary', () => {
  it('starts each week on Monday', () => {
    expect(weekStart('2026-10-25')).toBe(MONDAY)
    expect(weekStart(MONDAY)).toBe(MONDAY)
    expect(weekStart('2026-10-26')).toBe('2026-10-26')
  })

  it('shows each quest by day: done, missed, and still to do today', () => {
    const { streak, today } = playWeek([ALL, ['lift', 'water']])
    const summary = weekSummary(streak, finish(today, ['water']), PLAN)
    const water = summary.rows.find(({ quest }) => quest.id === 'water')!
    const lift = summary.rows.find(({ quest }) => quest.id === 'lift')!
    expect(water.marks.slice(0, 4)).toEqual(['done', 'done', 'done', 'upcoming'])
    expect(lift.marks.slice(0, 3)).toEqual(['done', 'done', 'upcoming'])
    expect(summary.rows.find(({ quest }) => quest.id === 'sleep')!.marks[1]).toBe('missed')
    expect(summary.days.map(({ result }) => result).slice(0, 4)).toEqual(['kept', 'missed', 'today', 'upcoming'])
  })

  it('adds up the week, and ticking a quest today raises the totals', () => {
    const { streak, today } = playWeek([ALL, ['lift', 'water']])
    const before = weekSummary(streak, newGame(today), PLAN)
    const after = weekSummary(streak, finish(today, ['lift']), PLAN)
    expect(before).toMatchObject({ daysKept: 1, daysWithQuests: 2, questsDone: 9, questsPlanned: 21 })
    expect(after.questsDone).toBe(10)
    expect(after.xp - before.xp).toBe(45)
    expect(after.coins - before.coins).toBe(10)
    expect(after.bestQuest?.quest.id).toBe('lift')
  })

  it('leaves off days blank and doesn’t count a rest day against the streak', () => {
    const noLiftTuesday = toggleQuestDay(PLAN, 'lift', 2)
    let streak = newStreakState()
    for (const [index, questIds] of [ALL, ALL.filter((id) => id !== 'lift')].entries()) {
      const day = addDays(MONDAY, index)
      streak = closeDays(streak, finish(day, questIds), noLiftTuesday, addDays(day, 1), 0).streak
    }
    const summary = weekSummary(streak, newGame(addDays(MONDAY, 2)), noLiftTuesday)
    expect(summary.rows.find(({ quest }) => quest.id === 'lift')!.marks[1]).toBe('off')
    expect(summary.daysKept).toBe(2)
  })

  it('marks days played before quests were recorded as unknown, but still knows if they kept the streak', () => {
    const { streak, today } = playWeek([ALL, ALL])
    const olderSave = { ...streak, log: {} }
    const summary = weekSummary(olderSave, newGame(today), PLAN)
    expect(summary.rows[0].marks.slice(0, 2)).toEqual(['unknown', 'unknown'])
    expect(summary.days[0].result).toBe('kept')
    expect(summary.missingDetail).toBe(true)
  })

  it('treats days before the hero began as not part of the week', () => {
    const summary = weekSummary(newStreakState(), newGame('2026-10-22'), PLAN)
    expect(summary.days[0].result).toBe('before')
    expect(summary.rows[0].marks[0]).toBe('off')
    expect(summary.daysWithQuests).toBe(0)
  })

  it('keeps the quest log through a save and reload, and drops anything malformed', () => {
    const { streak } = playWeek([['lift']])
    const reloaded = sanitizeStreak(JSON.parse(JSON.stringify({ ...streak, log: { ...streak.log, 'not-a-day': streak.log[MONDAY], '2026-10-01': { done: 'lift' } } })))
    expect(reloaded.log).toEqual({ [MONDAY]: { planned: ALL, done: ['lift'], xp: 45, coins: 10 } })
  })
})
