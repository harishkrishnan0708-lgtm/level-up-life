import { HERO_CLASSES, isGameState, newGame, startDay, type GameState, type HeroClass } from './game'
import { newPetState, sanitizePets, type PetState } from './pets'
import { newWarRecord, type WarRecord } from './raids'
import { sanitizeWarRecord } from './siege'
import { newQuestPlan, sanitizeQuestPlan, type QuestPlan } from './questPlan'
import { newStoryState, sanitizeStoryState, type StoryState } from './story'
import { closeDays, newStreakState, sanitizeStreak, type StreakState } from './streak'
import { newHoldings, sanitizeHoldings, type GearSlot, type Holdings } from './wares'

export interface Option<Id extends string = string> {
  id: Id
  label: string
  /** Swatch color for color options. */
  color?: string
  /** Gear that must be bought from the merchant before it can be worn. Its id matches the shop item's id. */
  premium?: boolean
}

export const RACES = [
  { id: 'human', label: 'Human' },
  { id: 'elf', label: 'Elf' },
  { id: 'orc', label: 'Orc' },
  { id: 'dwarf', label: 'Dwarf' },
  { id: 'dragonborn', label: 'Dragonborn' },
  { id: 'tiefling', label: 'Tiefling' },
] as const satisfies readonly Option[]

export type Race = (typeof RACES)[number]['id']

/** A line about each race, and the skin tone picked for you when you choose it (you can still change it). */
export const RACE_INFO: Record<Race, { blurb: string; skin: IdOf<typeof SKIN_TONES> }> = {
  human: { blurb: 'Adaptable and stubborn', skin: 'fair' },
  elf: { blurb: 'Graceful, long-lived, sharp of ear', skin: 'porcelain' },
  orc: { blurb: 'Tusked, fierce, and loyal', skin: 'orc' },
  dwarf: { blurb: 'Stout, bearded, unbreakable', skin: 'tan' },
  dragonborn: { blurb: 'Scaled and horned, fire in the blood', skin: 'bronze' },
  tiefling: { blurb: 'Horned heirs of an infernal pact', skin: 'crimson' },
}

export const SKIN_TONES = [
  { id: 'porcelain', label: 'Porcelain', color: '#f3d9c6' },
  { id: 'fair', label: 'Fair', color: '#e6b994' },
  { id: 'olive', label: 'Olive', color: '#c4966a' },
  { id: 'tan', label: 'Tan', color: '#a36c45' },
  { id: 'brown', label: 'Brown', color: '#774a2c' },
  { id: 'deep', label: 'Deep', color: '#4b2d1d' },
  { id: 'ashen', label: 'Ashen', color: '#9aa2a6' },
  { id: 'orc', label: 'Orc green', color: '#7a9a4a' },
  { id: 'moss', label: 'Grey-green', color: '#8a9a7a' },
  { id: 'crimson', label: 'Crimson', color: '#b0473e' },
  { id: 'violet', label: 'Violet', color: '#8a6aa8' },
  { id: 'bronze', label: 'Dragon bronze', color: '#b07a3a' },
  { id: 'jade', label: 'Jade', color: '#4a8a6a' },
] as const satisfies readonly Option[]

export const HAIR_STYLES = [
  { id: 'short', label: 'Short' },
  { id: 'spiky', label: 'Wild' },
  { id: 'long', label: 'Long' },
  { id: 'mohawk', label: 'Mohawk' },
  { id: 'topknot', label: 'Topknot' },
  { id: 'bald', label: 'Bald' },
] as const satisfies readonly Option[]

export const HAIR_COLORS = [
  { id: 'black', label: 'Raven', color: '#1b1512' },
  { id: 'brown', label: 'Chestnut', color: '#4a2e1d' },
  { id: 'auburn', label: 'Auburn', color: '#7d2f1b' },
  { id: 'blond', label: 'Gold', color: '#c9a05a' },
  { id: 'silver', label: 'Silver', color: '#c8c8cc' },
  { id: 'crimson', label: 'Blood', color: '#8e1b1b' },
] as const satisfies readonly Option[]

export const EYE_COLORS = [
  { id: 'brown', label: 'Brown', color: '#5a3a22' },
  { id: 'blue', label: 'Frost', color: '#4a86c8' },
  { id: 'green', label: 'Moss', color: '#3f8a4f' },
  { id: 'amber', label: 'Amber', color: '#d08e2a' },
  { id: 'violet', label: 'Violet', color: '#8a55c8' },
  { id: 'ember', label: 'Ember', color: '#e2412e' },
] as const satisfies readonly Option[]

