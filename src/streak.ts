import type { GameState } from './game'
import { allQuests, isPerfectDay, questsOn, type QuestPlan } from './questPlan'
import { addDays } from './wares'

/** How each past day went. A saved day is one a Candle of Respite rescued. */
export type DayResult = 'kept' | 'missed' | 'rest' | 'saved'

/** What happened on a day the hero played, kept for the weekly summary. */
export interface DayLog {
  /** The quests scheduled that day, by id. */
  planned: string[]
  done: string[]
  xp: number
  coins: number
}

export interface StreakState {
  /** Results of past days, by date. Only recent days are kept. */
  history: Record<string, DayResult>
  /** Which quests were done on recent days played. Older saves start without it. */
  log: Record<string, DayLog>
  /** Lifetime counts for achievements, up to the last day closed: each quest done, and days with every quest done. */
  totals: { quests: Record<string, number>; perfectDays: number }
  best: number
  /** Milestones already paid out, as "first day of the streak:length", so redoing a quest can't pay twice. */
  claimed: string[]
}

export function newStreakState(): StreakState {
  return { history: {}, log: {}, totals: { quests: {}, perfectDays: 0 }, best: 0, claimed: [] }
}

/** Share of a day's quests that keeps the streak alive: most of them, so one busy evening doesn't end it. */
const SHARE_NEEDED = 0.7
/** How far back the streak can reach; longer streaks keep counting from `best`. */
const HISTORY_DAYS = 400
/** How far back each day's quests are kept: this week and the few before it. */
const LOG_DAYS = 28

export const MILESTONES = [
  { days: 3, coins: 15 },
  { days: 7, coins: 40 },
  { days: 14, coins: 80 },
  { days: 30, coins: 200 },
  { days: 60, coins: 400 },
] as const

export function questsNeeded(questCount: number): number {
  return Math.ceil(questCount * SHARE_NEEDED)
}

/** Whether a day kept the streak, broke it, or was a rest day with nothing scheduled. */
export function dayResult(game: GameState, plan: QuestPlan): 'kept' | 'missed' | 'rest' {
  const quests = questsOn(plan, game.day)
  if (quests.length === 0) {
    return 'rest'
  }
  const done = quests.filter((quest) => game.completedQuestIds.includes(quest.id)).length
  return done >= questsNeeded(quests.length) ? 'kept' : 'missed'
}

export interface StreakNow {
  /** Days in the current streak, counting today once it's kept. */
  days: number
  todayKept: boolean
  /** The first day of the current streak, or null if there isn't one. */
  start: string | null
  /** Whether a candle burned to save the streak on the last day that had quests. */
  savedByCandle: boolean
}

/** The streak as of today: today if it's kept, then back through kept, rested, and candle-saved days. */
export function currentStreak(streak: StreakState, today: GameState, plan: QuestPlan): StreakNow {
  const todayKept = dayResult(today, plan) === 'kept'
  let days = todayKept ? 1 : 0
  let start: string | null = todayKept ? today.day : null
  let lastResult: DayResult | null = null
  for (let back = 1; back <= HISTORY_DAYS; back++) {
    const day = addDays(today.day, -back)
    const result = streak.history[day]
    if (result !== 'rest') {
      lastResult ??= result ?? 'missed'
    }
    if (result === 'kept') {
      days++
      start = day
    } else if (result !== 'saved' && result !== 'rest') {
      break
    }
  }
  const savedByCandle = lastResult === 'saved'
  return { days, todayKept, start, savedByCandle }
}

/** A day's quests as they stand: what was scheduled, what got done, and what it earned. */
export function dayLog(game: GameState, plan: QuestPlan): DayLog {
  const planned = questsOn(plan, game.day).map(({ id }) => id)
  const quests = allQuests(plan)
  const done = game.completedQuestIds.filter((id) => quests.some((quest) => quest.id === id))
  const xp = done.reduce((total, id) => total + (game.earnedXp?.[id] ?? 0), 0)
  const coins = done.reduce((total, id) => total + (quests.find((quest) => quest.id === id)?.coins ?? 0) + (game.earnedBonusCoins?.[id] ?? 0), 0)
  return { planned, done, xp, coins }
}

/**
 * Closes out the days since the hero last played: the last day played is judged by its quests, and any day skipped
 * entirely counts as missed if it had quests. Candles burn, one per missed day, to save the streak.
 */
