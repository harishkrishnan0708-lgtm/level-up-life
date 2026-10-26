import { CHARACTERS, CHARACTER_FACTS, SPEAKER_NAMES, type Character, type CharacterState } from './cast'
import { spoilsClue } from './clues'
import type { WarRecord } from './raids'
import { CHAPTERS, castState, chapterLabel, type StoryState } from './story'

/** One chapter as the Journal tells it: what happened, then what the hero chose. */
export interface JournalEntry {
  chapterId: string
  act: number
  number: number
  /** "Chapter 2", or "Interlude". */
  label: string
  title: string
  summary: string
  outcome: string | null
}

export function storySoFar(story: StoryState): JournalEntry[] {
  return CHAPTERS.filter((chapter) => story.read.includes(chapter.id)).map((chapter) => ({
    chapterId: chapter.id,
    act: chapter.act,
    number: chapter.number,
    label: chapterLabel(chapter),
    title: chapter.title,
    summary: chapter.summary ?? '',
    outcome: chapter.choice?.options.find(({ id }) => id === story.choices[chapter.id])?.outcome ?? null,
  }))
}

const ROLES: Record<Character, string> = {
  holt: 'Your sergeant',
  brannoc: 'Captain of the deserters',
  wick: 'The lantern merchant',
  mordrake: 'Baron of the Grey Keep',
  morwen: 'The Ash Witch of the Cinder Fen',
  gorrak: 'Warlord of the Red Steppe',
}

const ALLY_LABELS: Record<Character, string> = {
  holt: 'At your side',
  brannoc: 'Rides in your army',
  wick: 'Keeps a stall at the market',
  mordrake: 'Your vassal at the Grey Keep',
  morwen: 'Hunting the Moth with you',
  gorrak: 'Rides for you, with his whole horde',
}

const DEATHS: Record<Character, string> = {
  holt: 'Dead',
  brannoc: 'Hanged at the Old Watch Fort',
  wick: 'Dead',
  mordrake: 'Executed in his own hall',
  morwen: 'Dead',
  gorrak: 'Dead',
}

const FREE_LABELS: Partial<Record<Character, string>> = {
  mordrake: 'In exile, somewhere beyond the Grey Keep',
  morwen: 'Somewhere out in the Cinder Fen',
  gorrak: 'Gone home across the steppe',
}

/** Where a character stands with the hero, in words. */
export function standingLabel(who: Character, state: CharacterState): string {
  switch (state.standing) {
    case 'ally':
      return ALLY_LABELS[who]
    case 'prisoner':
      return 'Your prisoner'
    case 'free':
      return FREE_LABELS[who] ?? 'Set free, somewhere on the roads'
    case 'dead':
      return DEATHS[who]
    default:
      return 'Not yet met'
  }
}

const FEELINGS = ['Hates you', 'Resents you', 'Wary of you', 'Hasn’t made up their mind about you', 'Respects you', 'Trusts you', 'Would die for you']

/** How a character feels about the hero, in words. Wick is warm to every customer, so he never shows more. */
export function feelingLabel(who: Character, state: CharacterState): string | null {
  if (state.standing === 'dead') {
    return null
  }
  if (who === 'wick') {
    return 'Always glad to see you'
  }
  // Once a romance has begun, the Journal admits it.
  return state.romance > 0 ? `${FEELINGS[state.bond + 3]}, and there’s something unspoken between you` : FEELINGS[state.bond + 3]
}

export interface JournalPerson {
  who: Character
  name: string
  role: string
  standing: string
  feeling: string | null
  facts: string[]
  state: CharacterState
}

/** Everyone the hero has met, with what they know about each. */
export function peopleMet(story: StoryState): JournalPerson[] {
  const cast = castState(story)
  return CHARACTERS.filter((who) => cast[who].standing !== 'unmet').map((who) => ({
    who,
    name: SPEAKER_NAMES[who],
    role: ROLES[who],
    standing: standingLabel(who, cast[who]),
    feeling: feelingLabel(who, cast[who]),
    facts: cast[who].known.map((fact) => CHARACTER_FACTS[fact]?.text).filter((text): text is string => Boolean(text)),
    state: cast[who],
  }))
}

/** Everything the hero has pieced together about the Moth: from the chapters read and from the spoils of every win. */
export function mothClues(story: StoryState, war: WarRecord): string[] {
  const fromStory = CHAPTERS.filter((chapter) => story.read.includes(chapter.id)).flatMap((chapter) => chapter.mothClues ?? [])
  const fromSpoils = war.beaten.map((rivalId) => spoilsClue(rivalId)).filter((clue): clue is string => clue !== null)
  return [...fromStory, ...fromSpoils]
}
