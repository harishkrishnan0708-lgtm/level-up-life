import { levelProgress } from './game'
import type { Hero } from './hero'
import { mothClues } from './journalPages'
import { CHAPTERS } from './story'
import { bestStreakSoFar, perfectDaysEver, questsDoneEver, timesDone } from './streak'

export type AchievementKind = 'habits' | 'growth' | 'war' | 'secret'

export interface Achievement {
  id: string
  name: string
  /** What to do to earn it, shown before it's earned (except for secret ones). */
  goal: string
  kind: AchievementKind
  coins: number
  earned: (hero: Hero) => boolean
}

const choseInChapter = (chapterId: string, optionId: string) => (hero: Hero) => hero.story.choices[chapterId] === optionId
const beat = (rivalId: string) => (hero: Hero) => hero.war.beaten.includes(rivalId)
const buildingCount = (hero: Hero) => Object.values(hero.holdings.buildings).reduce((total, count) => total + count, 0)
const ACT_ONE = CHAPTERS.filter(({ act }) => act === 1).map(({ id }) => id)

export const ACHIEVEMENTS: readonly Achievement[] = [
  // Habits
  { id: 'first-quest', name: 'First Step', goal: 'Finish your first quest', kind: 'habits', coins: 10, earned: (hero) => questsDoneEver(hero.streak, hero.game) >= 1 },
  { id: 'perfect-day', name: 'Flawless', goal: 'Finish every quest in a day', kind: 'habits', coins: 20, earned: (hero) => perfectDaysEver(hero.streak, hero.game, hero.plan) >= 1 },
  { id: 'streak-3', name: 'Kindling', goal: 'Keep a 3-day streak', kind: 'habits', coins: 15, earned: (hero) => bestStreakSoFar(hero.streak, hero.game, hero.plan) >= 3 },
  { id: 'streak-7', name: 'Iron Will', goal: 'Keep a 7-day streak', kind: 'habits', coins: 40, earned: (hero) => bestStreakSoFar(hero.streak, hero.game, hero.plan) >= 7 },
  { id: 'streak-30', name: 'Unbroken', goal: 'Keep a 30-day streak', kind: 'habits', coins: 100, earned: (hero) => bestStreakSoFar(hero.streak, hero.game, hero.plan) >= 30 },
  { id: 'perfect-10', name: 'Ten Flawless Days', goal: 'Finish every quest on 10 different days', kind: 'habits', coins: 50, earned: (hero) => perfectDaysEver(hero.streak, hero.game, hero.plan) >= 10 },
  { id: 'quests-100', name: 'Centurion', goal: 'Finish 100 quests', kind: 'habits', coins: 50, earned: (hero) => questsDoneEver(hero.streak, hero.game) >= 100 },
  { id: 'water-50', name: 'Wellspring', goal: 'Drink 8 glasses of water on 50 days', kind: 'habits', coins: 30, earned: (hero) => timesDone(hero.streak, hero.game, 'water') >= 50 },
  { id: 'lift-25', name: 'Iron Devotee', goal: 'Lift at the gym 25 times', kind: 'habits', coins: 30, earned: (hero) => timesDone(hero.streak, hero.game, 'lift') >= 25 },
  { id: 'sleep-30', name: 'Well Rested', goal: 'Sleep 7+ hours on 30 nights', kind: 'habits', coins: 30, earned: (hero) => timesDone(hero.streak, hero.game, 'sleep') >= 30 },
  { id: 'own-quest', name: 'Your Own Path', goal: 'Add a quest of your own', kind: 'habits', coins: 10, earned: (hero) => hero.plan.custom.length > 0 },
  // Hero growth
  { id: 'level-5', name: 'Knighted', goal: 'Reach level 5', kind: 'growth', coins: 30, earned: (hero) => levelProgress(hero.game.totalXp).level >= 5 },
  { id: 'level-10', name: 'Veteran', goal: 'Reach level 10', kind: 'growth', coins: 60, earned: (hero) => levelProgress(hero.game.totalXp).level >= 10 },
  { id: 'coins-1000', name: 'Dragon’s Hoard', goal: 'Hold 1,000 coins at once', kind: 'growth', coins: 50, earned: (hero) => hero.game.coins >= 1000 },
  { id: 'first-pet', name: 'Hatchling', goal: 'Hatch your first pet', kind: 'growth', coins: 20, earned: (hero) => Object.keys(hero.pets.owned).length >= 1 },
  { id: 'pets-5', name: 'Menagerie', goal: 'Hatch 5 different pets', kind: 'growth', coins: 50, earned: (hero) => Object.keys(hero.pets.owned).length >= 5 },
  { id: 'first-building', name: 'Cornerstone', goal: 'Raise your first building', kind: 'growth', coins: 15, earned: (hero) => buildingCount(hero) >= 1 },
  { id: 'buildings-10', name: 'Township', goal: 'Raise 10 buildings', kind: 'growth', coins: 40, earned: (hero) => buildingCount(hero) >= 10 },
  // War and story
  { id: 'first-win', name: 'First Blood', goal: 'Win your first siege', kind: 'war', coins: 20, earned: (hero) => hero.war.victories >= 1 },
  { id: 'beat-mordrake', name: 'Kingbreaker', goal: 'Defeat Baron Mordrake', kind: 'war', coins: 30, earned: beat('mordrake') },
  { id: 'beat-witch', name: 'Through the Smoke', goal: 'Defeat the Ash Witch', kind: 'war', coins: 30, earned: beat('witch') },
  { id: 'beat-gorrak', name: 'Hordebreaker', goal: 'Defeat Gorrak', kind: 'war', coins: 30, earned: beat('gorrak') },
  { id: 'moth-clues', name: 'Moth Hunter', goal: 'Gather 5 clues about the Moth', kind: 'war', coins: 30, earned: (hero) => mothClues(hero.story, hero.war).length >= 5 },
  { id: 'act-1', name: 'The End of Act I', goal: 'Read every chapter of Act I', kind: 'war', coins: 50, earned: (hero) => ACT_ONE.every((id) => hero.story.read.includes(id)) },
  // Secret: shown as ??? until earned
  { id: 'mercy', name: 'Mercy', goal: 'Let Brannoc go free', kind: 'secret', coins: 25, earned: choseInChapter('lantern-man', 'release') },
  { id: 'iron-law', name: 'Iron Law', goal: 'Hang Brannoc', kind: 'secret', coins: 25, earned: choseInChapter('lantern-man', 'hang') },
  { id: 'carved-bird', name: 'The Carved Bird', goal: 'Ask Holt about his bird', kind: 'secret', coins: 25, earned: choseInChapter('around-the-fire', 'bird') },
  { id: 'ash-moon', name: 'Under the Ash Moon', goal: 'Stay with Morwen on the night watch', kind: 'secret', coins: 25, earned: choseInChapter('night-watch', 'stay') },
  { id: 'honour-duel', name: 'Honour Bound', goal: 'Beat Gorrak in single combat', kind: 'secret', coins: 25, earned: choseInChapter('red-steppe', 'duel') },
]

