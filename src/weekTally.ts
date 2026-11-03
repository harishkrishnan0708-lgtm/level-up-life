import type { GameState, Quest } from './game'
import { WEEK, allQuests, questDays, weekdayOf, type QuestPlan } from './questPlan'
import { dayLog, dayResult, type DayLog, type DayResult, type StreakState } from './streak'
import { addDays } from './wares'

/**
 * How one quest went on one day: done, missed, not scheduled, still to come, or unknown
 * (a day played before the game kept track of each quest).
 */
export type QuestMark = 'done' | 'missed' | 'off' | 'upcoming' | 'unknown'

export interface SummaryDay {
  day: string
  letter: string
  name: string
  /** How the day went for the streak, or where it sits in the week; 'before' is a day before the hero began. */
  result: DayResult | 'today' | 'upcoming' | 'before'
}

export interface SummaryRow {
  quest: Quest
  marks: QuestMark[]
  done: number
  /** Days it was scheduled, up to and including today, that we know about. */
  planned: number
}

export interface WeekSummary {
  days: SummaryDay[]
  rows: SummaryRow[]
  /** Days kept out of the days so far that had quests; today joins both once it's kept, since it isn't over yet. */
  daysKept: number
  daysWithQuests: number
  questsDone: number
  questsPlanned: number
  xp: number
  coins: number
  /** The quest done most reliably this week, if any were done. */
  bestQuest: SummaryRow | null
  /** Whether some past days this week were played before quests were logged. */
  missingDetail: boolean
}

const NOTHING_PLANNED: DayLog = { planned: [], done: [], xp: 0, coins: 0 }

/** The Monday that starts the week a day falls in. */
export function weekStart(day: string): string {
  return addDays(day, -((weekdayOf(day) + 6) % 7))
}

/** This week so far, Monday to Sunday: each quest by day, and what the week has earned. */
export function weekSummary(streak: StreakState, today: GameState, plan: QuestPlan): WeekSummary {
  const monday = weekStart(today.day)
  const quests = allQuests(plan)
  const days: SummaryDay[] = []
  // What's known of each day: its log for days already played or today, and nothing for days to come.
  const logs: (DayLog | null)[] = []
  for (let index = 0; index < 7; index++) {
    const day = addDays(monday, index)
    const { letter, name } = WEEK[index]
    if (day === today.day) {
      days.push({ day, letter, name, result: 'today' })
      logs.push(dayLog(today, plan))
    } else if (day > today.day) {
      days.push({ day, letter, name, result: 'upcoming' })
      logs.push(null)
    } else {
      // Every day since the hero began is in the streak history, so a day missing from it came before them.
      const result = day in streak.history ? streak.history[day] : 'before'
      days.push({ day, letter, name, result })
      logs.push(streak.log[day] ?? (result === 'rest' || result === 'before' ? NOTHING_PLANNED : null))
    }
  }

  const rows = quests
    .map((quest): SummaryRow => {
      const marks = days.map(({ day, result }, index): QuestMark => {
        const log = logs[index]
        if (log) {
          return log.done.includes(quest.id) ? 'done' : log.planned.includes(quest.id) ? (result === 'today' ? 'upcoming' : 'missed') : 'off'
        }
        const scheduled = questDays(plan, quest.id).includes(weekdayOf(day))
        return !scheduled ? 'off' : result === 'upcoming' ? 'upcoming' : 'unknown'
      })
      const done = marks.filter((mark) => mark === 'done').length
      const planned = marks.filter((mark, index) => mark === 'done' || mark === 'missed' || (mark === 'upcoming' && days[index].result === 'today')).length
      return { quest, marks, done, planned }
    })
    .filter(({ marks }) => marks.some((mark) => mark !== 'off'))

  const pastDays = days.filter(({ result }) => result !== 'upcoming' && result !== 'today' && result !== 'before')
  const todayCounts = dayResult(today, plan) === 'kept'
  const known = logs.filter((log): log is DayLog => log !== null)
  const ranked = rows.filter(({ done }) => done > 0).sort((a, b) => b.done / b.planned - a.done / a.planned || b.done - a.done)

  return {
    days,
    rows,
    daysKept: pastDays.filter(({ result }) => result === 'kept' || result === 'saved').length + (todayCounts ? 1 : 0),
    daysWithQuests: pastDays.filter(({ result }) => result !== 'rest').length + (todayCounts ? 1 : 0),
    questsDone: rows.reduce((total, { done }) => total + done, 0),
    questsPlanned: rows.reduce((total, { planned }) => total + planned, 0),
    xp: known.reduce((total, log) => total + log.xp, 0),
    coins: known.reduce((total, log) => total + log.coins, 0),
    bestQuest: ranked[0] ?? null,
    missingDetail: rows.some(({ marks }) => marks.includes('unknown')),
  }
}
