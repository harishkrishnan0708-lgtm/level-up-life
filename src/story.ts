import type { Appearance } from './hero'
import { PRACTICE_RIVAL, rivalById, type WarRecord } from './raids'

/** Who is speaking a line. The narrator has no portrait; the hero's portrait is their own. */
export type Speaker = 'narrator' | 'hero' | 'holt' | 'brannoc' | 'wick'

export interface StoryLine {
  speaker: Speaker
  /** `{hero}` is replaced with the hero's name. */
  text: string
}

/** The hidden scores that choices move. Together with the final ultimatum, they decide the ending. */
export type StoryScore = 'mercy' | 'trust'

export interface StoryOption {
  id: string
  label: string
  effects: Partial<Record<StoryScore, number>>
  /** Someone who will stand with the hero later because of this choice. */
  ally?: string
  /** What is said right after choosing, before the chapter's closing lines. */
  replies: StoryLine[]
}

export interface Chapter {
  id: string
  act: number
  number: number
  title: string
  /** The rival whose defeat opens this chapter. */
  unlockedBy: string
  /** Empty while the chapter is still being written. */
  opening: StoryLine[]
  choice?: { prompt: string; options: StoryOption[] }
  closing: StoryLine[]
}

/** What the hero has read and decided so far. */
export interface StoryState {
  /** The option picked in each chapter, by chapter id. Choices are final. */
  choices: Record<string, string>
  /** Chapters read to the end. */
  read: string[]
}

export function newStoryState(): StoryState {
  return { choices: {}, read: [] }
}

export const SPEAKER_NAMES: Record<Exclude<Speaker, 'narrator' | 'hero'>, string> = {
  holt: 'Sergeant Holt',
  brannoc: 'Brannoc',
  wick: 'Wick',
}

/** The faces of the people the hero meets, drawn with the same parts as heroes. Wick has his own portrait. */
export const SPEAKER_LOOKS: Record<'holt' | 'brannoc', Appearance> = {
  holt: {
    race: 'human',
    skin: 'tan',
    hairStyle: 'short',
    hairColor: 'silver',
    eyes: 'brown',
    outfit: 'armor',
    outfitColor: 'forest',
    hat: 'none',
    heldItem: 'none',
  },
  brannoc: {
    race: 'human',
    skin: 'olive',
    hairStyle: 'long',
    hairColor: 'black',
    eyes: 'amber',
    outfit: 'cloak',
    outfitColor: 'onyx',
    hat: 'none',
    heldItem: 'none',
  },
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'lantern-man',
    act: 1,
    number: 1,
    title: 'The Moth',
    unlockedBy: 'old-fort',
    opening: [
      { speaker: 'narrator', text: 'Smoke still hangs over the Old Watch Fort. Your soldiers pick through what the deserters left behind.' },
      { speaker: 'holt', text: 'Not bad for a first siege, {hero}. Now come down to the cellar. You’ll want to see this.' },
      { speaker: 'narrator', text: 'Crates. Dozens of them. Inside, new swords, still oiled, and every hilt is stamped with a tiny moth.' },
      { speaker: 'hero', text: 'Deserters don’t buy new steel. Where did all this come from?' },
      { speaker: 'holt', text: 'That’s what bothers me. Half these blades are better than ours.' },
      { speaker: 'narrator', text: 'Your soldiers drag in the deserters’ captain: a scarred man with one ear and nothing left to lose.' },
      { speaker: 'brannoc', text: 'Brannoc. I marched under the old king’s banner, back when there was a king to march for.' },
      { speaker: 'brannoc', text: 'The swords were a gift. Came at night, by cart. The man never showed his face. Called himself the Moth.' },
      { speaker: 'brannoc', text: 'Said he wanted the roads kept dangerous. Laughed when he said it. A dry little laugh, like paper burning.' },
      { speaker: 'holt', text: 'A merchant who gives his wares away. Never met one of those.' },
      { speaker: 'brannoc', text: 'He’ll want paying eventually. That kind always does.' },
      { speaker: 'narrator', text: 'Brannoc glances at his men, bound in the courtyard. Twenty of them, tired and hungry.' },
      { speaker: 'brannoc', text: 'So. What happens to us, {hero}?' },
    ],
    choice: {
      prompt: 'What do you do with the deserters?',
      options: [
        {
          id: 'enlist',
          label: 'Take them into your army',
          effects: { mercy: 1 },
          ally: 'brannoc',
          replies: [
            { speaker: 'hero', text: 'You’ll march under my banner now. Desert me, and the roads will be the least of your worries.' },
            { speaker: 'brannoc', text: 'Fair terms. Fairer than we’d have given you.' },
            { speaker: 'holt', text: 'I’ll be keeping an eye on that one.' },
          ],
        },
        {
          id: 'release',
          label: 'Send them into the wilds, unarmed',
          effects: {},
          replies: [
            { speaker: 'hero', text: 'Leave the swords. Leave the fort. If I see you on my roads again, I won’t be this kind.' },
            { speaker: 'brannoc', text: 'Unarmed, on roads like these. You’re colder than you look.' },
          ],
        },
        {
          id: 'hang',
          label: 'Hand them over to be hanged',
          effects: { mercy: -1 },
          replies: [
            { speaker: 'hero', text: 'You robbed travellers and called it a living. The law can decide what that’s worth.' },
            { speaker: 'brannoc', text: 'The gallows, then. Remember me when the Moth comes to collect from you.' },
          ],
        },
      ],
    },
    closing: [
      { speaker: 'narrator', text: 'Before you leave, you pocket one of the stamped hilts. The little moth catches the light.' },
      { speaker: 'narrator', text: 'On the road home you pass the market, busy as ever. Wick waves you over from his stall.' },
      { speaker: 'wick', text: 'Back from the old fort already? Victorious, I hope. Victors deserve the finest things, and I have a few.' },
    ],
  },
  { id: 'grey-keep', act: 1, number: 2, title: 'The Grey Keep', unlockedBy: 'mordrake', opening: [], closing: [] },
  { id: 'cinder-fen', act: 1, number: 3, title: 'Cinder Fen', unlockedBy: 'witch', opening: [], closing: [] },
  { id: 'red-steppe', act: 1, number: 4, title: 'The Red Steppe', unlockedBy: 'gorrak', opening: [], closing: [] },
]

