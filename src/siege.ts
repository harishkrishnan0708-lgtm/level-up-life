import { rivalById, type OpeningMove, type RaidOutcome, type Rival, type WarRecord } from './raids'

export type Phase = 'approach' | 'encircle' | 'bombard' | 'assault' | 'keep'

export const PHASES: readonly { id: Phase; name: string }[] = [
  { id: 'approach', name: 'Approach' },
  { id: 'encircle', name: 'Encircle' },
  { id: 'bombard', name: 'Bombard' },
  { id: 'assault', name: 'Assault' },
  { id: 'keep', name: 'The keep' },
]

export type Section = 'gate' | 'walls' | 'towers'
export type Tone = 'good' | 'bad' | 'neutral'

export interface LogEntry {
  day: number
  text: string
  tone: Tone
}

export interface Army {
  troops: number
  startTroops: number
  morale: number
  /** Days of food left. */
  supplies: number
  /** Trebuchets built. */
  engines: number
}

export interface Defenders {
  garrison: number
  gate: number
  walls: number
  towers: number
  morale: number
  supplies: number
  /** How ready they are for you, 0 to 100. Makes mines and traitors riskier. */
  alert: number
}

/** What the scouts believe about the defenders; only as good as the scouts. */
export type Estimates = Omit<Defenders, 'alert'>

export type EventId = 'relief-warning' | 'relief-arrives' | 'sally' | 'disease' | 'traitor' | 'deserters' | 'storm' | 'surrender-offer'

export interface SiegeFlags {
  scouted: boolean
  informed: boolean
  foragedOnApproach: boolean
  blockade: boolean
  camp: boolean
  sallyPortKnown: boolean
  sallyPortUsed: boolean
  traitorGate: boolean
  traitorOffered: boolean
  rallied: boolean
  reliefWarned: boolean
  reliefDefeated: boolean
  forageCount: number
  minesDug: number
  mineDiscovered: boolean
  /** The day you last asked for their surrender; once a day is enough. */
  lastParleyDay: number
  lastSurrenderOfferDay: number
  hungryEnemyDays: number
}

export interface SiegeOutcome {
  kind: RaidOutcome
  loot: number
  summary: string
}

export type CoinFace = 'heads' | 'tails'

/** The opening coin toss: whoever wins it moves first. */
export interface CoinToss {
  call: CoinFace
  landed: CoinFace
}

export interface Siege {
  rivalId: string
  /** The tutorial siege: it doesn't use up the day's raid or count toward the war record. */
  practice: boolean
  /** Null until the coin is tossed; no orders can be given before then. */
  coin: CoinToss | null
  phase: Phase
  day: number
  army: Army
  enemy: Defenders
  estimates: Estimates
  accuracy: number
  /** The section the defenders shored up after your last bombardment. */
  reinforced: Section | null
  /** Progress over the walls during the assault, 0 to 100. */
  foothold: number
  flags: SiegeFlags
  event: EventId | null
  log: LogEntry[]
  outcome: SiegeOutcome | null
  decisions: number
}

export type Random = () => number

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

/** Scales a value by a random factor between 1 - spread and 1 + spread. */
const vary = (value: number, spread: number, random: Random) => value * (1 - spread + 2 * spread * random())

function rivalOf(siege: Siege): Rival {
  const rival = rivalById(siege.rivalId)
  if (!rival) {
    throw new Error(`Unknown rival ${siege.rivalId}`)
  }
  return rival
}

function addLog(siege: Siege, text: string, tone: Tone = 'neutral'): Siege {
  return { ...siege, log: [...siege.log, { day: siege.day, text, tone }] }
}

/** New scout reports: close to the truth when scouts are good, wildly off when they are not. */
function scoutEstimates(enemy: Defenders, accuracy: number, random: Random): Estimates {
  const error = 1 - accuracy
  const guess = (value: number, range: number) => Math.max(0, Math.round(value + (random() * 2 - 1) * error * range))
  return {
    garrison: guess(enemy.garrison, enemy.garrison * 0.8),
    gate: clamp(guess(enemy.gate, 60), 0, 100),
    walls: clamp(guess(enemy.walls, 60), 0, 100),
    towers: clamp(guess(enemy.towers, 60), 0, 100),
    morale: clamp(guess(enemy.morale, 60), 0, 100),
    supplies: guess(enemy.supplies, 10),
  }
}

function exactEstimates(enemy: Defenders): Estimates {
  const { garrison, gate, walls, towers, morale, supplies } = enemy
  return { garrison, gate, walls, towers, morale, supplies }
}

export interface SiegeSetup {
  rival: Rival
  might: number
  accuracy: number
  engines: number
  practice?: boolean
}