export function closeDays(streak: StreakState, lastGame: GameState, plan: QuestPlan, today: string, candles: number) {
  const history = { ...streak.history }
  const log = { ...streak.log }
  const totals = { quests: { ...streak.totals.quests }, perfectDays: streak.totals.perfectDays }
  let left = candles
  const record = (day: string, result: 'kept' | 'missed' | 'rest') => {
    if (result === 'missed' && left > 0) {
      left--
      history[day] = 'saved'
    } else {
      history[day] = result
    }
  }
  if (lastGame.day < today && !history[lastGame.day]) {
    record(lastGame.day, dayResult(lastGame, plan))
    log[lastGame.day] = dayLog(lastGame, plan)
    for (const id of log[lastGame.day].done) {
      totals.quests[id] = (totals.quests[id] ?? 0) + 1
    }
    totals.perfectDays += isPerfectDay(lastGame, plan) ? 1 : 0
  }
  for (let day = addDays(lastGame.day, 1); day < today; day = addDays(day, 1)) {
    if (!history[day]) {
      record(day, questsOn(plan, day).length === 0 ? 'rest' : 'missed')
    }
  }
  const oldest = addDays(today, -HISTORY_DAYS)
  for (const day of Object.keys(history)) {
    if (day < oldest) {
      delete history[day]
    }
  }
  const oldestLogged = addDays(today, -LOG_DAYS)
  for (const day of Object.keys(log)) {
    if (day < oldestLogged) {
      delete log[day]
    }
  }
  const yesterday = currentStreak({ ...streak, history }, { ...lastGame, day: today, completedQuestIds: [] }, plan)
  return { streak: { ...streak, history, log, totals, best: Math.max(streak.best, yesterday.days) }, candles: left }
}

/** The longest streak the hero has ever had, counting the one they're on today. Interludes open from it. */
export function bestStreakSoFar(streak: StreakState, today: GameState, plan: QuestPlan): number {
  return Math.max(streak.best, currentStreak(streak, today, plan).days)
}

/** A milestone just reached and not yet paid out for this streak, if any. */
export function milestoneReached(streak: StreakState, before: StreakNow, after: StreakNow) {
  if (after.days <= before.days || !after.start) {
    return null
  }
  const milestone = MILESTONES.find(({ days }) => days === after.days)
  return milestone && !streak.claimed.includes(`${after.start}:${milestone.days}`) ? milestone : null
}

export function claimMilestone(streak: StreakState, start: string, days: number): StreakState {
  return { ...streak, claimed: [...streak.claimed, `${start}:${days}`].slice(-20), best: Math.max(streak.best, days) }
}

const RESULTS: readonly DayResult[] = ['kept', 'missed', 'rest', 'saved']

export function sanitizeStreak(value: unknown): StreakState {
  if (typeof value !== 'object' || value === null) {
    return newStreakState()
  }
  const saved = value as Record<string, unknown>
  const history: Record<string, DayResult> = {}
  if (typeof saved.history === 'object' && saved.history !== null) {
    for (const [day, result] of Object.entries(saved.history)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && RESULTS.includes(result as DayResult)) {
        history[day] = result as DayResult
      }
    }
  }
  const log: Record<string, DayLog> = {}
  if (typeof saved.log === 'object' && saved.log !== null) {
    for (const [day, entry] of Object.entries(saved.log)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && isDayLog(entry)) {
        log[day] = { planned: entry.planned, done: entry.done, xp: entry.xp, coins: entry.coins }
      }
    }
  }
  const counts = (value: unknown) => Number.isInteger(value) && (value as number) >= 0
  const savedTotals = (typeof saved.totals === 'object' && saved.totals !== null ? saved.totals : {}) as Record<string, unknown>
  const quests: Record<string, number> = {}
  if (typeof savedTotals.quests === 'object' && savedTotals.quests !== null) {
    for (const [id, count] of Object.entries(savedTotals.quests)) {
      if (counts(count)) {
        quests[id] = count as number
      }
    }
  }
  const totals = { quests, perfectDays: counts(savedTotals.perfectDays) ? (savedTotals.perfectDays as number) : 0 }
  const best = Number.isInteger(saved.best) && (saved.best as number) >= 0 ? (saved.best as number) : 0
  const claimed = Array.isArray(saved.claimed) ? saved.claimed.filter((key): key is string => typeof key === 'string').slice(-20) : []
  return { history, log, totals, best, claimed }
}

function isDayLog(value: unknown): value is DayLog {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  const ids = (list: unknown) => Array.isArray(list) && list.every((id) => typeof id === 'string')
  const amount = (number: unknown) => Number.isInteger(number) && (number as number) >= 0
  return ids(entry.planned) && ids(entry.done) && amount(entry.xp) && amount(entry.coins)
}

/** How many times a quest has ever been done, today included. */
export function timesDone(streak: StreakState, today: GameState, questId: string): number {
  return (streak.totals.quests[questId] ?? 0) + (today.completedQuestIds.includes(questId) ? 1 : 0)
}

/** Every quest ever done, today included. */
export function questsDoneEver(streak: StreakState, today: GameState): number {
  return Object.values(streak.totals.quests).reduce((total, count) => total + count, 0) + today.completedQuestIds.length
}

/** Days with every quest done, today included once it is. */
export function perfectDaysEver(streak: StreakState, today: GameState, plan: QuestPlan): number {
  return streak.totals.perfectDays + (isPerfectDay(today, plan) ? 1 : 0)
}
