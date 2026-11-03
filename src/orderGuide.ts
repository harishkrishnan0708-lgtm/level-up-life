import type { Phase, SiegeAction } from './siege'

/** What the player is trying to do in each phase of a siege. */
export const PHASE_GUIDE: Record<Phase, string> = {
  approach: 'Approach: get ready, then choose your route to the castle.',
  encircle: 'Encircle: you’re at their walls. Prepare, then move on to bombarding or attacking.',
  bombard: 'Bombard: use your trebuchets to wear down their defences before you attack.',
  assault: 'Assault: attack the walls. Fill the foothold bar to take them.',
  keep: 'The keep: the walls are yours. Decide how to finish the siege.',
}

/** What each order is good for, in plain words, to go with the costs shown on its button. */
export const ORDER_GUIDE: Record<string, string> = {
  scout: 'Updates the enemy numbers on your screen and tells you about when their allies could arrive. Costs 1 food.',
  informant: 'Pay coins to learn the enemy’s exact numbers, and a hidden way in that you can use during the assault.',
  'forage-approach': 'Adds 3 food before you arrive, but makes the enemy more alert.',
  road: 'The fastest route, 1 day. They see you coming and strengthen their towers.',
  forest: 'The slowest route, 3 days, and it costs 2 extra food. You catch them unready, and their gate starts weaker.',
  river: 'Takes 2 days and eats no food. A storm may sink some barges and cost you soldiers.',
  blockade: 'Cuts off their roads, so their food runs out twice as fast. Once it’s gone, their morale falls every day.',
  camp: 'Protects your camp from night raids and raises your morale by 10.',
  build: 'Adds a trebuchet. You need at least one to start bombarding. Takes 2 days and costs extra food.',
  forage: 'Brings back more food but takes a day. Each trip finds less, as the land gets bare.',
  parley: 'Asks them to give up. If they agree, you win most of the loot with no fight. If not, your morale dips and theirs rises.',
  'begin-bombard': 'Moves on to the Bombard phase, where your trebuchets can damage their defences.',
  'begin-assault': 'Stops preparing and starts the attack on the walls. Weaken them first if you can, because a strong castle costs more soldiers.',
  'fire-gate': 'Damages the gate, which makes ramming it work better later.',
  'fire-walls': 'Damages the walls. Once they’re low enough, you can storm through the breach.',
  'fire-towers': 'Damages the towers, so you lose fewer soldiers in the assault.',
  'fire-granary': 'Burns their food and lowers their morale. More trebuchets burn more.',
  mine: 'Three days of digging brings down a stretch of wall and hurts their morale. If they discover it, you lose soldiers and the mine.',
  ram: 'Attacks the gate to gain foothold. Works better the more damaged the gate is.',
  breach: 'Attacks through the broken wall to gain foothold. Works better the more damaged the walls are.',
  ladders: 'Climbs the walls to gain foothold. You don’t need a damaged gate, but it costs the most soldiers and can run into traps.',
  'sally-port': 'A strong attack with few losses, through the hidden door your informant told you about. Works once.',
  rally: 'Raises your morale by 15 without using up a day. Works once per siege.',
  regroup: 'Raises your morale by 10, but costs a day and some of your foothold.',
  'storm-keep': 'Tries to take the keep for the full loot. If it fails, you lose soldiers and morale, and can try again.',
  terms: 'Offers them a deal: most of the loot with no fighting. If they refuse, their morale rises and you can try again.',
  plunder: 'Ends the siege as a win for certain, with less loot.',
  retreat: 'Ends the siege right away. You keep your soldiers but win nothing.',
}

export type OrderCategory = 'prepare' | 'march' | 'bombard' | 'advance' | 'attack' | 'troops'

const CATEGORY_NAMES: Record<OrderCategory, string> = {
  prepare: 'Prepare',
  march: 'March',
  bombard: 'Bombard',
  advance: 'Advance',
  attack: 'Attack',
  troops: 'Troops',
}

/** Which tab each order sits under. The keep's few orders and the retreat button are never split into tabs. */
export const ORDER_CATEGORIES: Record<string, OrderCategory> = {
  scout: 'prepare',
  informant: 'prepare',
  'forage-approach': 'prepare',
  road: 'march',
  forest: 'march',
  river: 'march',
  blockade: 'prepare',
  camp: 'prepare',
  build: 'prepare',
  forage: 'prepare',
  'fire-gate': 'bombard',
  'fire-walls': 'bombard',
  'fire-towers': 'bombard',
  'fire-granary': 'bombard',
  mine: 'bombard',
  parley: 'advance',
  'begin-bombard': 'advance',
  'begin-assault': 'advance',
  ram: 'attack',
  breach: 'attack',
  ladders: 'attack',
  'sally-port': 'attack',
  rally: 'troops',
  regroup: 'troops',
}

/** With this many orders or fewer, a plain list is quicker than tapping through tabs. */
const MOST_ORDERS_WITHOUT_TABS = 4

export interface OrderTab {
  id: OrderCategory
  name: string
  orders: SiegeAction[]
}

/** Splits the orders on screen into tabs, in the order they first appear, or gives none if the list is short. */
export function orderTabs(orders: readonly SiegeAction[]): OrderTab[] {
  if (orders.length <= MOST_ORDERS_WITHOUT_TABS) {
    return []
  }
  const tabs: OrderTab[] = []
  for (const order of orders) {
    const id = ORDER_CATEGORIES[order.id]
    const tab = tabs.find((candidate) => candidate.id === id)
    if (tab) {
      tab.orders.push(order)
    } else {
      tabs.push({ id, name: CATEGORY_NAMES[id], orders: [order] })
    }
  }
  return tabs.length > 1 ? tabs : []
}

/** What the numbers on the siege screen mean. */
export const NUMBERS_GUIDE: readonly { name: string; meaning: string }[] = [
  { name: 'Soldiers', meaning: 'Your army’s size. If it falls below 30% of where it started, you lose.' },
  { name: 'Morale', meaning: 'Your army’s will to fight. Higher morale hits harder. At 0, your army deserts and you lose.' },
  { name: 'Food', meaning: 'Your army eats 1 a day. With none left, you lose soldiers and morale every day.' },
  { name: 'Trebuchets', meaning: 'Needed to bombard. More of them do more damage.' },
  { name: 'Foothold', meaning: 'How much of the walls you hold during the assault. Fill it to reach the keep.' },
  { name: 'Scouts report', meaning: 'Best guesses at the enemy’s numbers, which can be wrong. The lower they are, the easier the enemy is to beat.' },
]
