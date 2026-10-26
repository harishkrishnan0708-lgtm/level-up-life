import type { Appearance } from './hero'
import type { CharacterFeatures } from './heroPixels'
import type { Actor, Speaker } from './story'

/**
 * The recurring characters, and how they change as the story goes on. Each one's standing with the hero, how they feel
 * about the hero, and what the hero has learned about them all follow from the chapters read and the choices made, so
 * later chapters can change how they look, what they say, and whether they appear at all.
 */

export type Character = Exclude<Actor, 'hero'>

/** Characters drawn as full figures; Wick is only ever seen behind his stall. */
export type DrawnCharacter = Exclude<Character, 'wick'>

/** Where a character stands with the hero. */
export type Standing = 'unmet' | 'ally' | 'prisoner' | 'free' | 'dead'

export interface CharacterState {
  standing: Standing
  /** How the character feels about the hero, from -3 (hates them) to 3 (would die for them). */
  bond: number
  /** How far along their story arc they are; chapters move it on. */
  stage: number
  /** What the hero has learned about them, for the Journal. */
  known: string[]
  /** How far a romance has gone, from 0 (none) up; only Morwen's can start, and only if the hero lets it. */
  romance: number
}

export type CastState = Record<Character, CharacterState>

/** A change to a character, made by reading a chapter or by a choice in it. */
export interface Development {
  who: Character
  standing?: Standing
  /** Added to their bond, which stays between -3 and 3. */
  bond?: number
  stage?: number
  learn?: string
  /** Moves a romance on to at least this point. */
  romance?: number
}

/** A test a line (or later, a whole scene) can require of a character before it plays. */
export interface Condition {
  who: Character
  standing?: readonly Standing[]
  bondAtLeast?: number
  bondBelow?: number
  stageAtLeast?: number
  romanceAtLeast?: number
}

export const CHARACTERS: readonly Character[] = ['holt', 'brannoc', 'wick', 'mordrake', 'morwen', 'gorrak']

export function newCastState(): CastState {
  const fresh = (): CharacterState => ({ standing: 'unmet', bond: 0, stage: 0, known: [], romance: 0 })
  return { holt: fresh(), brannoc: fresh(), wick: fresh(), mordrake: fresh(), morwen: fresh(), gorrak: fresh() }
}

export function develop(cast: CastState, change: Development): CastState {
  const current = cast[change.who]
  const known = change.learn && !current.known.includes(change.learn) ? [...current.known, change.learn] : current.known
  return {
    ...cast,
    [change.who]: {
      standing: change.standing ?? current.standing,
      bond: Math.max(-3, Math.min(3, current.bond + (change.bond ?? 0))),
      stage: Math.max(current.stage, change.stage ?? 0),
      known,
      romance: Math.max(current.romance, change.romance ?? 0),
    },
  }
}

export function meets(condition: Condition, cast: CastState): boolean {
  const { standing, bond, stage } = cast[condition.who]
  return (
    (!condition.standing || condition.standing.includes(standing)) &&
    (condition.bondAtLeast === undefined || bond >= condition.bondAtLeast) &&
    (condition.bondBelow === undefined || bond < condition.bondBelow) &&
    (condition.stageAtLeast === undefined || stage >= condition.stageAtLeast) &&
    (condition.romanceAtLeast === undefined || cast[condition.who].romance >= condition.romanceAtLeast)
  )
}

/** Things the hero can learn about each character, shown in the Journal once learned. */
export const CHARACTER_FACTS: Record<string, { who: Character; text: string }> = {
  'holt-old-guard': { who: 'holt', text: 'Served forty years under the old king, and has never stopped comparing.' },
  'holt-counts': { who: 'holt', text: 'Counts everything: soldiers, crates, days of food. Twice.' },
  'holt-carving': { who: 'holt', text: 'Carries a little carved wooden bird on his belt. Won’t say why.' },
  'brannoc-coin': { who: 'brannoc', text: 'Carries the last coin the old king ever paid him, and flips it when he’s thinking.' },
  'brannoc-moth': { who: 'brannoc', text: 'Took swords from a faceless stranger who called himself the Moth.' },
  'brannoc-debt': { who: 'brannoc', text: 'Never forgets a debt, owed or owing.' },
  'wick-market': { who: 'wick', text: 'Runs the lantern stall at the market, and remembers every customer.' },
  'holt-days': { who: 'holt', text: 'Mutters numbers under his breath. Says he’s only counting the stones.' },
  'mordrake-proud': { who: 'mordrake', text: 'Proud, and polite even in defeat. Admits he is an old fool, but swears he is no liar.' },
  'mordrake-letters': { who: 'mordrake', text: 'Armed for war because unsigned letters, sealed with a wax moth, warned him the Ash Witch was coming.' },
  'mordrake-warning': { who: 'mordrake', text: 'His last warning: whoever wrote his letters knows your name too.' },
  'morwen-oil': { who: 'morwen', text: 'Her fen burned on “everlasting” oil a trader sold her. It would not go out.' },
  'morwen-moths': { who: 'morwen', text: 'Keeps moths in jars. Moths fly toward the Moth’s fire, so she follows them.' },
  'morwen-town': { who: 'morwen', text: 'Her moths always fly toward town, and she loses them among the lights.' },
  'morwen-warning': { who: 'morwen', text: 'Warned you that one of your own lies to you every single day.' },
  'gorrak-boasts': { who: 'gorrak', text: 'Speaks of himself as Gorrak, and laughs loudest when he’s losing.' },
  'gorrak-gold': { who: 'gorrak', text: 'His horde was paid in fresh gold, stamped with a moth, by a soft-voiced trader.' },
  'gorrak-wisdom': { who: 'gorrak', text: 'Says a man who fights for coin fights for nothing.' },
  'holt-twenty': { who: 'holt', text: 'Knows no kingdom has minted gold since the old king fell, twenty years ago.' },
  'holt-harrow': { who: 'holt', text: 'Carried the old king’s banner at Harrow Ford, and his shield at the very end.' },
  'holt-bird-son': { who: 'holt', text: 'Says his son carved the little bird, a long time ago.' },
  'holt-walks': { who: 'holt', text: 'Goes walking at night “to check the sentries,” away from the sentry lines.' },
}

