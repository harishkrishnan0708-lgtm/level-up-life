import { useMemo, useState } from 'react'
import Chronicle from './Chronicle'
import Emblem from './Emblem'
import './War.css'
import { paintCrest } from './crestSprites'
import { questsOn } from './questPlan'
import type { Hero } from './hero'
import PixelArt from './PixelArt'
import { PRACTICE_RIVAL, RIVALS, WAR_UNLOCK_LEVEL, mightBreakdown, raidReadiness, rivalById, scoutAccuracy, startingEngines, totalMight, warUnlockProgress, warUnlocked, type Rival } from './raids'
import { spoilsClue } from './clues'
import { COACH_NAME, coachAdvice } from './coach'
import { NUMBERS_GUIDE, ORDER_GUIDE, PHASE_GUIDE, orderTabs, type OrderCategory } from './orderGuide'
import { EVENT_TEXT, PHASES, availableActions, eventChoices, isNewOrder, type CoinFace, type Phase, type Siege, type SiegeAction } from './siege'

/** A rival's insignia: a pixel shield in a blood-red frame. */
function crest(rival: Rival) {
  return (
    <Emblem tone="blood" className="rival-crest">
      <CrestSprite rivalId={rival.id} />
    </Emblem>
  )
}

function CrestSprite({ rivalId }: { rivalId: string }) {
  const grid = useMemo(() => paintCrest(rivalId), [rivalId])
  return grid ? <PixelArt grid={grid} className="crest-sprite" /> : null
}

/** What a new hero sees on the War tab before it opens: what's coming, and how close they are. */
function WarLocked({ hero }: { hero: Hero }) {
  const { earned, needed } = warUnlockProgress(hero.game)
  return (
    <div className="war">
      <header className="war-header">
        <h2>The War</h2>
        <p className="war-record">Opens at level {WAR_UNLOCK_LEVEL}</p>
      </header>
      <section className="coach-card">
        <p className="coach-name">{COACH_NAME}</p>
        <p className="coach-tip">
          “Not yet, recruit. An army follows a leader who keeps their own habits first. Do your quests for a day or two, and when you
          reach level {WAR_UNLOCK_LEVEL} I’ll show you how to take a castle. That’s where your story begins.”
        </p>
      </section>
      <section className="war-unlock">
        <div className="xp-bar" role="progressbar" aria-label={`XP toward level ${WAR_UNLOCK_LEVEL}`} aria-valuemin={0} aria-valuemax={needed} aria-valuenow={earned}>
          <div className="xp-fill" style={{ width: `${(earned / needed) * 100}%` }} />
        </div>
        <p className="xp-label">
          {earned} / {needed} XP · {needed - earned} XP to go
        </p>
      </section>
    </div>
  )
}

const OUTCOME_TITLES = { victory: 'Victory!', defeat: 'Defeat', stalemate: 'Withdrawn' } as const

interface WarProps {
  hero: Hero
  today: string
  testLuck: boolean
  onMarch: (rivalId: string) => void
  onStartPractice: () => void
  onSkipTraining: () => void
  onCoinCall: (call: CoinFace) => void
  onOrder: (actionId: string) => void
  onEventChoice: (choiceId: string) => void
  onLeaveSiege: () => void
  onStoryChoice: (chapterId: string, optionId: string) => void
  onChapterRead: (chapterId: string) => void
}