export function startSiege({ rival, might, accuracy, engines, practice = false }: SiegeSetup, random: Random): Siege {
  const troops = 60 + 10 * might
  const enemy: Defenders = {
    garrison: rival.garrison,
    gate: rival.gate,
    walls: rival.walls,
    towers: rival.towers,
    morale: rival.morale,
    supplies: rival.supplies,
    alert: 20,
  }
  return {
    rivalId: rival.id,
    practice,
    coin: null,
    phase: 'approach',
    day: 0,
    army: { troops, startTroops: troops, morale: 70, supplies: 10, engines },
    enemy,
    // Before anyone has looked, guesses are only half as good as the scouts.
    estimates: scoutEstimates(enemy, accuracy / 2, random),
    accuracy,
    reinforced: null,
    foothold: 0,
    flags: {
      scouted: false,
      informed: false,
      foragedOnApproach: false,
      blockade: false,
      camp: false,
      sallyPortKnown: false,
      sallyPortUsed: false,
      traitorGate: false,
      traitorOffered: false,
      rallied: false,
      reliefWarned: false,
      reliefDefeated: false,
      forageCount: 0,
      minesDug: 0,
      mineDiscovered: false,
      lastParleyDay: -1,
      lastSurrenderOfferDay: -1,
      hungryEnemyDays: 0,
    },
    event: null,
    log: [{ day: 0, text: `Your army of ${troops} gathers on the road to ${rival.name}'s lands.`, tone: 'neutral' }],
    outcome: null,
    decisions: 0,
  }
}

// ── Strength ────────────────────────────────────────────────────────────────

/** Your fighting power against theirs. Above 1 you have the edge. */
export function strengthRatio(siege: Siege, includeTowers = true): number {
  const { army, enemy } = siege
  const power = army.troops * (0.5 + army.morale / 100)
  const towers = includeTowers ? 0.6 + enemy.towers / 200 : 0.8
  const defense = Math.max(1, enemy.garrison) * towers * (0.5 + enemy.morale / 100)
  return clamp(power / defense, 0.25, 2.5)
}

function loseTroops(siege: Siege, fraction: number): Siege {
  const lost = Math.max(1, Math.round(siege.army.troops * fraction))
  return { ...siege, army: { ...siege.army, troops: Math.max(0, siege.army.troops - lost) } }
}

function changeMorale(siege: Siege, amount: number): Siege {
  return { ...siege, army: { ...siege.army, morale: clamp(siege.army.morale + amount, 0, 100) } }
}

function changeEnemy(siege: Siege, changes: Partial<Defenders>): Siege {
  const enemy = { ...siege.enemy, ...changes }
  return {
    ...siege,
    enemy: {
      ...enemy,
      garrison: Math.max(0, Math.round(enemy.garrison)),
      gate: clamp(Math.round(enemy.gate), 0, 100),
      walls: clamp(Math.round(enemy.walls), 0, 100),
      towers: clamp(Math.round(enemy.towers), 0, 100),
      morale: clamp(Math.round(enemy.morale), 0, 100),
      supplies: Math.max(0, Math.round(enemy.supplies)),
      alert: clamp(Math.round(enemy.alert), 0, 100),
    },
  }
}

function lootFor(rival: Rival, share: number): number {
  return Math.round(rival.loot * share)
}

function finish(siege: Siege, kind: RaidOutcome, loot: number, summary: string): Siege {
  return { ...siege, outcome: { kind, loot, summary }, event: null }
}

/** Your army breaks if it loses too many soldiers or all heart for the fight. */
function checkCollapse(siege: Siege): Siege {
  if (siege.outcome) {
    return siege
  }
  if (siege.army.troops < siege.army.startTroops * 0.3) {
    return finish(siege, 'defeat', 0, 'Too few of your soldiers are left standing. The survivors limp home.')
  }
  if (siege.army.morale <= 0) {
    return finish(siege, 'defeat', 0, 'Your army has lost all heart. In the night, they desert you.')
  }
  return siege
}

// ── Time passing ─────────────────────────────────────────────────────────────

function passOneDay(start: Siege, random: Random): Siege {
  let siege: Siege = { ...start, day: start.day + 1 }
  const rival = rivalOf(siege)

  // Your army eats.
  const supplies = siege.army.supplies - 1
  siege = { ...siege, army: { ...siege.army, supplies: Math.max(0, supplies) } }
  if (supplies < 0) {
    siege = changeMorale(loseTroops(siege, 0.04), -10)
    siege = addLog(siege, 'Your camp has run out of food. Soldiers go hungry, and some slip away.', 'bad')
  }

  // So do they, faster under a blockade.
  const enemySupplies = siege.enemy.supplies - (siege.flags.blockade ? 2 : 1)
  siege = changeEnemy(siege, { supplies: enemySupplies })
  if (enemySupplies <= 0) {
    siege = changeEnemy(siege, { morale: siege.enemy.morale - 8 })
    siege = { ...siege, flags: { ...siege.flags, hungryEnemyDays: siege.flags.hungryEnemyDays + 1 } }
  }

  // At night they patch whatever they can while they still have food and hands.
  if (siege.enemy.supplies > 0 && (siege.phase === 'encircle' || siege.phase === 'bombard')) {
    siege = changeEnemy(siege, {
      gate: Math.min(rival.gate, siege.enemy.gate + 3),
      walls: Math.min(rival.walls, siege.enemy.walls + 2),
      towers: Math.min(rival.towers, siege.enemy.towers + 4),
    })
  }

  return { ...siege, estimates: scoutEstimates(siege.enemy, siege.accuracy, random) }
}