export const OUTFIT_STYLES = [
  { id: 'armor', label: 'Armor' },
  { id: 'robe', label: 'Robe' },
  { id: 'cloak', label: 'Cloak' },
  { id: 'black-plate', label: 'Blackened plate', premium: true },
] as const satisfies readonly Option[]

export const OUTFIT_COLORS = [
  { id: 'crimson', label: 'Crimson', color: '#6e1414' },
  { id: 'midnight', label: 'Midnight', color: '#1f2747' },
  { id: 'forest', label: 'Forest', color: '#1f3d28' },
  { id: 'bone', label: 'Bone', color: '#a99a7c' },
  { id: 'plum', label: 'Plum', color: '#442142' },
  { id: 'onyx', label: 'Onyx', color: '#33313b' },
] as const satisfies readonly Option[]

export const HATS = [
  { id: 'none', label: 'None' },
  { id: 'pointed', label: 'Sorcerer hat' },
  { id: 'helm', label: 'Great helm' },
  { id: 'crown', label: 'Thorn crown' },
  { id: 'plague-mask', label: 'Plague mask', premium: true },
  { id: 'horned-helm', label: 'Horned helm', premium: true },
  { id: 'ember-crown', label: 'Crown of Embers', premium: true },
] as const satisfies readonly Option[]

export const HELD_ITEMS = [
  { id: 'none', label: 'None' },
  { id: 'wand', label: 'Wand' },
  { id: 'staff', label: 'Staff' },
  { id: 'sword', label: 'Sword' },
  { id: 'lantern', label: 'Lantern', premium: true },
  { id: 'flame-sword', label: 'Flaming sword', premium: true },
  { id: 'scythe', label: 'Reaper’s scythe', premium: true },
] as const satisfies readonly Option[]

export const HERO_TITLES = [
  { id: '', label: 'No title' },
  { id: 'the Unbroken', label: 'the Unbroken' },
  { id: 'the Ashborn', label: 'the Ashborn' },
  { id: 'the Exiled', label: 'the Exiled' },
  { id: 'the Relentless', label: 'the Relentless' },
  { id: 'the Grim', label: 'the Grim' },
  { id: 'the Oathbreaker', label: 'the Oathbreaker' },
] as const satisfies readonly Option[]

type IdOf<Options extends readonly Option[]> = Options[number]['id']

export interface Appearance {
  race: Race
  skin: IdOf<typeof SKIN_TONES>
  hairStyle: IdOf<typeof HAIR_STYLES>
  hairColor: IdOf<typeof HAIR_COLORS>
  eyes: IdOf<typeof EYE_COLORS>
  outfit: IdOf<typeof OUTFIT_STYLES>
  outfitColor: IdOf<typeof OUTFIT_COLORS>
  hat: IdOf<typeof HATS>
  heldItem: IdOf<typeof HELD_ITEMS>
}

const APPEARANCE_OPTIONS: { [Key in keyof Appearance]: readonly Option<Appearance[Key]>[] } = {
  race: RACES,
  skin: SKIN_TONES,
  hairStyle: HAIR_STYLES,
  hairColor: HAIR_COLORS,
  eyes: EYE_COLORS,
  outfit: OUTFIT_STYLES,
  outfitColor: OUTFIT_COLORS,
  hat: HATS,
  heldItem: HELD_ITEMS,
}

export const DEFAULT_APPEARANCE: Appearance = {
  race: 'human',
  skin: 'fair',
  hairStyle: 'short',
  hairColor: 'black',
  eyes: 'brown',
  outfit: 'armor',
  outfitColor: 'crimson',
  hat: 'none',
  heldItem: 'none',
}

/** Options for the parts of a hero that gear can replace. */
export const GEAR_SLOT_OPTIONS: Record<GearSlot, readonly Option[]> = {
  hat: HATS,
  heldItem: HELD_ITEMS,
  outfit: OUTFIT_STYLES,
}

/** Whether a hero who owns `ownedGear` may wear this option. */
export function isWearable(option: Option, ownedGear: readonly string[]): boolean {
  return !option.premium || ownedGear.includes(option.id)
}

/**
 * The hair style that can actually be seen: a closed great helm hides all of it, and a hood hides anything
 * that would stick up through it (spikes, a topknot, a mohawk crest), leaving only the fringe.
 */
export function visibleHairStyle(appearance: Appearance): Appearance['hairStyle'] | null {
  if (appearance.hat === 'helm') {
    return null
  }
  const hooded = appearance.outfit === 'cloak' && appearance.hat === 'none'
  if (hooded && (appearance.hairStyle === 'spiky' || appearance.hairStyle === 'topknot')) {
    return 'short'
  }
  if (hooded && appearance.hairStyle === 'mohawk') {
    return 'bald'
  }
  return appearance.hairStyle
}