function War({
  hero,
  today,
  testLuck,
  onMarch,
  onStartPractice,
  onSkipTraining,
  onCoinCall,
  onOrder,
  onEventChoice,
  onLeaveSiege,
  onStoryChoice,
  onChapterRead,
}: WarProps) {
  const [rivalToConfirm, setRivalToConfirm] = useState<Rival | null>(null)
  const readiness = raidReadiness(hero.game, hero.war, today, testLuck, hero.plan)
  const todaysQuests = questsOn(hero.plan, today)
  const mightParts = mightBreakdown(hero.game, hero.holdings, hero.pets)
  const might = totalMight(mightParts)
  const accuracy = scoutAccuracy(hero.holdings)
  const engines = startingEngines(hero.holdings)

  if (!warUnlocked(hero.game, hero.war)) {
    return <WarLocked hero={hero} />
  }

  if (hero.war.activeSiege) {
    return (
      <SiegeView
        siege={hero.war.activeSiege}
        firstTime={!hero.war.beaten.includes(hero.war.activeSiege.rivalId)}
        coins={hero.game.coins}
        onCoinCall={onCoinCall}
        onOrder={onOrder}
        onEventChoice={onEventChoice}
        onLeave={onLeaveSiege}
      />
    )
  }

  if (!hero.war.trainingDone) {
    return (
      <div className="war">
        <header className="war-header">
          <h2>Training Grounds</h2>
          <p className="war-record">Before you lead an army against a real lord, learn the ropes.</p>
        </header>
        <section className="coach-card">
          <p className="coach-name">{COACH_NAME}</p>
          <p className="coach-tip">
            “So you want to take castles, do you? A siege is no brawl. It’s scouting, timing, and keeping your soldiers fed. There’s an old
            watch fort nearby, held by a few deserters, and better armed than deserters have any right to be. Let’s take it together, and I’ll talk you through every step.”
          </p>
        </section>
        <section className="rival-card practice-card">
          <span className="rival-icon">{crest(PRACTICE_RIVAL)}</span>
          <div className="rival-text">
            <p className="rival-name">{PRACTICE_RIVAL.name}</p>
            <p className="rival-title">{PRACTICE_RIVAL.title}</p>
            <p className="rival-reputation">{PRACTICE_RIVAL.reputation}</p>
            <p className="rival-stats">
              Practice siege · doesn’t use today’s raid · Loot <span className="coin-icon" aria-hidden="true" /> {PRACTICE_RIVAL.loot}
            </p>
          </div>
        </section>
        <button type="button" className="button-primary full training-start" onClick={onStartPractice}>
          Begin the practice siege
        </button>
        <button type="button" className="retreat-button skip-training" onClick={onSkipTraining}>
          Skip training. I know what I’m doing.
        </button>
      </div>
    )
  }

  return (
    <div className="war">
      <header className="war-header">
        <h2>War Table</h2>
        <p className="war-record">
          {hero.war.victories} {hero.war.victories === 1 ? 'victory' : 'victories'} · {hero.war.defeats}{' '}
          {hero.war.defeats === 1 ? 'defeat' : 'defeats'} · {hero.war.stalemates} withdrawn
        </p>
      </header>

      <section className="war-status" aria-live="polite">
        {readiness === 'ready' && <p>Your army is ready. Choose a kingdom to besiege. You may march once today.</p>}
        {readiness === 'quests-unfinished' && (
          <p>
            {todaysQuests.length === 0
              ? 'Today is a rest day, and your army rests with you. March again on a day with quests.'
              : `Your army won’t march for an idle lord. Finish all ${todaysQuests.length} of today’s quests to raid (${todaysQuests.filter((quest) => hero.game.completedQuestIds.includes(quest.id)).length} of ${todaysQuests.length} done).`}
          </p>
        )}
        {readiness === 'already-raided' && <p>Your army rests after today’s siege. March again tomorrow.</p>}
      </section>

      <Chronicle hero={hero} onChoose={onStoryChoice} onFinish={onChapterRead} onRetakeFort={onStartPractice} />

      <section className="might-card">
        <p className="might-total">
          Your army <strong>{60 + 10 * might}</strong> soldiers
        </p>
        <ul className="might-parts">
          {mightParts.map((part) => (
            <li key={part.label}>
              {part.label} +{part.amount * 10}
            </li>
          ))}
        </ul>
        <p className="might-hint">
          Scouts are right {Math.round(accuracy * 100)}% of the time{engines > 0 ? ' · your blacksmith sends a trebuchet' : ''}. War tents,
          a castle keep, hero levels, and rare pets add soldiers; watchtowers and scout training from Wick sharpen your scouts.
        </p>
      </section>

      <ul className="rival-list">
        {RIVALS.map((rival) => (
          <li key={rival.id} className="rival-card">
            <span className="rival-icon" aria-hidden="true">
              {crest(rival)}
            </span>
            <div className="rival-text">
              <p className="rival-name">{rival.name}</p>
              <p className="rival-title">{rival.title}</p>
              <p className="rival-reputation">{rival.reputation}</p>
              <p className="rival-stats">
                Garrison ~{rival.garrison} · Loot <span className="coin-icon" aria-hidden="true" /> {rival.loot}
              </p>
            </div>
            <button type="button" className="button-primary march-button" disabled={readiness !== 'ready'} onClick={() => setRivalToConfirm(rival)}>
              March
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="retreat-button replay-training" onClick={onStartPractice}>
        Replay the practice siege with {COACH_NAME}
      </button>

      {rivalToConfirm && (
        <div className="overlay" onClick={() => setRivalToConfirm(null)}>
          <div className="sheet confirm-march" role="dialog" aria-modal="true" aria-labelledby="march-title" onClick={(event) => event.stopPropagation()}>
            <p className="confirm-march-icon" aria-hidden="true">
              {crest(rivalToConfirm)}
            </p>
            <h2 id="march-title">Besiege {rivalToConfirm.name}?</h2>
            <p>
              A siege takes 5 to 10 minutes. You can leave and come back; it waits for you. Marching spends today’s raid, even if you turn back.
            </p>
            <div className="confirm-march-actions">
              <button type="button" className="button-secondary" onClick={() => setRivalToConfirm(null)}>
                Not yet
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => {
                  setRivalToConfirm(null)
                  onMarch(rivalToConfirm.id)
                  window.scrollTo(0, 0)
                }}
              >
                March!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Meter({ label, value, max = 100, estimate = false, danger = 30 }: { label: string; value: number; max?: number; estimate?: boolean; danger?: number }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="meter">
      <div className="meter-label">
        <span>{label}</span>
        <span>
          {estimate ? '≈ ' : ''}
          {max === 100 ? `${value}%` : `${value} / ${max}`}
        </span>
      </div>
      <div className="meter-bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <div className={`meter-fill${percent <= danger ? ' low' : ''}${estimate ? ' estimate' : ''}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

/** The opening toss: you call it, the coin spins, and whoever wins moves first. */
function CoinTossCard({ siege, onCall }: { siege: Siege; onCall: (call: CoinFace) => void }) {
  if (!siege.coin) {
    return (
      <section className="coin-card" aria-live="polite">
        <h3>The opening toss</h3>
        <p>Win the toss and you give the first order. Lose it, and the enemy makes the first move.</p>
        <div className="coin" aria-hidden="true">
          <span className="coin-face">?</span>
        </div>
        <div className="confirm-march-actions">
          <button type="button" className="button-secondary" data-sfx onClick={() => onCall('heads')}>
            Call heads
          </button>
          <button type="button" className="button-secondary" data-sfx onClick={() => onCall('tails')}>
            Call tails
          </button>
        </div>
      </section>
    )
  }
  const won = siege.coin.call === siege.coin.landed
  return (
    <section className={`coin-card ${won ? 'coin-won' : 'coin-lost'}`} aria-live="polite">
      <div className="coin spinning" aria-hidden="true">
        <span className="coin-face">{siege.coin.landed === 'heads' ? 'H' : 'T'}</span>
      </div>
      <p className="coin-result">
        You called {siege.coin.call}. It landed <strong>{siege.coin.landed}</strong>.{' '}
        {won ? 'The first move is yours.' : 'The enemy moves first. See the dispatches below.'}
      </p>
    </section>
  )
}

/** Explains the current phase, the given orders, and the numbers. Reading it doesn't use up any time in the siege. */
function SiegeGuide({ phase, actions }: { phase: Phase; actions: readonly SiegeAction[] }) {
  return (
    <details className="siege-guide">
      <summary>What do these mean?</summary>
      <p className="siege-guide-phase">{PHASE_GUIDE[phase]}</p>
      <dl>
        {actions.map((action) => (
          <div key={action.id}>
            <dt>{action.label}</dt>
            <dd>{ORDER_GUIDE[action.id]}</dd>
          </div>
        ))}
      </dl>
      <details className="siege-guide-numbers">
        <summary>The numbers</summary>
        <dl>
          {NUMBERS_GUIDE.map(({ name, meaning }) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
    </details>
  )
}

interface OrdersPanelProps {
  siege: Siege
  coins: number
  firstTime: boolean
  /** The order Holt suggests in the practice siege; its tab opens by itself. */
  suggestedActionId: string | null
  onOrder: (actionId: string) => void
}

/** The orders the player can give, one category at a time when there are too many to take in at once. */
function OrdersPanel({ siege, coins, firstTime, suggestedActionId, onOrder }: OrdersPanelProps) {
  // A tab the player picks holds until the phase or Holt's suggestion moves on.
  const moment = `${siege.phase}/${suggestedActionId}`
  const [picked, setPicked] = useState<{ moment: string; tab: OrderCategory } | null>(null)
  const actions = availableActions(siege)
  const orders = actions.filter((action) => !action.retreat)
  const tabs = orderTabs(orders)
  const suggestedTab = tabs.find((tab) => tab.orders.some((order) => order.id === suggestedActionId))
  const wanted = picked?.moment === moment ? picked.tab : suggestedTab?.id
  const openTab = tabs.find((tab) => tab.id === wanted) ?? tabs[0]
  const shown = openTab ? openTab.orders : orders
  const isNew = (actionId: string) => firstTime && isNewOrder(siege, actionId)

  return (
    <section aria-label="Your orders">
      <h3 className="orders-title">Your orders</h3>
      {tabs.length > 0 && (
        <div className="order-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`order-tab${tab === openTab ? ' open' : ''}`}
              aria-pressed={tab === openTab}
              onClick={() => setPicked({ moment, tab: tab.id })}
            >
              {tab.name} ({tab.orders.length})
              {tab.orders.some((order) => isNew(order.id)) && <span className="new-order-tag">New</span>}
            </button>
          ))}
        </div>
      )}
      <SiegeGuide phase={siege.phase} actions={[...shown, ...actions.filter((action) => action.retreat)]} />
      <div className="orders">
        {shown.map((action) => {
          const tooPoor = (action.coinCost ?? 0) > coins
          return (
            <button
              key={action.id}
              type="button"
              className={`order${suggestedActionId === action.id ? ' suggested' : ''}`}
              disabled={tooPoor}
              data-sfx
              onClick={() => onOrder(action.id)}
            >
              <span className="order-label">
                {action.label}
                {suggestedActionId === action.id && <span className="suggested-tag">Suggested</span>}
                {isNew(action.id) && <span className="new-order-tag">New</span>}
              </span>
              <span className="order-detail">{tooPoor ? `${action.detail} · you have only ${coins}` : action.detail}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

interface SiegeViewProps {
  siege: Siege
  /** Whether this castle has never been taken, so orders it introduces are marked new. */
  firstTime: boolean
  coins: number
  onCoinCall: (call: CoinFace) => void
  onOrder: (actionId: string) => void
  onEventChoice: (choiceId: string) => void
  onLeave: () => void
}

function SiegeView({ siege, firstTime, coins, onCoinCall, onOrder, onEventChoice, onLeave }: SiegeViewProps) {
  const [confirmRetreat, setConfirmRetreat] = useState(false)
  const advice = siege.practice ? coachAdvice(siege) : null
  const rival = rivalById(siege.rivalId)!
  const { army, estimates, flags } = siege
  const phaseIndex = PHASES.findIndex((phase) => phase.id === siege.phase)
  const recentLog = [...siege.log].reverse()

  const relief = flags.reliefDefeated
    ? 'Relief army: defeated'
    : flags.reliefWarned
      ? `Relief army: arriving about day ${rival.reliefDay}`
      : flags.scouted || flags.informed
        ? `Relief army: expected around day ${rival.reliefDay}`
        : 'Relief army: unknown (send scouts)'

  if (siege.outcome) {
    const { outcome } = siege
    return (
      <div className="siege">
        <section className={`siege-result result-${outcome.kind}`}>
          <p className="siege-result-icon" aria-hidden="true">
            {crest(rival)}
          </p>
          <h2>{siege.practice ? 'Training complete' : OUTCOME_TITLES[outcome.kind]}</h2>
          <p className="siege-result-summary">{outcome.summary}</p>
          {advice && (
            <p className="coach-tip">
              <strong>{COACH_NAME}:</strong> “{advice.tip}”
            </p>
          )}
          {outcome.loot > 0 && (
            <p className="siege-loot">
              <span className="coin-icon" aria-hidden="true" /> +{outcome.loot} coins
            </p>
          )}
          {outcome.kind === 'victory' && spoilsClue(rival.id) && <p className="siege-spoils">{spoilsClue(rival.id)}</p>}
          <p className="siege-result-stats">
            {siege.day} days of siege · {army.troops} of {army.startTroops} soldiers came home · {siege.decisions} decisions
          </p>
          <button type="button" className="button-primary full" onClick={onLeave}>
            {siege.practice ? 'On to the real war' : 'Back to the war table'}
          </button>
        </section>
        <details className="journal">
          <summary>War journal</summary>
          <ol>
            {siege.log.map((entry, index) => (
              <li key={index} className={`log-${entry.tone}`}>
                <span className="log-day">Day {entry.day}</span> {entry.text}
              </li>
            ))}
          </ol>
        </details>
      </div>
    )
  }

  return (
    <div className="siege">
      <header className="duel-banner">
        <span className="duel-rival-icon" aria-hidden="true">
          {crest(rival)}
        </span>
        <div>
          <p className="duel-label">
            {siege.practice ? 'Practice siege' : 'Besieging'} · Day {siege.day}
          </p>
          <h2>{rival.name}</h2>
          <p className="duel-might">{relief}</p>
        </div>
      </header>

      <ol className="phase-steps" aria-label="Siege phases">
        {PHASES.map((phase, index) => (
          <li key={phase.id} className={index < phaseIndex ? 'done' : index === phaseIndex ? 'current' : ''} aria-current={index === phaseIndex ? 'step' : undefined}>
            {phase.name}
          </li>
        ))}
      </ol>

      {advice && (
        <section className="coach-card" aria-live="polite">
          <p className="coach-name">{COACH_NAME}</p>
          {siege.coin && !siege.event && <p className="coach-phase">{PHASE_GUIDE[siege.phase]}</p>}
          <p className="coach-tip">“{advice.tip}”</p>
        </section>
      )}

      {(!siege.coin || siege.decisions === 0) && <CoinTossCard siege={siege} onCall={onCoinCall} />}

      <div className="siege-status">
        <section className="status-card" aria-label="Your army">
          <h3>Your army</h3>
          <Meter label="Soldiers" value={army.troops} max={army.startTroops} danger={45} />
          <Meter label="Morale" value={army.morale} />
          <p className="status-line">
            <span>Food</span>
            <strong className={army.supplies <= 2 ? 'warn' : ''}>{army.supplies} days</strong>
          </p>
          <p className="status-line">
            <span>Trebuchets</span>
            <strong>{army.engines}</strong>
          </p>
        </section>
        <section className="status-card enemy" aria-label="Scout estimates of the enemy">
          <h3>Scouts report</h3>
          <p className="status-line">
            <span>Garrison</span>
            <strong>≈ {estimates.garrison}</strong>
          </p>
          <Meter label="Gate" value={estimates.gate} estimate danger={35} />
          <Meter label="Walls" value={estimates.walls} estimate danger={40} />
          <Meter label="Towers" value={estimates.towers} estimate danger={35} />
          <Meter label="Their morale" value={estimates.morale} estimate danger={25} />
          <p className="status-line">
            <span>Their food</span>
            <strong>≈ {estimates.supplies} days</strong>
          </p>
          <p className="accuracy-note">Scouts are right about {Math.round(siege.accuracy * 100)}% of the time.</p>
        </section>
      </div>

      {siege.phase === 'assault' && <Meter label="Foothold on the walls" value={siege.foothold} danger={0} />}
      {siege.reinforced && siege.phase === 'bombard' && (
        <p className="reinforced-note">Overnight, they shored up the {siege.reinforced}. Hitting it again will do less.</p>
      )}

      {siege.event ? (
        <section className="event-card" aria-live="polite">
          <h3>{EVENT_TEXT[siege.event].title}</h3>
          <p>{EVENT_TEXT[siege.event].text}</p>
          <div className="event-choices">
            {eventChoices(siege).map((choice) => {
              const tooPoor = (choice.coinCost ?? 0) > coins
              return (
                <button key={choice.id} type="button" className="order" data-sfx disabled={tooPoor} onClick={() => onEventChoice(choice.id)}>
                  <span className="order-label">{choice.label}</span>
                  {(choice.detail || tooPoor) && <span className="order-detail">{tooPoor ? `You have only ${coins} coins` : choice.detail}</span>}
                </button>
              )
            })}
          </div>
        </section>
      ) : !siege.coin ? null : (
        <OrdersPanel
          siege={siege}
          coins={coins}
          firstTime={firstTime}
          suggestedActionId={advice?.suggestedActionId ?? null}
          onOrder={onOrder}
        />
      )}

      <section className="dispatches" aria-label="Latest dispatches" aria-live="polite">
        <h3>Dispatches</h3>
        <ol>
          {recentLog.slice(0, 4).map((entry, index) => (
            <li key={siege.log.length - index} className={`log-${entry.tone}`}>
              <span className="log-day">Day {entry.day}</span> {entry.text}
            </li>
          ))}
        </ol>
        {siege.log.length > 4 && (
          <details className="journal">
            <summary>Full war journal ({siege.log.length})</summary>
            <ol>
              {recentLog.slice(4).map((entry, index) => (
                <li key={index} className={`log-${entry.tone}`}>
                  <span className="log-day">Day {entry.day}</span> {entry.text}
                </li>
              ))}
            </ol>
          </details>
        )}
      </section>

      {!siege.event && siege.coin && (
        <div className="retreat">
          {confirmRetreat ? (
            <>
              <p>Abandon the siege? You keep your soldiers but win nothing.</p>
              <div className="confirm-march-actions">
                <button type="button" className="button-secondary" onClick={() => setConfirmRetreat(false)}>
                  Stay and fight
                </button>
                <button type="button" className="button-primary" onClick={() => onOrder('retreat')}>
                  Retreat
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="retreat-button" onClick={() => setConfirmRetreat(true)}>
              Sound the retreat
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default War