export const ACHIEVEMENT_KINDS: readonly { kind: AchievementKind; title: string }[] = [
  { kind: 'habits', title: 'Habits' },
  { kind: 'growth', title: 'Growth' },
  { kind: 'war', title: 'War and story' },
  { kind: 'secret', title: 'Secrets' },
]

/** Achievements the hero has just earned and not yet been given. */
export function newlyEarned(hero: Hero): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => !hero.achievements[achievement.id] && achievement.earned(hero))
}

/** Records achievements as earned today and pays out their coins. Each is only ever paid once. */
export function awardAchievements(hero: Hero, achievements: readonly Achievement[], today: string): Pick<Hero, 'achievements' | 'game'> {
  const fresh = achievements.filter(({ id }) => !hero.achievements[id])
  const coins = fresh.reduce((total, achievement) => total + achievement.coins, 0)
  return {
    achievements: { ...hero.achievements, ...Object.fromEntries(fresh.map(({ id }) => [id, today])) },
    game: { ...hero.game, coins: hero.game.coins + coins },
  }
}

/** Rebuilds earned achievements from saved data: known ids with a date. */
export function sanitizeAchievements(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(value).filter(([id, day]) => ACHIEVEMENTS.some((achievement) => achievement.id === id) && typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)),
  )
}