/** Something happens in the night that needs your decision (or just your attention). */
function rollEvent(siege: Siege, random: Random): EventId | null {
  const rival = rivalOf(siege)
  const { flags, enemy, army, day } = siege
  const besieging = siege.phase !== 'approach' && siege.phase !== 'keep'

  if (besieging && !flags.reliefDefeated && day >= rival.reliefDay) {
    return 'relief-arrives'
  }
  if (besieging && !flags.reliefWarned && !flags.reliefDefeated && day >= rival.reliefDay - 3) {
    return 'relief-warning'
  }
  if ((enemy.morale <= 15 || flags.hungryEnemyDays >= 3) && day - flags.lastSurrenderOfferDay >= 2) {
    return 'surrender-offer'
  }
  if (besieging && random() < rival.sallyChance) {
    return 'sally'
  }
  if (day >= 6 && random() < 0.1 + (army.supplies < 3 ? 0.2 : 0)) {
    return 'disease'
  }
  if (besieging && !flags.traitorOffered && enemy.morale < 55 && random() < 0.25) {
    return 'traitor'
  }
  if ((enemy.supplies < 4 || enemy.morale < 40) && random() < 0.25) {
    return 'deserters'
  }
  if (army.engines > 0 && siege.phase === 'bombard' && random() < 0.07) {
    return 'storm'
  }
  return null
}

function passDays(siege: Siege, days: number, random: Random): Siege {
  let current = siege
  for (let day = 0; day < days && !current.outcome; day++) {
    current = checkCollapse(passOneDay(current, random))
  }
  if (current.outcome || current.event) {
    return current
  }
  const event = rollEvent(current, random)
  return event ? { ...current, event } : current
}

// ── Actions ──────────────────────────────────────────────────────────────────

export interface SiegeAction {
  id: string
  label: string
  /** What it costs: time, supplies, coins, risk. */
  detail: string
  coinCost?: number
  /** Shown apart from the other orders, since it ends the siege. */
  retreat?: boolean
}

/** Days of food the next foraging trip brings back: less each time, as the land is stripped bare. */
export function forageYield(siege: Siege): number {
  return Math.max(1, 3 - siege.flags.forageCount)
}

function surrenderChance(siege: Siege): number {
  const ratio = strengthRatio(siege)
  return clamp((50 - siege.enemy.morale) / 80 + (ratio - 1) * 0.15, 0.02, 0.8)
}

function termsChance(siege: Siege): number {
  const ratio = strengthRatio(siege, false)
  return clamp(0.2 + (60 - siege.enemy.morale) / 100 + (ratio - 1) * 0.25, 0.05, 0.9)
}

/** Your chance of beating the relief army in open battle: about as large as their garrison, with no walls to help. */
export function reliefBattleChance(siege: Siege): number {
  const power = siege.army.troops * (0.5 + siege.army.morale / 100)
  const relief = rivalOf(siege).garrison * 0.9 * 1.2
  return clamp(power / relief - 0.3, 0.1, 0.9)
}

function stormKeepChance(siege: Siege): number {
  return clamp(strengthRatio(siege, false) * 0.5, 0.15, 0.95)
}

const percent = (chance: number) => `${Math.round(chance * 100)}%`

const RETREAT: SiegeAction = { id: 'retreat', label: 'Sound the retreat', detail: 'End the siege with nothing won or lost', retreat: true }

