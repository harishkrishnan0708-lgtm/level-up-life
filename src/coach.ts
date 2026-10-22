import { availableActions, forageYield, type Siege } from './siege'

export const COACH_NAME = 'Sergeant Holt'

export interface CoachAdvice {
  tip: string
  /** The order the coach suggests, highlighted on screen; the player is still free to pick any order. */
  suggestedActionId: string | null
}

const has = (siege: Siege, actionId: string) => availableActions(siege).some((action) => action.id === actionId)

/** What the sergeant says during the practice siege, based on what is happening right now. */
export function coachAdvice(siege: Siege): CoachAdvice {
  const { army, estimates, flags } = siege
  const advise = (tip: string, suggestedActionId: string | null = null) => ({ tip, suggestedActionId })

  if (siege.outcome) {
    return advise(
      siege.outcome.kind === 'victory'
        ? 'Well fought, commander! Real lords have bigger garrisons and allies who ride to their rescue, so plan for that. Good luck.'
        : 'No shame in learning. Remember: scout first, watch your food, and weaken the walls before you storm them. Real lords will be harder.',
    )
  }
  if (!siege.coin) {
    return advise('Every siege opens with a coin toss. Call it right and you move first. Call it wrong and the enemy gets a free move. Go on, call it!')
  }
  if (siege.event) {
    return advise('Something has happened that needs your decision. Read it carefully: some choices cost coins, and some carry risk.')
  }
  if (army.supplies <= 2 && has(siege, 'forage')) {
    // A trip that brings back only a day's food is eaten the same day, so it gains nothing.
    if (forageYield(siege) >= 2) {
      return advise('Your food is nearly gone! An army that starves loses heart and deserts. Forage now.', 'forage')
    }
    if (has(siege, 'begin-assault')) {
      return advise('The land is stripped bare and your food is almost gone. You can’t wait them out any longer. Attack now!', 'begin-assault')
    }
  }

  switch (siege.phase) {
    case 'approach':
      if (!flags.scouted) {
        return advise(
          'Never march blind. Those enemy numbers on the right are only guesses until your scouts have looked. Send them ahead.',
          'scout',
        )
      }
      return advise(
        'Now choose your road. The forest catches them unprepared but eats your food; the king’s road is quick but they see you coming. Food wins sieges, so take the river: the barges carry your supplies.',
        'river',
      )
    case 'encircle':
      if (army.engines === 0) {
        return advise('You are at their walls. You can’t knock them down without a trebuchet, so build one. It takes 2 days.', 'build')
      }
      return advise('Your trebuchet is ready. Start the bombardment and soften them up before you attack.', 'begin-bombard')
    case 'bombard':
      if (estimates.gate < 35) {
        return advise('The gate is cracking. That’s your way in. Launch the assault!', 'begin-assault')
      }
      if (siege.reinforced === 'gate') {
        return advise('They shored up the gate overnight, so hitting it again does less. Switch targets: knock out the towers instead.', 'fire-towers')
      }
      return advise('Pound the gate. Watch the enemy report on the right: when the gate drops low, it’s time to attack.', 'fire-gate')
    case 'assault':
      if (army.morale < 40 && has(siege, 'rally')) {
        return advise('Your soldiers are losing heart. Ride out and rally them before the next wave.', 'rally')
      }
      return advise('Ram the gate you weakened. Each wave gains ground; fill the foothold bar to take the walls.', 'ram')
    case 'keep':
      return advise(
        'The walls are yours; only the keep is left. Storming it pays the most but can fail. Offering terms is safer. Your choice, commander.',
      )
  }
}