/** What opens a chapter, e.g. "Defeat the Ash Witch" or "Take the Old Watch Fort". */
export function unlockHint(chapter: Chapter): string {
  const name = (rivalById(chapter.unlockedBy)?.name ?? 'a rival').replace(/^The /, 'the ')
  return `${chapter.unlockedBy === PRACTICE_RIVAL.id ? 'Take' : 'Defeat'} ${name}`
}

export type ChapterStatus = 'locked' | 'unwritten' | 'new' | 'read'

export function chapterStatus(chapter: Chapter, war: WarRecord, story: StoryState): ChapterStatus {
  if (!war.beaten.includes(chapter.unlockedBy)) {
    return 'locked'
  }
  if (chapter.opening.length === 0) {
    return 'unwritten'
  }
  return story.read.includes(chapter.id) ? 'read' : 'new'
}

/** The lines of a chapter in reading order: everything up to the choice, then (once chosen) the replies and the close. */
export function chapterScript(chapter: Chapter, choiceId: string | undefined): { lines: StoryLine[]; choiceAt: number | null } {
  if (!chapter.choice) {
    return { lines: [...chapter.opening, ...chapter.closing], choiceAt: null }
  }
  const option = chapter.choice.options.find(({ id }) => id === choiceId)
  return {
    lines: option ? [...chapter.opening, ...option.replies, ...chapter.closing] : chapter.opening,
    choiceAt: chapter.opening.length,
  }
}

/** Records a choice; choices are final, so a second one for the same chapter is ignored. */
export function chooseOption(story: StoryState, chapterId: string, optionId: string): StoryState {
  const chapter = CHAPTERS.find(({ id }) => id === chapterId)
  if (story.choices[chapterId] || !chapter?.choice?.options.some(({ id }) => id === optionId)) {
    return story
  }
  return { ...story, choices: { ...story.choices, [chapterId]: optionId } }
}

export function markRead(story: StoryState, chapterId: string): StoryState {
  return story.read.includes(chapterId) ? story : { ...story, read: [...story.read, chapterId] }
}

/** Adds up what the hero's choices have shown about them so far. */
export function storyScores(story: StoryState): Record<StoryScore, number> & { allies: string[] } {
  const totals = { mercy: 0, trust: 0, allies: [] as string[] }
  for (const chapter of CHAPTERS) {
    const option = chapter.choice?.options.find(({ id }) => id === story.choices[chapter.id])
    if (!option) {
      continue
    }
    totals.mercy += option.effects.mercy ?? 0
    totals.trust += option.effects.trust ?? 0
    if (option.ally) {
      totals.allies.push(option.ally)
    }
  }
  return totals
}

/** Rebuilds story progress from saved data, keeping only chapters and choices that exist. */
export function sanitizeStoryState(value: unknown): StoryState {
  if (typeof value !== 'object' || value === null) {
    return newStoryState()
  }
  const saved = value as Record<string, unknown>
  let story = newStoryState()
  if (typeof saved.choices === 'object' && saved.choices !== null) {
    for (const [chapterId, optionId] of Object.entries(saved.choices)) {
      if (typeof optionId === 'string') {
        story = chooseOption(story, chapterId, optionId)
      }
    }
  }
  if (Array.isArray(saved.read)) {
    for (const chapterId of saved.read) {
      if (CHAPTERS.some(({ id }) => id === chapterId)) {
        story = markRead(story, chapterId)
      }
    }
  }
  return story
}