/** The orders you can give right now. None until the coin has been tossed. */
export function availableActions(siege: Siege): SiegeAction[] {
  if (siege.outcome || siege.event || !siege.coin) {
    return []
  }
  const rival = rivalOf(siege)
  const { flags, army } = siege
  const actions: SiegeAction[] = []

  switch (siege.phase) {
    case 'approach':
      if (!flags.scouted) {
        actions.push({ id: 'scout', label: 'Send scouts ahead', detail: 'Fresh reports on their defences · −1 supplies' })
      }
      if (!flags.informed) {
        actions.push({
          id: 'informant',
          label: 'Bribe an informant',
          detail: `The exact truth, and a secret way in · ${rival.informantCost} coins`,
          coinCost: rival.informantCost,
        })
      }
      if (!flags.foragedOnApproach) {
        actions.push({ id: 'forage-approach', label: 'Forage on the way', detail: '+3 supplies · they may hear you coming' })
      }
      actions.push(
        { id: 'road', label: 'March by the king’s road', detail: 'Arrive tomorrow · they will see you coming' },
        { id: 'forest', label: 'March through the forest', detail: 'Arrive in 3 days · −2 supplies · catch them off guard' },
        { id: 'river', label: 'Take barges down the river', detail: 'Arrive in 2 days · no food eaten · storms are a risk' },
      )
      break

    case 'encircle':
    case 'bombard':
      if (siege.phase === 'bombard') {
        actions.push(
          { id: 'fire-gate', label: 'Bombard the gate', detail: `${army.engines} trebuchet${army.engines === 1 ? '' : 's'} · 1 day` },
          { id: 'fire-walls', label: 'Bombard the walls', detail: 'Open a breach to storm · 1 day' },
          { id: 'fire-towers', label: 'Bombard the towers', detail: 'Fewer archers when you assault · 1 day' },
          { id: 'fire-granary', label: 'Fire on the granary', detail: 'Burn their food and their nerve · 1 day' },
        )
        if (!flags.mineDiscovered && flags.minesDug < 3) {
          actions.push({
            id: 'mine',
            label: flags.minesDug === 0 ? 'Dig a mine under the walls' : `Keep digging the mine (${flags.minesDug}/3)`,
            detail: '3 days of digging brings a wall down · may be discovered',
          })
        }
      } else {
        if (!flags.blockade) {
          actions.push({ id: 'blockade', label: 'Blockade every road', detail: 'Their food runs out twice as fast · 1 day' })
        }
        if (!flags.camp) {
          actions.push({ id: 'camp', label: 'Fortify your camp', detail: 'Stakes and ditches against night raids · +10 morale · 1 day' })
        }
      }
      if (army.engines < 3) {
        actions.push({ id: 'build', label: 'Build a trebuchet', detail: `${army.engines} built · 2 days · −1 extra supplies` })
      }
      actions.push({
        id: 'forage',
        label: 'Forage the countryside',
        detail: `+${forageYield(siege)} supplies · 1 day`,
      })
      if (flags.lastParleyDay !== siege.day) {
        actions.push({ id: 'parley', label: 'Demand their surrender', detail: `About ${percent(surrenderChance(siege))} they accept` })
      }
      if (siege.phase === 'encircle' && army.engines > 0) {
        actions.push({ id: 'begin-bombard', label: 'Begin the bombardment', detail: 'Move to the next phase' })
      }
      actions.push({ id: 'begin-assault', label: 'Launch the assault', detail: 'No more waiting · storm the walls' })
      break

    case 'assault':
      actions.push({ id: 'ram', label: 'Ram the gate', detail: `Better the weaker the gate${flags.traitorGate ? ' · a traitor will lift the bar' : ''} · 1 day` })
      if (siege.enemy.walls < 40) {
        actions.push({ id: 'breach', label: 'Storm the breach', detail: 'Pour through the broken wall · 1 day' })
      }
      actions.push({ id: 'ladders', label: 'Scale the walls with ladders', detail: 'Bloody under tower fire, and hard against tall walls · 1 day' })
      if (flags.sallyPortKnown && !flags.sallyPortUsed) {
        actions.push({ id: 'sally-port', label: 'Slip in by the hidden sally port', detail: 'Your informant’s secret · works once · 1 day' })
      }
      if (!flags.rallied) {
        actions.push({ id: 'rally', label: 'Rally the troops', detail: 'A speech before the next wave · +15 morale · once' })
      }
      actions.push({ id: 'regroup', label: 'Pull back and regroup', detail: '+10 morale · lose some ground · 1 day' })
      break

    case 'keep':
      actions.push(
        { id: 'storm-keep', label: 'Storm the keep', detail: `About ${percent(stormKeepChance(siege))} to take it · full loot ${rival.loot}` },
        {
          id: 'terms',
          label: 'Offer them terms',
          detail: `About ${percent(termsChance(siege))} they accept · ${lootFor(rival, 0.75)} coins, no bloodshed`,
        },
        { id: 'plunder', label: 'Plunder and withdraw', detail: `Certain · ${lootFor(rival, 0.4)} coins` },
      )
      break
  }

  actions.push(RETREAT)
  return actions
}

function arrive(siege: Siege, days: number, random: Random): Siege {
  let arrived: Siege = { ...siege, phase: 'encircle' }
  for (let day = 0; day < days; day++) {
    arrived = passOneDay(arrived, random)
  }
  return addLog(arrived, `Your army arrives before the walls of ${rivalOf(siege).name}.`)
}

function bombard(siege: Siege, target: Section, random: Random): Siege {
  const base = { gate: 12, walls: 10, towers: 12 }[target]
  const shored = siege.reinforced === target
  const damage = Math.round(vary(siege.army.engines * base * (shored ? 0.6 : 1), 0.3, random))
  let next = changeEnemy(siege, { [target]: siege.enemy[target] - damage })
  next = addLog(
    next,
    `Your trebuchets pound the ${target} (−${damage}).${shored ? ' They had shored it up overnight, and it held better.' : ''}`,
    'good',
  )
  return { ...passDays(next, 1, random), reinforced: target }
}

interface AssaultTactic {
  effectiveness: number
  lossRate: number
  name: string
}

function assault(siege: Siege, tactic: AssaultTactic, random: Random): Siege {
  const ratio = strengthRatio(siege)
  const progress = Math.round(vary(45 * tactic.effectiveness * ratio, 0.25, random))
  const enemyLost = Math.round(siege.enemy.garrison * 0.12 * tactic.effectiveness * Math.min(ratio, 1.5))
  let next = loseTroops(siege, vary(tactic.lossRate, 0.25, random))
  const lost = siege.army.troops - next.army.troops
  next = changeEnemy(next, { garrison: siege.enemy.garrison - enemyLost, morale: siege.enemy.morale - progress / 5 })
  next = changeMorale(next, progress >= 25 ? 5 : -6)
  next = { ...next, foothold: Math.min(100, siege.foothold + progress) }
  next = addLog(
    next,
    `${tactic.name}: you gain ground (+${progress}), losing ${lost} soldiers; they lose ${enemyLost}.`,
    progress >= 25 ? 'good' : 'bad',
  )
  if (next.foothold >= 100) {
    next = addLog({ ...next, phase: 'keep' }, 'The walls are yours! The last defenders fall back into the keep.', 'good')
  }
  return passDays(checkCollapse(next), 1, random)
}