/** Looks up the swatch color for an option id. */
export function colorOf(options: readonly Option[], id: string): string {
  return options.find((option) => option.id === id)?.color ?? '#888888'
}

export const NAME_MAX_LENGTH = 20
export const BACKSTORY_MAX_LENGTH = 200

export interface Hero {
  id: string
  name: string
  title: IdOf<typeof HERO_TITLES>
  backstory: string
  heroClass: HeroClass
  appearance: Appearance
  game: GameState
  /** Buildings, potions, and today's purchases from the merchant. */
  holdings: Holdings
  /** Eggs being warmed and pets hatched. */
  pets: PetState
  /** Raids against rival kingdoms. */
  war: WarRecord
  /** Chapters of the Chronicle read, and the choices made in them. */
  story: StoryState
  /** Which days each quest is on, and the quests the hero added. */
  plan: QuestPlan
  /** How each recent day went, for the streak. */
  streak: StreakState
}

/** Everything the player chooses on the character screen. */
export type HeroDraft = Omit<Hero, 'id' | 'game' | 'holdings' | 'pets' | 'war' | 'story' | 'plan' | 'streak'>

export function newHeroDraft(): HeroDraft {
  return { name: '', title: '', backstory: '', heroClass: 'warrior', appearance: { ...DEFAULT_APPEARANCE } }
}

export function draftOf(hero: Hero): HeroDraft {
  return { name: hero.name, title: hero.title, backstory: hero.backstory, heroClass: hero.heroClass, appearance: hero.appearance }
}