export const SPEAKER_NAMES: Record<Exclude<Speaker, 'narrator' | 'hero'>, string> = {
  holt: 'Sergeant Holt',
  brannoc: 'Brannoc',
  wick: 'Wick',
  mordrake: 'Baron Mordrake',
  morwen: 'Morwen',
  gorrak: 'Gorrak',
}

/** The faces of the people the hero meets, drawn with the same parts as heroes. Wick has his own portrait. */
const BASE_LOOKS: Record<DrawnCharacter, Appearance> = {
  holt: {
    race: 'human',
    skin: 'tan',
    hairStyle: 'bald',
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
  mordrake: {
    race: 'human',
    skin: 'fair',
    hairStyle: 'long',
    hairColor: 'silver',
    eyes: 'blue',
    outfit: 'black-plate',
    outfitColor: 'midnight',
    hat: 'crown',
    heldItem: 'none',
  },
  morwen: {
    race: 'human',
    skin: 'ashen',
    hairStyle: 'long',
    hairColor: 'crimson',
    eyes: 'ember',
    outfit: 'robe',
    outfitColor: 'onyx',
    hat: 'none',
    heldItem: 'none',
  },
  gorrak: {
    race: 'orc',
    skin: 'orc',
    hairStyle: 'topknot',
    hairColor: 'black',
    eyes: 'amber',
    outfit: 'armor',
    outfitColor: 'crimson',
    hat: 'none',
    heldItem: 'none',
  },
}

/**
 * What makes each recurring character recognisable at a glance.
 * Holt: a gruff old sergeant with a blind eye and a pipe, who counts everything and calls the hero Captain.
 * Brannoc: a gaunt, sardonic deserter with one ear, forever flipping the last coin the old king paid him.
 * Mordrake: a proud, paranoid old baron in black plate and furs, gracious in defeat, who knows he was played.
 * Morwen, the Ash Witch: sharp-tongued, grieving, proud; soot on her face and robe, never without her jar of moths.
 * Gorrak: a huge, booming orc warlord who talks about himself as Gorrak and laughs loudest when he's losing.
 */
const BASE_FEATURES: Record<DrawnCharacter, CharacterFeatures> = {
  holt: { weathered: true, blindEye: true, moustache: true, pipe: true, broad: true, carving: true },
  brannoc: { missingEar: true, stubble: true, eyeBags: true, worn: true, bandage: true, patched: true },
  mordrake: { weathered: true, beard: true, furMantle: true, broad: true },
  morwen: { soot: true },
  gorrak: { broad: true, warPaint: true, greatAxe: true },
}

/**
 * How a character looks given where they stand with the hero. Brannoc, once he joins the hero, wears the hero's
 * crimson and carries a sword again; later chapters can add more changes here as the characters' stories move on.
 */
export function characterLook(who: DrawnCharacter, state: CharacterState): { appearance: Appearance; features: CharacterFeatures } {
  const appearance = BASE_LOOKS[who]
  const features = BASE_FEATURES[who]
  if (who === 'brannoc' && state.standing === 'ally') {
    return { appearance: { ...appearance, outfitColor: 'crimson', heldItem: 'sword' }, features: { ...features, patched: false } }
  }
  return { appearance, features }
}

/** The little habits each character falls into while others talk. */
export const MANNERISMS: Partial<Record<Actor, 'pipe-smoke' | 'coin-flip' | 'moth-jar'>> = { holt: 'pipe-smoke', brannoc: 'coin-flip', morwen: 'moth-jar' }