const OPENING_MOVES: Record<OpeningMove, { text: string; apply: (siege: Siege) => Siege }> = {
  spotted: {
    text: 'Their outriders spot your army gathering. They man the towers and bar the gates.',
    apply: (siege) => changeEnemy(siege, { alert: siege.enemy.alert + 25, towers: siege.enemy.towers + 10 }),
  },
  'shore-gate': {
    text: 'Warned of your coming, they pile timber and stone behind the gate.',
    apply: (siege) => changeEnemy(siege, { gate: siege.enemy.gate + 15 }),
  },
  'raid-supplies': {
    text: 'Raiders strike your supply wagons before you even set out. You lose 3 days of food.',
    apply: (siege) => ({ ...siege, army: { ...siege.army, supplies: Math.max(0, siege.army.supplies - 3) } }),
  },
  'ill-omens': {
    text: 'Crows circle your camp and the wells taste of ash. Whispers of a curse spread through the ranks.',
    apply: (siege) => changeMorale(siege, -10),
  },
}

/** You call heads or tails. Win and you give the first order; lose and the defender makes a move first. */
export function tossCoin(siege: Siege, call: CoinFace, random: Random): Siege {
  if (siege.coin) {
    return siege
  }
  const landed: CoinFace = random() < 0.5 ? 'heads' : 'tails'
  const tossed: Siege = { ...siege, coin: { call, landed } }
  if (landed === call) {
    return addLog(tossed, `The coin lands ${landed}. You have the initiative: the first move is yours.`, 'good')
  }
  const moves = rivalOf(siege).openingMoves
  const move = OPENING_MOVES[moves[Math.floor(random() * moves.length)]]
  return addLog(move.apply(addLog(tossed, `The coin lands ${landed}. The enemy moves first.`, 'bad')), move.text, 'bad')
}

