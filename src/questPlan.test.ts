import { describe, expect, it } from 'vitest'
import { QUESTS, newGame, toggleQuest } from './game'
import { EMPTY_ROSTER, activeHero, addHero, loadRoster, newHeroDraft, saveRoster, setHeroProgress } from './hero'
import {
  MAX_CUSTOM_QUESTS,
  addCustomQuest,
  allQuests,
  editCustomQuest,
  isPerfectDay,
  newQuestPlan,
  questDays,
  questsOn,
  removeCustomQuest,
  sanitizeQuestPlan,
  toggleQuestDay,
  weekdayOf,
  type QuestPlan,
} from './questPlan'
import { newWarRecord, raidReadiness } from './raids'

// 2026-10-19 is a Monday, 2026-10-24 a Saturday.
const MONDAY = '2026-10-19'
const SATURDAY = '2026-10-24'

/** Lifting on Mondays only; everything else stays on every day. */
const liftMondays = [0, 2, 3, 4, 5, 6].reduce<QuestPlan>((plan, day) => toggleQuestDay(plan, 'lift', day as 0), newQuestPlan())

describe('the weekly quest plan', () => {
  it('knows the day of the week', () => {
    expect([weekdayOf(MONDAY), weekdayOf(SATURDAY)]).toEqual([1, 6])
  })

  it('shows every quest every day until the hero plans their week', () => {
    expect(questsOn(newQuestPlan(), SATURDAY)).toHaveLength(QUESTS.length)
  })

  it('shows a quest only on its days', () => {
    expect(questsOn(liftMondays, MONDAY).map(({ id }) => id)).toContain('lift')
    expect(questsOn(liftMondays, SATURDAY).map(({ id }) => id)).not.toContain('lift')
  })

  it('counts a perfect day by that day’s quests, and never a rest day', () => {
    let saturday = newGame(SATURDAY)
    for (const quest of questsOn(liftMondays, SATURDAY)) {
      saturday = toggleQuest(saturday, quest.id, 'warrior')
    }
    expect(isPerfectDay(saturday, liftMondays)).toBe(true)
    expect(raidReadiness(saturday, newWarRecord(), SATURDAY, false, liftMondays)).toBe('ready')

    const restEveryDay = QUESTS.reduce((plan, quest) => [0, 1, 2, 3, 4, 5, 6].reduce((inner, day) => toggleQuestDay(inner, quest.id, day as 0), plan), newQuestPlan())
    expect(isPerfectDay(newGame(SATURDAY), restEveryDay)).toBe(false)
  })
})

describe('quests of your own', () => {
  it('can be added, earn their reward, and appear every day', () => {
    const plan = addCustomQuest(newQuestPlan(), { name: '  Stretch for 10 minutes ', category: 'exercise', size: 'large' })
    const [stretch] = plan.custom
    expect(stretch).toMatchObject({ name: 'Stretch for 10 minutes', category: 'exercise', xp: 30, coins: 10 })
    expect(questsOn(plan, MONDAY)).toContainEqual(stretch)
    expect(toggleQuest(newGame(MONDAY), stretch.id, 'mage', 1, allQuests(plan))).toMatchObject({ totalXp: 30, coins: 10 })
  })

  it('need a name, and stop at the limit', () => {
    expect(addCustomQuest(newQuestPlan(), { name: '   ', category: 'healthy', size: 'small' }).custom).toHaveLength(0)
    let plan = newQuestPlan()
    for (let index = 0; index < MAX_CUSTOM_QUESTS + 2; index++) {
      plan = addCustomQuest(plan, { name: `Quest ${index}`, category: 'healthy', size: 'small' })
    }
    expect(plan.custom).toHaveLength(MAX_CUSTOM_QUESTS)
  })

  it('survive closing and reopening the app, with their schedule', () => {
    const store = new Map<string, string>()
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value) }
    let roster = addHero(EMPTY_ROSTER, { ...newHeroDraft(), name: 'Harish' }, newGame(MONDAY))
    const plan = { ...toggleQuestDay(addCustomQuest(newQuestPlan(), { name: 'Read', category: 'healthy', size: 'small' }), 'custom-1', 6), scheduled: true }
    roster = setHeroProgress(roster, activeHero(roster)!.id, { plan })
    saveRoster(storage, roster)
    expect(activeHero(loadRoster(storage, MONDAY))!.plan).toEqual(plan)
  })
})

describe('changing quests of your own', () => {
  const stretch = { name: 'Stretch for 10 minutes', category: 'healthy', size: 'small' } as const
  const swim = { name: 'Swim laps', category: 'exercise', size: 'large' } as const
  const twoQuests = addCustomQuest(addCustomQuest(newQuestPlan(), stretch), swim)

  it('changes a quest’s name, kind, and reward, keeping its days', () => {
    const offMondays = toggleQuestDay(twoQuests, 'custom-1', 1)
    const edited = editCustomQuest(offMondays, 'custom-1', { name: 'Yoga', category: 'exercise', size: 'large' })
    expect(edited.custom[0]).toMatchObject({ id: 'custom-1', name: 'Yoga', category: 'exercise', xp: 30, coins: 10 })
    expect(questDays(edited, 'custom-1')).not.toContain(1)
    expect(editCustomQuest(twoQuests, 'custom-1', { ...stretch, name: '  ' })).toBe(twoQuests)
  })

  it('removes a quest from every day and frees its slot', () => {
    const removed = removeCustomQuest(toggleQuestDay(twoQuests, 'custom-1', 1), 'custom-1')
    expect(removed.custom.map(({ name }) => name)).toEqual(['Swim laps'])
    expect(removed.days['custom-1']).toBeUndefined()
    expect(addCustomQuest(removed, { ...stretch, name: 'Plank' }).custom).toHaveLength(2)
  })

  it('keeps the other quests’ ids, and so their days, after a removal and a reload', () => {
    const removed = removeCustomQuest(toggleQuestDay(twoQuests, 'custom-2', 3), 'custom-1')
    const reloaded = sanitizeQuestPlan(JSON.parse(JSON.stringify(removed)))
    expect(reloaded.custom.map(({ id, name }) => [id, name])).toEqual([['custom-2', 'Swim laps']])
    expect(questDays(reloaded, 'custom-2')).not.toContain(3)
  })

  it('undoes a finished quest for what it paid, even if its reward changed since', () => {
    const quests = allQuests(twoQuests)
    const done = toggleQuest(newGame('2026-11-05'), 'custom-2', 'mage', 1, quests)
    const cheaper = allQuests(editCustomQuest(twoQuests, 'custom-2', { ...swim, size: 'small' }))
    expect(toggleQuest(done, 'custom-2', 'mage', 1, cheaper).coins).toBe(0)
  })
})
