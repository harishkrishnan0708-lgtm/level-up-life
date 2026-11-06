import { QUESTS, type GameState, type Quest, type QuestCategory } from './game'

/** 0 is Sunday through 6 for Saturday, the way `Date.getDay` counts. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** The week as it's shown, starting on Monday. */
export const WEEK: readonly { day: Weekday; letter: string; name: string }[] = [
  { day: 1, letter: 'M', name: 'Monday' },
  { day: 2, letter: 'T', name: 'Tuesday' },
  { day: 3, letter: 'W', name: 'Wednesday' },
  { day: 4, letter: 'T', name: 'Thursday' },
  { day: 5, letter: 'F', name: 'Friday' },
  { day: 6, letter: 'S', name: 'Saturday' },
  { day: 0, letter: 'S', name: 'Sunday' },
]

const EVERY_DAY: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6]

/** Room for a few quests of your own, so rewards (and raids) stay balanced. */
export const MAX_CUSTOM_QUESTS = 3
export const QUEST_NAME_MAX_LENGTH = 40

export const REWARD_SIZES = {
  small: { label: 'Small', xp: 15, coins: 5 },
  medium: { label: 'Medium', xp: 20, coins: 5 },
  large: { label: 'Large', xp: 30, coins: 10 },
} as const
export type RewardSize = keyof typeof REWARD_SIZES

/** Which quests a hero does on which days, and the quests they've added themselves. */
export interface QuestPlan {
  /** The days each quest is on, by quest id. A quest with no entry is on every day. */
  days: Record<string, Weekday[]>
  custom: Quest[]
  /** Whether the hero has set up their week yet. */
  scheduled: boolean
}

export function newQuestPlan(): QuestPlan {
  return { days: {}, custom: [], scheduled: false }
}

export function allQuests(plan: QuestPlan): Quest[] {
  return [...QUESTS, ...plan.custom]
}

export function questDays(plan: QuestPlan, questId: string): readonly Weekday[] {
  return plan.days[questId] ?? EVERY_DAY
}

/** The weekday of a local calendar date like "2026-10-22". */
export function weekdayOf(day: string): Weekday {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date).getDay() as Weekday
}

/** The quests scheduled on a given date. None means it's a rest day. */
export function questsOn(plan: QuestPlan, day: string): Quest[] {
  const weekday = weekdayOf(day)
  return allQuests(plan).filter((quest) => questDays(plan, quest.id).includes(weekday))
}

/** Every one of the day's quests done; a rest day doesn't count, since there was nothing to do. */
export function isPerfectDay(game: GameState, plan: QuestPlan): boolean {
  const todays = questsOn(plan, game.day)
  return todays.length > 0 && todays.every((quest) => game.completedQuestIds.includes(quest.id))
}

export function toggleQuestDay(plan: QuestPlan, questId: string, weekday: Weekday): QuestPlan {
  const current = questDays(plan, questId)
  const days = current.includes(weekday) ? current.filter((day) => day !== weekday) : [...current, weekday].sort()
  return { ...plan, days: { ...plan.days, [questId]: days } }
}

export function validateQuestName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'Give your quest a name.'
  }
  if (trimmed.length > QUEST_NAME_MAX_LENGTH) {
    return `Keep it under ${QUEST_NAME_MAX_LENGTH} characters.`
  }
  return null
}

export interface NewQuest {
  name: string
  category: QuestCategory
  size: RewardSize
}

function customQuest(id: string, { name, category, size }: NewQuest): Quest {
  return {
    id,
    trial: category === 'exercise' ? 'A Trial of Your Own' : 'A Rite of Your Own',
    name: name.trim(),
    category,
    xp: REWARD_SIZES[size].xp,
    coins: REWARD_SIZES[size].coins,
  }
}

/** The reward size a quest of the hero's own was made with. */
export function rewardSizeOf(quest: Quest): RewardSize {
  return (Object.keys(REWARD_SIZES) as RewardSize[]).find((key) => REWARD_SIZES[key].xp === quest.xp) ?? 'small'
}

/**
 * Adds a quest of the hero's own, on every day to start with; returns the plan unchanged if it can't be added. Each
 * keeps its id for good, so its days and today's progress stay with it when others are removed.
 */
export function addCustomQuest(plan: QuestPlan, quest: NewQuest, id?: string): QuestPlan {
  const used = new Set(plan.custom.map((custom) => custom.id))
  if (validateQuestName(quest.name) || plan.custom.length >= MAX_CUSTOM_QUESTS || (id !== undefined && used.has(id))) {
    return plan
  }
  let number = 1
  while (used.has(`custom-${number}`)) {
    number++
  }
  return { ...plan, custom: [...plan.custom, customQuest(id ?? `custom-${number}`, quest)] }
}

/** Changes a quest of the hero's own, keeping its days; returns the plan unchanged if the change isn't valid. */
export function editCustomQuest(plan: QuestPlan, questId: string, quest: NewQuest): QuestPlan {
  if (validateQuestName(quest.name) || !plan.custom.some(({ id }) => id === questId)) {
    return plan
  }
  return { ...plan, custom: plan.custom.map((custom) => (custom.id === questId ? customQuest(questId, quest) : custom)) }
}

/** Removes a quest of the hero's own from every day. The built-in quests can't be removed, only scheduled off. */
export function removeCustomQuest(plan: QuestPlan, questId: string): QuestPlan {
  const { [questId]: _removed, ...days } = plan.days
  return { ...plan, custom: plan.custom.filter(({ id }) => id !== questId), days }
}

function isWeekday(value: unknown): value is Weekday {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 6
}

/** Rebuilds a quest plan from saved data, keeping only real quests, real days, and fair rewards. */
export function sanitizeQuestPlan(value: unknown): QuestPlan {
  if (typeof value !== 'object' || value === null) {
    return newQuestPlan()
  }
  const saved = value as Record<string, unknown>
  let plan = newQuestPlan()
  const savedCustom = Array.isArray(saved.custom) ? saved.custom : []
  for (const raw of savedCustom) {
    const quest = raw as Partial<Quest>
    if (typeof quest.name === 'string' && (quest.category === 'exercise' || quest.category === 'healthy')) {
      const keepsId = typeof quest.id === 'string' && /^custom-\d+$/.test(quest.id) && !plan.custom.some(({ id }) => id === quest.id)
      const id = keepsId ? quest.id : undefined
      plan = addCustomQuest(plan, { name: quest.name, category: quest.category, size: rewardSizeOf(quest as Quest) }, id)
    }
  }
  const known = new Set(allQuests(plan).map(({ id }) => id))
  const days: Record<string, Weekday[]> = {}
  if (typeof saved.days === 'object' && saved.days !== null) {
    for (const [questId, list] of Object.entries(saved.days)) {
      if (known.has(questId) && Array.isArray(list)) {
        days[questId] = [...new Set(list.filter(isWeekday))].sort()
      }
    }
  }
  return { ...plan, days, scheduled: saved.scheduled === true }
}
