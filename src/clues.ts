import type { StoryState } from './story'
import { seededRandom } from './wares'

/**
 * Hints of the Chronicle's plot, scattered through the app: someone called the Moth is arming every side. Nothing ever
 * says the Moth is Wick. Each list unlocks with chapters read, so the mystery deepens as the story goes on.
 */
interface Tier {
  /** Chapters read before these lines can appear. */
  from: number
  lines: readonly string[]
}

/** How far into the Chronicle the hero is, counted in chapters read. */
export const storyProgress = (story: StoryState) => story.read.length

function unlocked(tiers: readonly Tier[], progress: number): string[] {
  return tiers.filter(({ from }) => progress >= from).flatMap(({ lines }) => lines)
}

function pick(lines: readonly string[], seed: string): string {
  return lines[Math.floor(seededRandom(seed) * lines.length)]
}

/**
 * Story milestones, in chapters read. The clues pointing at Wick are hindsight clues: each has an innocent explanation
 * on its own, and the reveal chapter calls them back so the twist makes sense.
 */
const AFTER_CHAPTER_ONE = 1
const AFTER_ACT_ONE = 4
const DEEP_IN_ACT_TWO = 10

const RUMOURS: readonly Tier[] = [
  {
    from: 0,
    lines: [
      'Deserters hold the Old Watch Fort. Where does a rabble like that find good swords?',
      'Baron Mordrake and the Ash Witch are both arming. Each swears the other started it.',
      'A trader’s wagon was seen leaving Gorrak’s camp at dawn. Nobody saw it arrive.',
      'Lights in the fog on the old road again. Nobody follows them twice.',
      'A wanderer swears she saw two armies fighting with the very same swords.',
      'The miller’s boy ran at dawn and came back faster than the horses. Something in the air lately.',
      'Old Marta drinks eight cups of water a day and has buried three husbands. Draw your own conclusions.',
    ],
  },
  {
    from: AFTER_CHAPTER_ONE,
    lines: [
      'They say the deserters’ swords were all stamped with a little moth. Odd mark for a smith.',
      'Someone calling himself the Moth is buying swords in every town, then giving them away.',
      // The red herring: everything about the Moth seems to point at the Ash Witch, until her own chapter clears her.
      'The Ash Witch keeps moths in jars, they say. Hundreds of them.',
      'Smoke over the Cinder Fen again. Smells like burning paper.',
    ],
  },
  { from: AFTER_ACT_ONE, lines: ['The market has never once closed in a hundred years. Not for plague, not for war.'] },
  { from: DEEP_IN_ACT_TWO, lines: ['My gran bought a lantern at the market when she was a girl. Same stall as today, she says.'] },
]

/** The tavern rumour for a given day, the same all day long. */
export function dailyRumour(day: string, story: StoryState): string {
  return pick(unlocked(RUMOURS, storyProgress(story)), `${day}:rumour`)
}

/** Extra things the townsfolk call out at the market. */
const MARKET_CHATTER: readonly Tier[] = [
  { from: 0, lines: ['Ever seen Wick eat? Or sleep? Me neither.'] },
  {
    from: AFTER_CHAPTER_ONE,
    lines: ['Heard the deserters had a friend with deep pockets. Called himself the Moth.', 'The Moth? Ask the Ash Witch. Moths love her fires.'],
  },
  // Brannoc said the Moth laughs like paper burning; this is the echo, long after.
  { from: AFTER_ACT_ONE, lines: ['Wick laughed at my joke once. Sounded like someone crumpling a letter.'] },
]

/** Wick, friendly and helpful. He just hears about things a little quickly. */
const WICK_GREETINGS: readonly Tier[] = [{ from: AFTER_CHAPTER_ONE, lines: ['The hero of the Old Watch Fort! Word travels fast in a market.'] }]

const WICK_THANKS: readonly Tier[] = [{ from: AFTER_ACT_ONE, lines: ['Every coin finds its way home eventually.'] }]

export const marketChatter = (story: StoryState) => unlocked(MARKET_CHATTER, storyProgress(story))
export const wickGreetings = (story: StoryState) => unlocked(WICK_GREETINGS, storyProgress(story))
export const wickThanks = (story: StoryState) => unlocked(WICK_THANKS, storyProgress(story))

/** What turns up among the spoils of each victory: the Moth’s trail, never a name. */
const SPOILS: Record<string, string> = {
  'old-fort': 'Among the spoils: a crate of new swords, every hilt stamped with a tiny moth.',
  mordrake: 'Among the spoils: a ledger of payments to someone the Baron calls only “the Moth.”',
  witch: 'Among the spoils: casks of oil that never burns down, each sealed with a wax moth.',
  gorrak: 'Among the spoils: chests of fresh-minted gold, a moth pressed into every lid.',
}

export function spoilsClue(rivalId: string): string | null {
  return SPOILS[rivalId] ?? null
}
