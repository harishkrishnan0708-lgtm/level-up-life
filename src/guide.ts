/** The first-time tour: one stop per tab, ending with planning the week. */
export type GuideTab = 'quests' | 'shop' | 'kingdom' | 'war' | 'pets' | 'journal'

export interface GuideStep {
  tab: GuideTab
  title: string
  /** `{hero}` is replaced with the hero's name. */
  text: string
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    tab: 'quests',
    title: 'Your habits are your quests',
    text: 'When you finish one in real life, tap it here. Each one earns XP and coins, and levels up {hero}.',
  },
  {
    tab: 'quests',
    title: 'Keep the flame lit',
    text: 'Finish most of a day’s quests to grow your streak. Long streaks pay bonus coins at 3, 7, 14, 30, and 60 days.',
  },
  {
    tab: 'shop',
    title: 'The market',
    text: 'Spend your coins on buildings, gear, potions, and Candles of Respite, which save your streak on a bad day. New stock every dawn.',
  },
  {
    tab: 'kingdom',
    title: 'Your kingdom',
    text: 'Every building you buy takes its place on your map. Some make your army stronger.',
  },
  {
    tab: 'war',
    title: 'The war table',
    text: 'Finish all of a day’s quests and your army will march once that day. Every lord you defeat opens a chapter of the Chronicle.',
  },
  {
    tab: 'pets',
    title: 'The menagerie',
    text: 'Perfect days can turn up eggs. The quests you complete warm them until they hatch into companions that boost your XP.',
  },
  {
    tab: 'journal',
    title: 'Your journal',
    text: 'Everything that happens in the story is written down here: what you chose, the people you’ve met, and what you know about them.',
  },
  {
    tab: 'quests',
    title: 'Plan your week',
    text: 'Not every quest belongs on every day. Choose which days each one is on, and add quests of your own. Rest days never break a streak.',
  },
]

const GUIDE_DONE_KEY = 'level-up-life/guide-done'

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>

/** Whether this phone has already seen (or skipped) the tour. */
export function guideDone(store: KeyValueStore): boolean {
  try {
    return store.getItem(GUIDE_DONE_KEY) === 'yes'
  } catch {
    return false
  }
}

export function markGuideDone(store: KeyValueStore): void {
  try {
    store.setItem(GUIDE_DONE_KEY, 'yes')
  } catch {
    // The tour may show again next time; nothing else is affected.
  }
}