/** Returns a message explaining what is wrong with the name, or null if it is fine. */
export function validateHeroName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return 'Your hero needs a name.'
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Keep the name to ${NAME_MAX_LENGTH} characters or fewer.`
  }
  return null
}

/** "Orc Warrior", "Elf Mage", and so on. */
export function raceAndClass(hero: Pick<Hero, 'appearance' | 'heroClass'>): string {
  const race = RACES.find((option) => option.id === hero.appearance.race)?.label ?? 'Human'
  return `${race} ${HERO_CLASSES.find((info) => info.id === hero.heroClass)?.name ?? ''}`.trim()
}

export function displayName(hero: Pick<Hero, 'name' | 'title'>): string {
  return hero.title ? `${hero.name} ${hero.title}` : hero.name
}

export interface Roster {
  activeHeroId: string | null
  heroes: Hero[]
}

export const EMPTY_ROSTER: Roster = { activeHeroId: null, heroes: [] }

export function activeHero(roster: Roster): Hero | null {
  return roster.heroes.find((hero) => hero.id === roster.activeHeroId) ?? null
}

function makeHeroId(): string {
  // crypto.randomUUID is unavailable on plain-http LAN addresses, which is how the app is tried on a phone.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function cleanDraft(draft: HeroDraft): HeroDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    backstory: draft.backstory.trim().slice(0, BACKSTORY_MAX_LENGTH),
  }
}

/** Adds a new hero and makes it the active one. */
export function addHero(roster: Roster, draft: HeroDraft, game: GameState): Roster {
  const hero: Hero = { ...cleanDraft(draft), id: makeHeroId(), game, holdings: newHoldings(game.day), pets: newPetState(), war: newWarRecord(), story: newStoryState(), plan: newQuestPlan(), streak: newStreakState() }
  return { activeHeroId: hero.id, heroes: [...roster.heroes, hero] }
}

export function editHero(roster: Roster, heroId: string, draft: HeroDraft): Roster {
  return {
    ...roster,
    heroes: roster.heroes.map((hero) => (hero.id === heroId ? { ...hero, ...cleanDraft(draft) } : hero)),
  }
}

export function setHeroProgress(roster: Roster, heroId: string, progress: Partial<Pick<Hero, 'game' | 'holdings' | 'pets' | 'war' | 'story' | 'plan' | 'streak'>>): Roster {
  return { ...roster, heroes: roster.heroes.map((hero) => (hero.id === heroId ? { ...hero, ...progress } : hero)) }
}

/** Puts on a piece of gear the hero owns, replacing whatever was in that slot. */
export function equipGear(roster: Roster, heroId: string, slot: GearSlot, optionId: string): Roster {
  return {
    ...roster,
    heroes: roster.heroes.map((hero) => {
      const option = GEAR_SLOT_OPTIONS[slot].find((candidate) => candidate.id === optionId)
      if (hero.id !== heroId || !option || !isWearable(option, hero.holdings.gear)) {
        return hero
      }
      return { ...hero, appearance: { ...hero.appearance, [slot]: optionId } }
    }),
  }
}

export function switchHero(roster: Roster, heroId: string): Roster {
  return roster.heroes.some((hero) => hero.id === heroId) ? { ...roster, activeHeroId: heroId } : roster
}

/** When the day has changed, closes out each hero's past days for their streak and resets their quests. */
export function startRosterDay(roster: Roster, today: string): Roster {
  const heroes = roster.heroes.map((hero) => {
    const game = startDay(hero.game, today)
    if (game === hero.game) {
      return hero
    }
    const closed = closeDays(hero.streak, hero.game, hero.plan, today, hero.holdings.candles)
    const holdings = closed.candles === hero.holdings.candles ? hero.holdings : { ...hero.holdings, candles: closed.candles }
    return { ...hero, game, streak: closed.streak, holdings }
  })
  return heroes.every((hero, index) => hero === roster.heroes[index]) ? roster : { ...roster, heroes }
}

const ROSTER_KEY = 'level-up-life/roster'
/** Where milestone 1 saved progress, before there were heroes. */
const LEGACY_GAME_KEY = 'level-up-life/game'

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>

function pickOption<Id extends string>(options: readonly Option<Id>[], value: unknown, fallback: Id): Id {
  return options.find((option) => option.id === value)?.id ?? fallback
}

/** Rebuilds an appearance from saved data; unknown options, or gear the hero doesn't own, fall back to defaults. */
function sanitizeAppearance(value: unknown, ownedGear: readonly string[]): Appearance {
  const saved = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const appearance = { ...DEFAULT_APPEARANCE }
  for (const key of Object.keys(APPEARANCE_OPTIONS) as (keyof Appearance)[]) {
    const options = (APPEARANCE_OPTIONS[key] as readonly Option[]).filter((option) => isWearable(option, ownedGear))
    ;(appearance as Record<keyof Appearance, string>)[key] = pickOption(options, saved[key], DEFAULT_APPEARANCE[key])
  }
  return appearance
}

/** Rebuilds a hero from saved data, or returns null if it is too damaged to use. */
function sanitizeHero(value: unknown, today: string): Hero | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const saved = value as Record<string, unknown>
  if (typeof saved.id !== 'string' || typeof saved.name !== 'string' || validateHeroName(saved.name) || !isGameState(saved.game)) {
    return null
  }
  const holdings = sanitizeHoldings(saved.holdings, today)
  return {
    id: saved.id,
    name: saved.name.trim(),
    title: pickOption(HERO_TITLES, saved.title, ''),
    backstory: typeof saved.backstory === 'string' ? saved.backstory.slice(0, BACKSTORY_MAX_LENGTH) : '',
    heroClass: pickOption(HERO_CLASSES.map(({ id, name }) => ({ id, label: name })), saved.heroClass, 'warrior'),
    appearance: sanitizeAppearance(saved.appearance, holdings.gear),
    game: saved.game,
    holdings,
    pets: sanitizePets(saved.pets),
    war: sanitizeWarRecord(saved.war),
    story: sanitizeStoryState(saved.story),
    plan: sanitizeQuestPlan(saved.plan),
    streak: sanitizeStreak(saved.streak),
  }
}

function readJson(store: KeyValueStore, key: string): unknown {
  try {
    return JSON.parse(store.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

/** Loads every saved hero, skipping any that are damaged. */
export function loadRoster(store: KeyValueStore, today: string): Roster {
  return sanitizeRoster(readJson(store, ROSTER_KEY), today)
}

/** Rebuilds a roster from saved data (or a backup file), dropping any hero too damaged to use. */
export function sanitizeRoster(saved: unknown, today: string): Roster {
  if (typeof saved !== 'object' || saved === null || !Array.isArray((saved as Roster).heroes)) {
    return EMPTY_ROSTER
  }
  const heroes = (saved as Roster).heroes.map((hero) => sanitizeHero(hero, today)).filter((hero): hero is Hero => hero !== null)
  const savedActiveId = (saved as Roster).activeHeroId
  const activeHeroId = heroes.some((hero) => hero.id === savedActiveId) ? savedActiveId : (heroes[0]?.id ?? null)
  return startRosterDay({ activeHeroId, heroes }, today)
}

/** Progress for the first hero: whatever milestone 1 saved, so nobody loses XP they already earned. */
export function startingGame(store: KeyValueStore, roster: Roster, today: string): GameState {
  const legacy = readJson(store, LEGACY_GAME_KEY)
  return roster.heroes.length === 0 && isGameState(legacy) ? startDay(legacy, today) : newGame(today)
}

export function saveRoster(store: KeyValueStore, roster: Roster): boolean {
  try {
    store.setItem(ROSTER_KEY, JSON.stringify(roster))
    return true
  } catch {
    return false
  }
}