/** Carries out an order. Coins for bribes are paid by the caller before this is called. */
export function takeAction(start: Siege, actionId: string, random: Random): Siege {
  if (start.outcome || start.event || !start.coin) {
    return start
  }
  const rival = rivalOf(start)
  let siege: Siege = { ...start, decisions: start.decisions + 1 }
  const { flags, army } = siege

  switch (actionId) {
    case 'scout':
      siege = { ...siege, army: { ...army, supplies: army.supplies - 1 }, flags: { ...flags, scouted: true } }
      siege = { ...siege, estimates: scoutEstimates(siege.enemy, siege.accuracy, random) }
      return addLog(siege, `Your scouts return with reports. Allies of ${rival.name} could arrive around day ${rival.reliefDay}.`)

    case 'informant':
      siege = { ...siege, estimates: exactEstimates(siege.enemy), flags: { ...flags, informed: true, sallyPortKnown: true } }
      return addLog(siege, 'For a heavy purse, a servant tells you everything, including a hidden sally port on the north side.', 'good')

    case 'forage-approach':
      siege = changeEnemy({ ...siege, army: { ...army, supplies: army.supplies + 3 }, flags: { ...flags, foragedOnApproach: true } }, {
        alert: siege.enemy.alert + 10,
      })
      return addLog(siege, 'You gather grain from the farms along the way. Word of your army spreads.')

    case 'road':
      siege = changeEnemy(siege, { alert: siege.enemy.alert + 30, towers: siege.enemy.towers + 10 })
      return arrive(addLog(siege, 'You march openly down the road. Their lookouts see you coming for miles.', 'bad'), 1, random)

    case 'forest':
      siege = changeEnemy({ ...siege, army: { ...army, supplies: army.supplies - 2 } }, { alert: 0, gate: siege.enemy.gate - 15 })
      return arrive(addLog(siege, 'You slip through the forest. You catch them with the gate half-repaired.', 'good'), 3, random)

    case 'river': {
      // The barges carry the food, so none is eaten on the way.
      siege = { ...siege, army: { ...army, supplies: army.supplies + 2 } }
      if (random() < 0.25) {
        siege = addLog(loseTroops(siege, 0.08), 'A storm on the river capsizes two barges.', 'bad')
      } else {
        siege = addLog(siege, 'The river carries you swiftly and quietly.', 'good')
      }
      return arrive(siege, 2, random)
    }

    case 'blockade':
      siege = { ...siege, flags: { ...flags, blockade: true } }
      return passDays(addLog(siege, 'Your soldiers close every road. Nothing goes in or out.', 'good'), 1, random)

    case 'camp':
      siege = changeMorale({ ...siege, flags: { ...flags, camp: true } }, 10)
      return passDays(addLog(siege, 'Stakes, ditches, and watchfires ring your camp.', 'good'), 1, random)

    case 'build':
      siege = { ...siege, army: { ...army, engines: army.engines + 1, supplies: army.supplies - 1 } }
      return passDays(addLog(siege, `Carpenters raise a trebuchet. You now have ${army.engines + 1}.`, 'good'), 2, random)

    case 'forage': {
      const gained = forageYield(siege)
      siege = { ...siege, army: { ...army, supplies: army.supplies + gained }, flags: { ...flags, forageCount: flags.forageCount + 1 } }
      return passDays(addLog(siege, `Foragers bring back ${gained} days of food. The land is getting bare.`), 1, random)
    }

    case 'parley':
      siege = { ...siege, flags: { ...flags, lastParleyDay: siege.day } }
      if (random() < surrenderChance(siege)) {
        return finish(siege, 'victory', lootFor(rival, 0.75), `${rival.name} opens the gates and surrenders rather than starve or burn.`)
      }
      siege = changeMorale(changeEnemy(siege, { morale: siege.enemy.morale + 5 }), -3)
      return addLog(siege, 'Your herald is sent back with laughter from the walls.', 'bad')

    case 'begin-bombard':
      return addLog({ ...siege, phase: 'bombard' }, 'The trebuchets are wheeled into range. The bombardment begins.')

    case 'begin-assault':
      return addLog({ ...siege, phase: 'assault' }, 'Ladders, rams, and shields are made ready. The assault begins.')

    case 'fire-gate':
      return bombard(siege, 'gate', random)
    case 'fire-walls':
      return bombard(siege, 'walls', random)
    case 'fire-towers':
      return bombard(siege, 'towers', random)

    case 'fire-granary': {
      const burned = army.engines * 2
      siege = changeEnemy(siege, { supplies: siege.enemy.supplies - burned, morale: siege.enemy.morale - 4 })
      return passDays(addLog(siege, `Firepots land on the granary. About ${burned} days of their food goes up in smoke.`, 'good'), 1, random)
    }

    case 'mine': {
      const dug = flags.minesDug + 1
      siege = { ...siege, flags: { ...flags, minesDug: dug } }
      if (random() < rival.trapChance + siege.enemy.alert / 300) {
        siege = loseTroops({ ...siege, flags: { ...siege.flags, mineDiscovered: true } }, 0.05)
        return passDays(addLog(siege, 'They hear the digging and flood the tunnel. Your sappers are lost.', 'bad'), 1, random)
      }
      if (dug >= 3) {
        siege = changeEnemy(siege, { walls: Math.min(siege.enemy.walls, 15), morale: siege.enemy.morale - 15 })
        return passDays(addLog(siege, 'You fire the mine props. A whole stretch of wall collapses!', 'good'), 1, random)
      }
      return passDays(addLog(siege, `The tunnel creeps toward the walls (${dug}/3).`), 1, random)
    }

    case 'ram':
      return assault(
        siege,
        {
          name: 'You ram the gate',
          effectiveness: Math.min(1, (100 - siege.enemy.gate) / 100 + (flags.traitorGate ? 0.4 : 0.1)),
          lossRate: 0.05 + siege.enemy.towers / 800,
        },
        random,
      )
    case 'breach':
      return assault(
        siege,
        { name: 'You storm the breach', effectiveness: ((100 - siege.enemy.walls) / 100) * 1.1, lossRate: 0.05 + siege.enemy.towers / 1000 },
        random,
      )
    case 'ladders': {
      const trapped = random() < rival.trapChance
      if (trapped) {
        siege = addLog(siege, 'Boiling oil and hidden spikes wait at the top of the walls.', 'bad')
      }
      return assault(
        siege,
        {
          name: 'You scale the walls',
          // Ladders are worse the taller and more intact the walls.
          effectiveness: 0.2 + (100 - siege.enemy.walls) / 200,
          lossRate: 0.08 + siege.enemy.towers / 600 + (trapped ? 0.08 : 0),
        },
        random,
      )
    }
    case 'sally-port':
      siege = { ...siege, flags: { ...flags, sallyPortUsed: true } }
      return assault(siege, { name: 'You slip in by the sally port', effectiveness: 0.9, lossRate: 0.03 }, random)
    case 'rally':
      siege = changeMorale({ ...siege, flags: { ...flags, rallied: true } }, 15)
      return addLog(siege, 'You ride along the lines. A roar goes up from your soldiers.', 'good')
    case 'regroup':
      siege = changeMorale({ ...siege, foothold: Math.max(0, siege.foothold - 15) }, 10)
      return passDays(addLog(siege, 'You pull back to rest and bind wounds. They retake some ground.'), 1, random)

    case 'storm-keep':
      if (random() < stormKeepChance(siege)) {
        return finish(siege, 'victory', rival.loot, `You storm the keep and take ${rival.name}'s treasury.`)
      }
      siege = changeEnemy(changeMorale(loseTroops(siege, 0.15), -12), { morale: siege.enemy.morale - 5 })
      return passDays(addLog(siege, 'The keep holds. Your soldiers are thrown back down the stairs.', 'bad'), 1, random)
    case 'terms':
      if (random() < termsChance(siege)) {
        return finish(siege, 'victory', lootFor(rival, 0.75), `${rival.name} accepts your terms and pays to keep their life.`)
      }
      siege = changeEnemy(siege, { morale: siege.enemy.morale + 5 })
      return addLog(siege, 'They refuse your terms. Perhaps they need more persuading.', 'bad')
    case 'plunder':
      return finish(siege, 'victory', lootFor(rival, 0.4), 'You strip the outer town of what you can carry, and march home before they rally.')

    case 'retreat':
      return finish(siege, 'stalemate', 0, 'You sound the retreat. Your army lives to fight another day.')

    default:
      return start
  }
}

// ── Events ───────────────────────────────────────────────────────────────────

export interface EventChoice {
  id: string
  label: string
  detail: string
  coinCost?: number
}

export const EVENT_TEXT: Record<EventId, { title: string; text: string }> = {
  'relief-warning': { title: 'Riders on the horizon', text: 'Your outriders report a relief army marching to lift the siege. They will arrive in about 3 days.' },
  'relief-arrives': { title: 'The relief army arrives', text: 'Banners crest the hill behind you. Their allies have come to break the siege.' },
  sally: { title: 'Night raid!', text: 'Torches and hooves in the dark: the defenders ride out to strike your camp.' },
  disease: { title: 'Sickness in the camp', text: 'A fever is spreading through your tents.' },
  traitor: {
    title: 'A voice at the postern',
    text: 'A guard calls down in the dark. For coin, he will lift the bar on the gate when you attack. It could be a trap.',
  },
  deserters: { title: 'Deserters', text: 'Hungry soldiers slip over the walls to surrender, and they are eager to talk.' },
  storm: { title: 'Storm', text: 'A storm batters the camp overnight. One of your trebuchets is wrecked.' },
  'surrender-offer': { title: 'A white flag', text: 'A herald comes from the gate. They ask what terms you would give.' },
}

export function eventChoices(siege: Siege): EventChoice[] {
  const rival = rivalOf(siege)
  switch (siege.event) {
    case 'relief-warning':
    case 'storm':
      return [{ id: 'ok', label: 'Understood', detail: '' }]
    case 'relief-arrives':
      return [
        { id: 'fight', label: 'Turn and fight them', detail: `About ${percent(reliefBattleChance(siege))} you win` },
        { id: 'withdraw', label: 'Withdraw before you are trapped', detail: 'Ends the siege' },
      ]
    case 'sally':
      return [{ id: 'ok', label: siege.flags.camp ? 'To arms!' : 'Defend the camp!', detail: '' }]
    case 'disease':
      return [
        { id: 'quarantine', label: 'Quarantine the sick', detail: 'Lose a few soldiers now' },
        { id: 'push-on', label: 'Push on and hope', detail: 'It may pass, or it may spread' },
      ]
    case 'traitor':
      return [
        { id: 'pay', label: 'Pay him', detail: '15 coins · could be a trap', coinCost: 15 },
        { id: 'refuse', label: 'Send him away', detail: '' },
      ]
    case 'deserters':
      return [{ id: 'ok', label: 'Question them', detail: 'Learn the truth about the defenders' }]
    case 'surrender-offer':
      return [
        { id: 'accept', label: 'Accept their surrender', detail: `${lootFor(rival, 0.75)} coins` },
        { id: 'refuse', label: 'Refuse: you want everything', detail: 'Keep fighting for the full loot' },
      ]
    default:
      return []
  }
}

export function chooseEventOption(start: Siege, choiceId: string, random: Random): Siege {
  if (!start.event || start.outcome) {
    return start
  }
  const rival = rivalOf(start)
  const event = start.event
  let siege: Siege = { ...start, event: null, decisions: start.decisions + 1 }

  switch (event) {
    case 'relief-warning':
      return addLog({ ...siege, flags: { ...siege.flags, reliefWarned: true } }, 'A relief army is 3 days away. Time is running short.', 'bad')

    case 'relief-arrives':
      if (choiceId === 'withdraw') {
        return finish(siege, 'stalemate', 0, 'You withdraw in good order before the relief army can trap you.')
      }
      if (random() < reliefBattleChance(siege)) {
        siege = changeEnemy(loseTroops(siege, 0.1), { morale: siege.enemy.morale - 30 })
        siege = { ...siege, flags: { ...siege.flags, reliefDefeated: true } }
        return addLog(siege, 'You turn and smash the relief army. The defenders watch their hope die.', 'good')
      }
      siege = changeMorale(loseTroops(siege, 0.3), -25)
      siege = { ...siege, flags: { ...siege.flags, reliefDefeated: true } }
      return checkCollapse(addLog(siege, 'The relief army mauls your lines before it is driven off.', 'bad'))

    case 'sally':
      if (siege.flags.camp) {
        siege = changeMorale(changeEnemy(siege, { garrison: siege.enemy.garrison * 0.95 }), 5)
        return addLog(siege, 'Their riders break on your stakes and ditches. They lose men for nothing.', 'good')
      }
      siege = changeMorale(loseTroops(siege, vary(0.08, 0.25, random)), -8)
      return checkCollapse(addLog(siege, 'They burn tents and cut down sleeping soldiers before riding back inside.', 'bad'))

    case 'disease':
      if (choiceId === 'quarantine') {
        return addLog(changeMorale(loseTroops(siege, 0.05), -3), 'You isolate the sick. The fever is contained.')
      }
      if (random() < 0.4) {
        return checkCollapse(addLog(changeMorale(loseTroops(siege, 0.12), -8), 'The fever spreads through the whole camp.', 'bad'))
      }
      return addLog(siege, 'The fever burns itself out.', 'good')

    case 'traitor':
      siege = { ...siege, flags: { ...siege.flags, traitorOffered: true } }
      if (choiceId === 'refuse') {
        return addLog(siege, 'You send the traitor away.')
      }
      if (random() < rival.trapChance + siege.enemy.alert / 300) {
        return checkCollapse(addLog(loseTroops(siege, 0.1), 'It was a trap! Your soldiers at the postern are ambushed.', 'bad'))
      }
      return addLog({ ...siege, flags: { ...siege.flags, traitorGate: true } }, 'The guard takes your coin. The gate bar will be lifted when you ram it.', 'good')

    case 'deserters':
      siege = changeEnemy(siege, { garrison: siege.enemy.garrison - 3 })
      siege = { ...siege, estimates: exactEstimates(siege.enemy) }
      return addLog(siege, 'The deserters tell you exactly how things stand inside.', 'good')

    case 'storm':
      siege = { ...siege, army: { ...siege.army, engines: Math.max(0, siege.army.engines - 1) } }
      if (siege.army.engines === 0 && siege.phase === 'bombard') {
        siege = { ...siege, phase: 'encircle' }
      }
      return addLog(siege, 'You lost a trebuchet to the storm.', 'bad')

    case 'surrender-offer':
      siege = { ...siege, flags: { ...siege.flags, lastSurrenderOfferDay: siege.day } }
      if (choiceId === 'accept') {
        return finish(siege, 'victory', lootFor(rival, 0.75), `${rival.name} surrenders. Starved and beaten, they pay you to leave.`)
      }
      return addLog(siege, 'You send the herald back. You want the whole treasury.')

    default:
      return siege
  }
}

// ── Saving ───────────────────────────────────────────────────────────────────

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const allNumbers = (value: unknown, keys: string[]) =>
  typeof value === 'object' && value !== null && keys.every((key) => isNumber((value as Record<string, unknown>)[key]))

/** Restores a saved siege, or null if it is damaged; a damaged siege is simply lost. */
export function sanitizeSiege(value: unknown): Siege | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const saved = value as Record<string, unknown>
  const valid =
    typeof saved.rivalId === 'string' &&
    rivalById(saved.rivalId) !== undefined &&
    typeof saved.practice === 'boolean' &&
    (saved.coin === null || (typeof saved.coin === 'object' && ['heads', 'tails'].includes((saved.coin as Record<string, unknown>).landed as string))) &&
    PHASES.some((phase) => phase.id === saved.phase) &&
    isNumber(saved.day) &&
    isNumber(saved.accuracy) &&
    isNumber(saved.foothold) &&
    isNumber(saved.decisions) &&
    allNumbers(saved.army, ['troops', 'startTroops', 'morale', 'supplies', 'engines']) &&
    allNumbers(saved.enemy, ['garrison', 'gate', 'walls', 'towers', 'morale', 'supplies', 'alert']) &&
    allNumbers(saved.estimates, ['garrison', 'gate', 'walls', 'towers', 'morale', 'supplies']) &&
    allNumbers(saved.flags, ['forageCount', 'minesDug', 'lastParleyDay', 'lastSurrenderOfferDay', 'hungryEnemyDays']) &&
    Array.isArray(saved.log) &&
    (saved.event === null || (typeof saved.event === 'string' && saved.event in EVENT_TEXT)) &&
    (saved.reinforced === null || saved.reinforced === 'gate' || saved.reinforced === 'walls' || saved.reinforced === 'towers') &&
    (saved.outcome === null || (typeof saved.outcome === 'object' && isNumber((saved.outcome as Record<string, unknown>).loot)))
  return valid ? (saved as unknown as Siege) : null
}

export function sanitizeWarRecord(value: unknown): WarRecord {
  if (typeof value !== 'object' || value === null) {
    return { lastRaidDay: null, victories: 0, defeats: 0, stalemates: 0, activeSiege: null, trainingDone: false, beaten: [] }
  }
  const saved = value as Record<string, unknown>
  const count = (raw: unknown) => (Number.isInteger(raw) && (raw as number) >= 0 ? (raw as number) : 0)
  return {
    lastRaidDay: typeof saved.lastRaidDay === 'string' ? saved.lastRaidDay : null,
    victories: count(saved.victories),
    defeats: count(saved.defeats),
    stalemates: count(saved.stalemates),
    activeSiege: sanitizeSiege(saved.activeSiege),
    trainingDone: saved.trainingDone === true,
    beaten: Array.isArray(saved.beaten) ? [...new Set(saved.beaten.filter((id): id is string => typeof id === 'string'))] : [],
  }
}
