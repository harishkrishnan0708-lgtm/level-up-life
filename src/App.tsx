import { useEffect, useRef, useState } from 'react'
import './App.css'
import AchievementCelebration from './AchievementCelebration'
import { isMuted, playSound, setMuted, unlockAudio, type SoundName } from './sounds'
import './Achievements.css'
import { awardAchievements, newlyEarned, type Achievement } from './achievements'
import CharacterCreator from './CharacterCreator'
import EggIcon from './EggIcon'
import Emblem from './Emblem'
import { companionAt, levelProgress, rankName, toLocalDay, toggleQuest, type Quest } from './game'
import HeroMenu from './HeroMenu'
import Kingdom from './Kingdom'
import Menagerie from './Menagerie'
import PetIcon from './PetIcon'
import {
  NORMAL_RULES,
  RARITY_LABELS,
  TEST_LUCK_RULES,
  afterQuestToggle,
  bonusLabel,
  petById,
  petXpMultiplier,
  setActivePet,
  type Egg,
  type Pet,
} from './pets'
import {
  PRACTICE_RIVAL,
  mightBreakdown,
  markBeaten,
  recordRaid,
  rivalById,
  scoutAccuracy,
  startingEngines,
  totalMight,
  warUnlocked,
  type Rival,
  type WarRecord,
} from './raids'
import { chooseOption, markRead } from './story'
import TabBackdrop from './TabBackdrop'
import Journal from './Journal'
import { allQuests, isPerfectDay, type QuestPlan } from './questPlan'
import QuestPlanner from './QuestPlanner'
import GuideCard from './GuideCard'
import { GUIDE_STEPS, guideDone, markGuideDone } from './guide'
import StreakFlame from './StreakFlame'
import { claimMilestone, currentStreak, milestoneReached } from './streak'
import BackupControls from './BackupControls'
import { availableActions, chooseEventOption, eventChoices, startSiege, takeAction, tossCoin, type CoinFace, type Siege } from './siege'
import Shop from './Shop'
import War from './War'
import { buyItem, collectFood, packSiegeFood, questBuildingBonus, shopItem, xpMultiplier, type PurchaseCheck } from './wares'
import {
  activeHero,
  addHero,
  draftOf,
  editHero,
  equipGear,
  loadRoster,
  newHeroDraft,
  saveRoster,
  setHeroProgress,
  startRosterDay,
  startingGame,
  switchHero,
  type Hero,
  type HeroDraft,
  type Roster,
} from './hero'
import QuestBoard from './QuestBoard'
import WeekSummary from './WeekSummary'
import { isPlayerRival, playerOf, rivalFromKingdom, type KingdomSnapshot } from './pvp'
import type { Inventory } from './trades'

type Screen = { kind: 'main' } | { kind: 'heroes' } | { kind: 'create' } | { kind: 'edit'; heroId: string } | { kind: 'plan' } | { kind: 'week' }

type Tab = 'quests' | 'shop' | 'kingdom' | 'war' | 'pets' | 'journal'

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'quests', label: 'Quests' },
  { id: 'shop', label: 'Merchant' },
  { id: 'kingdom', label: 'Kingdom' },
  { id: 'war', label: 'War' },
  { id: 'pets', label: 'Pets' },
  { id: 'journal', label: 'Journal' },
]

/** The test-luck switch only exists on the development server (`npm run dev`), never in a production build. */
const TEST_LUCK_AVAILABLE = import.meta.env.DEV
const TEST_LUCK_KEY = 'level-up-life/test-luck'

function readTestLuck(): boolean {
  try {
    return TEST_LUCK_AVAILABLE && window.localStorage.getItem(TEST_LUCK_KEY) === 'on'
  } catch {
    return false
  }
}

interface RewardToast {
  id: number
  text: string
}

type Celebration =
  | { kind: 'level'; level: number; companionGrewInto: string | null; warOpened: boolean }
  | { kind: 'egg'; egg: Egg; warmthNeeded: number }
  | { kind: 'hatch'; pet: Pet; following: boolean }
  | { kind: 'streak'; days: number; coins: number }
  | { kind: 'achievements'; achievements: Achievement[] }

const CELEBRATION_SOUNDS: Record<Celebration['kind'], SoundName> = {
  level: 'levelUp',
  egg: 'egg',
  hatch: 'hatch',
  streak: 'streak',
  achievements: 'achievement',
}

const OUTCOME_SOUNDS: Record<NonNullable<Siege['outcome']>['kind'], SoundName> = { victory: 'victory', defeat: 'defeat', stalemate: 'stalemate' }

function App() {
  const [roster, setRoster] = useState(() => loadRoster(window.localStorage, toLocalDay(new Date())))
  // Taps read the latest roster from here, so quick taps in a row can't overwrite each other.
  const latestRoster = useRef(roster)
  const [screen, setScreen] = useState<Screen>({ kind: 'main' })
  const [tab, setTab] = useState<Tab>('quests')
  const [today, setToday] = useState(() => toLocalDay(new Date()))
  const [saveFailed, setSaveFailed] = useState(false)
  // Level-ups, eggs, and hatchings can all happen on one tap, so they queue up and show one at a time.
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const [testLuck, setTestLuck] = useState(readTestLuck)
  const eggRules = testLuck ? TEST_LUCK_RULES : NORMAL_RULES
  const [toast, setToast] = useState<RewardToast | null>(null)
  const [soundOff, setSoundOff] = useState(isMuted)
  // The first-time tour, shown once per phone; null once it's done or skipped.
  const [guideStep, setGuideStep] = useState<number | null>(() => (guideDone(window.localStorage) ? null : 0))

  function updateRoster(next: Roster) {
    latestRoster.current = next
    setRoster(next)
    setSaveFailed(!saveRoster(window.localStorage, next))
  }

  // Reset the quest list when the app is reopened (or left open) on a new day.
  useEffect(() => {
    const refreshDay = () => {
      const now = toLocalDay(new Date())
      setToday(now)
      latestRoster.current = startRosterDay(latestRoster.current, now)
      setRoster(latestRoster.current)
    }
    const timer = window.setInterval(refreshDay, 60_000)
    document.addEventListener('visibilitychange', refreshDay)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshDay)
    }
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = window.setTimeout(() => setToast(null), 1600)
    return () => window.clearTimeout(timer)
  }, [toast])

  // Every button clicks, except the ones that play a sound of their own (marked data-sfx).
  useEffect(() => {
    const clickSound = (event: MouseEvent) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null
      if (button && !button.hasAttribute('data-sfx')) {
        playSound('click')
      }
    }
    document.addEventListener('pointerdown', unlockAudio, true)
    document.addEventListener('click', clickSound, true)
    return () => {
      document.removeEventListener('pointerdown', unlockAudio, true)
      document.removeEventListener('click', clickSound, true)
    }
  }, [])

  // Each celebration plays its fanfare as it appears, just after the sound of whatever earned it.
  const celebrationShown = celebrations[0]
  useEffect(() => {
    if (!celebrationShown) {
      return
    }
    const timer = window.setTimeout(() => playSound(CELEBRATION_SOUNDS[celebrationShown.kind]), 150)
    return () => window.clearTimeout(timer)
  }, [celebrationShown])

  const hero = activeHero(roster)

  // Achievements are checked after every change, so anything that earns one (a quest, a siege, a story choice) pays
  // out right away, and ones already earned before they existed pay out the first time the game opens.
  useEffect(() => {
    const current = activeHero(latestRoster.current)
    const earned = current ? newlyEarned(current) : []
    if (!current || earned.length === 0) {
      return
    }
    updateRoster(setHeroProgress(latestRoster.current, current.id, awardAchievements(current, earned, today)))
    setCelebrations((queue) => [...queue, { kind: 'achievements', achievements: earned }])
  }, [roster, today])

  function showToast(text: string) {
    // A new id restarts the pop animation when actions come quickly.
    setToast((previous) => ({ id: (previous?.id ?? 0) + 1, text }))
  }

  function showTab(next: Tab) {
    setTab(next)
    window.scrollTo(0, 0)
  }

  /** Moves between full screens (quests, create, edit), starting each at the top. */
  function showScreen(next: Screen) {
    setScreen(next)
    window.scrollTo(0, 0)
  }

  function handleSoundToggle(off: boolean) {
    setMuted(off)
    setSoundOff(off)
    playSound('click')
  }

  function handleQuestTap(quest: Quest) {
    const current = activeHero(latestRoster.current)
    if (!current) {
      return
    }
    const wasDone = current.game.completedQuestIds.includes(quest.id)
    playSound(wasDone ? 'questUndone' : 'questDone')
    const multiplier = xpMultiplier(current.holdings, toLocalDay(new Date())) * petXpMultiplier(current.pets, quest.category)
    const buildingCoins = questBuildingBonus(current.holdings, quest.id)?.coins ?? 0
    let updatedGame = toggleQuest(current.game, quest.id, current.heroClass, multiplier, allQuests(current.plan), buildingCoins)
    // Reaching a streak milestone pays out once per streak.
    const streakBefore = currentStreak(current.streak, current.game, current.plan)
    const streakAfter = currentStreak(current.streak, updatedGame, current.plan)
    const milestone = milestoneReached(current.streak, streakBefore, streakAfter)
    const streak = milestone && streakAfter.start ? claimMilestone(current.streak, streakAfter.start, milestone.days) : current.streak
    if (milestone) {
      updatedGame = { ...updatedGame, coins: updatedGame.coins + milestone.coins }
    }
    const petOutcome = afterQuestToggle(
      current.pets,
      {
        day: updatedGame.day,
        questId: quest.id,
        completed: !wasDone,
        allQuestsDone: isPerfectDay(updatedGame, current.plan),
      },
      Math.random,
      eggRules,
    )
    updateRoster(setHeroProgress(latestRoster.current, current.id, { game: updatedGame, pets: petOutcome.state, streak }))

    const xp = Math.abs(updatedGame.totalXp - current.game.totalXp)
    const undoneCoins = (current.game.earnedCoins?.[quest.id] ?? quest.coins) + (current.game.earnedBonusCoins?.[quest.id] ?? 0)
    showToast(wasDone ? `Undone: −${xp} XP · −${undoneCoins} coins` : `+${xp} XP · +${quest.coins + buildingCoins} coins`)

    const newCelebrations: Celebration[] = []
    if (milestone) {
      newCelebrations.push({ kind: 'streak', days: milestone.days, coins: milestone.coins })
    }
    const oldLevel = levelProgress(current.game.totalXp).level
    const newLevel = levelProgress(updatedGame.totalXp).level
    if (newLevel > oldLevel) {
      const oldCompanion = companionAt(oldLevel).name
      const newCompanion = companionAt(newLevel).name
      newCelebrations.push({
        kind: 'level',
        level: newLevel,
        companionGrewInto: newCompanion === oldCompanion ? null : newCompanion,
        warOpened: !warUnlocked(current.game, current.war) && warUnlocked(updatedGame, current.war),
      })
    }
    for (const pet of petOutcome.hatched) {
      newCelebrations.push({ kind: 'hatch', pet, following: petOutcome.state.activePetId === pet.id })
    }
    if (petOutcome.foundEgg) {
      newCelebrations.push({ kind: 'egg', egg: petOutcome.foundEgg, warmthNeeded: eggRules.warmthNeeded(petOutcome.foundEgg.rarity) })
    }
    setCelebrations((queue) => [...queue, ...newCelebrations])
  }

  function handleFollow(petId: string) {
    const current = activeHero(latestRoster.current)
    if (!current) {
      return
    }
    updateRoster(setHeroProgress(latestRoster.current, current.id, { pets: setActivePet(current.pets, petId) }))
    showToast(`${petById(petId)?.name} follows you now`)
  }

  function siegeFor(hero: Hero, rival: Rival, practice: boolean, extraFood = 0): Siege {
    return startSiege(
      {
        rival,
        might: totalMight(mightBreakdown(hero.game, hero.holdings, hero.pets)),
        accuracy: scoutAccuracy(hero.holdings),
        engines: startingEngines(hero.holdings),
        practice,
        extraFood,
      },
      Math.random,
    )
  }

  function handleMarch(rivalId: string) {
    const current = activeHero(latestRoster.current)
    const rival = rivalById(rivalId)
    if (!current || !rival) {
      return
    }
    const { holdings, food } = packSiegeFood(current.holdings)
    updateRoster(
      setHeroProgress(latestRoster.current, current.id, {
        holdings,
        war: { ...current.war, lastRaidDay: toLocalDay(new Date()), activeSiege: siegeFor(current, rival, false, food) },
      }),
    )
  }

  /** Applies a trade to the active hero's pets and costumes; false if they no longer have what it needs. */
  function handleInventory(change: (hero: Hero) => Inventory | null): boolean {
    const current = activeHero(latestRoster.current)
    const changed = current ? change(current) : null
    if (!current || !changed) {
      return false
    }
    updateRoster(setHeroProgress(latestRoster.current, current.id, changed))
    return true
  }

  /** Marches on a friend's kingdom, using the day's raid like any other siege. */
  function handleRaidFriend(ownerUid: string, kingdom: KingdomSnapshot) {
    const current = activeHero(latestRoster.current)
    if (!current) {
      return
    }
    const { holdings, food } = packSiegeFood(current.holdings)
    updateRoster(
      setHeroProgress(latestRoster.current, current.id, {
        holdings,
        war: { ...current.war, lastRaidDay: toLocalDay(new Date()), activeSiege: siegeFor(current, rivalFromKingdom(kingdom, ownerUid), false, food) },
      }),
    )
  }

  /** The practice siege doesn't use up the day's raid, so it can be played (or replayed) any time. */
  function handleStartPractice() {
    const current = activeHero(latestRoster.current)
    if (current) {
      updateRoster(
        setHeroProgress(latestRoster.current, current.id, { war: { ...current.war, activeSiege: siegeFor(current, PRACTICE_RIVAL, true) } }),
      )
      window.scrollTo(0, 0)
    }
  }

  function handleSkipTraining() {
    const current = activeHero(latestRoster.current)
    if (current) {
      updateRoster(setHeroProgress(latestRoster.current, current.id, { war: { ...current.war, trainingDone: true } }))
    }
  }

  function handleStoryChoice(chapterId: string, optionId: string) {
    const current = activeHero(latestRoster.current)
    if (current) {
      updateRoster(setHeroProgress(latestRoster.current, current.id, { story: chooseOption(current.story, chapterId, optionId) }))
    }
  }

  function handleChapterRead(chapterId: string) {
    const current = activeHero(latestRoster.current)
    if (current) {
      updateRoster(setHeroProgress(latestRoster.current, current.id, { story: markRead(current.story, chapterId) }))
    }
  }

  function handleCoinCall(call: CoinFace) {
    advanceSiege(0, (siege) => tossCoin(siege, call, Math.random), 'coinToss')
  }

  /** Applies a siege order or event choice, paying any coins it costs, and banks the result when the siege ends. */
  function advanceSiege(coinCost: number, advance: (siege: Siege) => Siege, sound: SoundName = 'siege') {
    const current = activeHero(latestRoster.current)
    const siege = current?.war.activeSiege
    if (!current || !siege || current.game.coins < coinCost) {
      return
    }
    const next = advance(siege)
    let war: WarRecord = { ...current.war, activeSiege: next }
    let coins = current.game.coins - coinCost
    if (next.outcome && !siege.outcome) {
      // Practice sieges pay their loot but don't count toward the war record; any win counts for the story.
      war = next.practice ? war : recordRaid(war, next.outcome.kind)
      // A friend's kingdom isn't part of the story, so beating it opens no chapters.
      if (next.outcome.kind === 'victory' && !isPlayerRival(next.rivalId)) {
        war = markBeaten(war, next.rivalId)
      }
      const defender = playerOf(next.rivalId)
      if (defender) {
        const outcome = next.outcome.kind
        import('./online')
          .then((online) => online.reportRaid(current.name, defender, outcome))
          .catch(() => showToast('Couldn’t send the raid report to your friend'))
      }
      coins += next.outcome.loot
    }
    updateRoster(setHeroProgress(latestRoster.current, current.id, { war, game: { ...current.game, coins } }))
    playSound(next.outcome && !siege.outcome ? OUTCOME_SOUNDS[next.outcome.kind] : sound)
    if (coinCost > 0) {
      showToast(`Paid ${coinCost} coins`)
    }
  }

  function handleSiegeOrder(actionId: string) {
    const siege = activeHero(latestRoster.current)?.war.activeSiege
    const coinCost = siege ? (availableActions(siege).find((action) => action.id === actionId)?.coinCost ?? 0) : 0
    advanceSiege(coinCost, (current) => takeAction(current, actionId, Math.random))
  }

  function handleSiegeEvent(choiceId: string) {
    const siege = activeHero(latestRoster.current)?.war.activeSiege
    const coinCost = siege ? (eventChoices(siege).find((choice) => choice.id === choiceId)?.coinCost ?? 0) : 0
    advanceSiege(coinCost, (current) => chooseEventOption(current, choiceId, Math.random))
  }

  function handleLeaveSiege() {
    const current = activeHero(latestRoster.current)
    if (current) {
      const finishedTraining = current.war.trainingDone || current.war.activeSiege?.practice === true
      updateRoster(setHeroProgress(latestRoster.current, current.id, { war: { ...current.war, activeSiege: null, trainingDone: finishedTraining } }))
      window.scrollTo(0, 0)
    }
  }

  function handleTestLuck(enabled: boolean) {
    setTestLuck(enabled)
    try {
      window.localStorage.setItem(TEST_LUCK_KEY, enabled ? 'on' : 'off')
    } catch {
      // The switch still works for this visit; it just won't be remembered.
    }
  }

  function dismissCelebration() {
    setCelebrations((queue) => queue.slice(1))
  }

  function followAndDismiss(celebration: Celebration) {
    if (celebration.kind === 'hatch') {
      handleFollow(celebration.pet.id)
    }
    dismissCelebration()
  }

  function handleBuy(itemId: string): PurchaseCheck {
    const current = activeHero(latestRoster.current)
    if (!current) {
      return 'sold-out'
    }
    const outcome = buyItem(current.game, current.holdings, itemId, toLocalDay(new Date()))
    if (outcome.result === 'ok') {
      playSound('coin')
      const item = shopItem(itemId)
      let next = setHeroProgress(latestRoster.current, current.id, { game: outcome.game, holdings: outcome.holdings })
      // New gear goes straight on; the hero can swap back any time from the editor.
      if (item?.equipSlot) {
        next = equipGear(next, current.id, item.equipSlot, item.id)
      }
      updateRoster(next)
      showToast(item?.equipSlot ? `Equipped: ${item.name}` : `Bought: ${item?.name}`)
    }
    return outcome.result
  }

  function handleCollectFood() {
    const current = activeHero(latestRoster.current)
    if (!current) {
      return
    }
    const holdings = collectFood(current.holdings, current.streak.history, today)
    playSound('coin')
    updateRoster(setHeroProgress(latestRoster.current, current.id, { holdings }))
    showToast(`+${holdings.food - current.holdings.food} food`)
  }

  function goToGuideStep(step: number) {
    setGuideStep(step)
    showTab(GUIDE_STEPS[step].tab)
  }

  function endGuide() {
    markGuideDone(window.localStorage)
    setGuideStep(null)
  }

  function handleCreate(draft: HeroDraft) {
    const today = toLocalDay(new Date())
    updateRoster(addHero(latestRoster.current, draft, startingGame(window.localStorage, latestRoster.current, today)))
    showScreen({ kind: 'main' })
  }

  function handleEdit(heroId: string, draft: HeroDraft) {
    updateRoster(editHero(latestRoster.current, heroId, draft))
    showScreen({ kind: 'main' })
  }

  function handleSavePlan(plan: QuestPlan) {
    const current = activeHero(latestRoster.current)
    if (current) {
      updateRoster(setHeroProgress(latestRoster.current, current.id, { plan }))
      showScreen({ kind: 'main' })
      showToast('Your week is set')
    }
  }

  function handleRestore(restored: Roster) {
    updateRoster(restored)
    showScreen({ kind: 'main' })
    setTab('quests')
    showToast(`Restored ${restored.heroes.length === 1 ? '1 hero' : `${restored.heroes.length} heroes`}`)
  }

  function handleSwitch(heroId: string) {
    updateRoster(switchHero(latestRoster.current, heroId))
    showScreen({ kind: 'main' })
    setTab('quests')
  }

  const saveWarning = saveFailed && (
    <p className="warning" role="alert">
      Your progress can't be saved on this device. Private browsing can cause this; try a normal browser tab.
    </p>
  )

  if (!hero || screen.kind === 'create') {
    return (
      <main className="app">
        {saveWarning}
        <CharacterCreator
          key="create"
          mode="create"
          initialDraft={newHeroDraft()}
          onSave={handleCreate}
          ownedGear={[]}
          onCancel={hero ? () => showScreen({ kind: 'main' }) : undefined}
        />
        {!hero && <BackupControls roster={roster} today={today} onRestore={handleRestore} />}
      </main>
    )
  }

  if (screen.kind === 'plan') {
    return (
      <main className="app">
        {saveWarning}
        <QuestPlanner key={hero.id} initialPlan={hero.plan} onSave={handleSavePlan} onCancel={() => showScreen({ kind: 'main' })} />
      </main>
    )
  }

  if (screen.kind === 'week') {
    return (
      <main className="app">
        {saveWarning}
        <WeekSummary hero={hero} onClose={() => showScreen({ kind: 'main' })} />
      </main>
    )
  }

  const heroBeingEdited = screen.kind === 'edit' ? roster.heroes.find((candidate) => candidate.id === screen.heroId) : undefined
  if (heroBeingEdited) {
    return (
      <main className="app">
        {saveWarning}
        <CharacterCreator
          key={heroBeingEdited.id}
          mode="edit"
          initialDraft={draftOf(heroBeingEdited)}
          ownedGear={heroBeingEdited.holdings.gear}
          onSave={(edited) => handleEdit(heroBeingEdited.id, edited)}
          onCancel={() => showScreen({ kind: 'main' })}
        />
      </main>
    )
  }

  return (
    <main className="app with-tabs">
      {/* The journal is written at home, so it shares the kingdom's valley. */}
      <TabBackdrop tab={tab === 'journal' ? 'kingdom' : tab} />
      <nav className="top-bar">
        <span className="app-name">MyFantasyHeroJourney</span>
        <button
          type="button"
          className="heroes-button sound-button"
          data-sfx
          aria-pressed={!soundOff}
          aria-label={soundOff ? 'Sound is off. Turn sound on' : 'Sound is on. Turn sound off'}
          onClick={() => handleSoundToggle(!soundOff)}
        >
          {soundOff ? '🔇' : '🔊'}
        </button>
        <button type="button" className="heroes-button" onClick={() => setScreen({ kind: 'heroes' })}>
          Heroes
        </button>
      </nav>
      {saveWarning}

      {tab === 'quests' && (
        <QuestBoard
          hero={hero}
          potionMultiplier={xpMultiplier(hero.holdings, today)}
          eggRules={eggRules}
          onQuestTap={handleQuestTap}
          onOpenPets={() => showTab('pets')}
          onPlanWeek={() => showScreen({ kind: 'plan' })}
          onOpenWeek={() => showScreen({ kind: 'week' })}
          today={today}
        />
      )}
      {/* Keyed by hero so switching heroes resets the merchant's conversation. */}
      {tab === 'shop' && <Shop key={hero.id} hero={hero} today={today} onBuy={handleBuy} />}
      {tab === 'kingdom' && <Kingdom key={hero.id} hero={hero} today={today} onVisitMerchant={() => showTab('shop')} onCollectFood={handleCollectFood} />}
      {tab === 'war' && (
        <War
          key={hero.id}
          hero={hero}
          today={today}
          testLuck={testLuck}
          onMarch={handleMarch}
          onRaidFriend={handleRaidFriend}
          onInventory={handleInventory}
          onStartPractice={handleStartPractice}
          onSkipTraining={handleSkipTraining}
          onCoinCall={handleCoinCall}
          onOrder={handleSiegeOrder}
          onEventChoice={handleSiegeEvent}
          onLeaveSiege={handleLeaveSiege}
          onStoryChoice={handleStoryChoice}
          onChapterRead={handleChapterRead}
        />
      )}
      {tab === 'journal' && <Journal key={hero.id} hero={hero} />}
      {tab === 'pets' && (
        <Menagerie
          hero={hero}
          rules={eggRules}
          onFollow={handleFollow}
          testLuck={TEST_LUCK_AVAILABLE ? { enabled: testLuck, onChange: handleTestLuck } : null}
        />
      )}

      <nav className="tab-bar" aria-label="Main">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`tab${guideStep !== null && GUIDE_STEPS[guideStep].tab === id ? ' guide-focus' : ''}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => showTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {guideStep !== null && screen.kind === 'main' && (
        <GuideCard
          step={guideStep}
          heroName={hero.name}
          onNext={() => goToGuideStep(guideStep + 1)}
          onBack={() => goToGuideStep(guideStep - 1)}
          onSkip={endGuide}
          onPlanWeek={() => {
            endGuide()
            showScreen({ kind: 'plan' })
          }}
        />
      )}

      {screen.kind === 'heroes' && (
        <HeroMenu
          roster={roster}
          onSwitch={handleSwitch}
          onEdit={(heroId) => showScreen({ kind: 'edit', heroId })}
          onCreate={() => showScreen({ kind: 'create' })}
          onClose={() => setScreen({ kind: 'main' })}
          today={today}
          onRestore={handleRestore}
        />
      )}

      {toast && (
        <div key={toast.id} className="toast" role="status">
          {toast.text}
        </div>
      )}

      {celebrations[0] && (
        <div className="overlay celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
          {celebrations[0].kind === 'level' && (
            <div className="celebration-card">
              <Emblem tone="ember" className="celebration-emblem">
                {celebrations[0].level}
              </Emblem>
              <h2 id="celebration-title">Level up!</h2>
              <p>
                {hero.name} reached level {celebrations[0].level}. Rank: <strong>{rankName(celebrations[0].level)}</strong>
              </p>
              {celebrations[0].companionGrewInto && (
                <p className="celebration-companion">Your companion grew into a {celebrations[0].companionGrewInto}!</p>
              )}
              {celebrations[0].warOpened && <p className="celebration-companion">The War is open! Visit the War tab to take your first castle.</p>}
              <button type="button" className="button-primary full" onClick={dismissCelebration}>
                Onward
              </button>
            </div>
          )}
          {celebrations[0].kind === 'streak' && (
            <div className="celebration-card">
              <Emblem tone="ember" className="celebration-emblem">
                <StreakFlame />
              </Emblem>
              <h2 id="celebration-title">{celebrations[0].days}-day streak!</h2>
              <p>
                {celebrations[0].days} days of keeping your word. The realm rewards the steadfast: <strong>+{celebrations[0].coins} coins</strong>.
              </p>
              <button type="button" className="button-primary full" onClick={dismissCelebration}>
                Keep it burning
              </button>
            </div>
          )}
          {celebrations[0].kind === 'achievements' && <AchievementCelebration achievements={celebrations[0].achievements} onDone={dismissCelebration} />}
          {celebrations[0].kind === 'egg' && (
            <div className={`celebration-card egg-card rarity-border-${celebrations[0].egg.rarity}`}>
              <EggIcon rarity={celebrations[0].egg.rarity} className="celebration-egg" />
              <h2 id="celebration-title">You found an egg!</h2>
              <p className={`celebration-rarity rarity-text-${celebrations[0].egg.rarity}`}>{RARITY_LABELS[celebrations[0].egg.rarity]} egg</p>
              <p>
                A perfect day has its rewards. Every quest you complete warms it; it hatches after{' '}
                {celebrations[0].warmthNeeded === 1 ? '1 quest' : `${celebrations[0].warmthNeeded} quests`}.
              </p>
              <button type="button" className="button-primary full" onClick={dismissCelebration}>
                Keep it warm
              </button>
            </div>
          )}
          {celebrations[0].kind === 'hatch' && (
            <div className={`celebration-card hatch-card rarity-border-${celebrations[0].pet.rarity}`}>
              <PetIcon pet={celebrations[0].pet} className="celebration-pet" />
              <h2 id="celebration-title">Your egg hatched!</h2>
              <p className={`celebration-rarity rarity-text-${celebrations[0].pet.rarity}`}>
                {RARITY_LABELS[celebrations[0].pet.rarity]} · {celebrations[0].pet.name}
              </p>
              <p>{celebrations[0].pet.description}</p>
              <p className="celebration-companion">{bonusLabel(celebrations[0].pet)} while it follows you.</p>
              {celebrations[0].following ? (
                <>
                  <p>It follows you now.</p>
                  <button type="button" className="button-primary full" onClick={dismissCelebration}>
                    Onward
                  </button>
                </>
              ) : (
                <div className="celebration-actions">
                  <button type="button" className="button-secondary" onClick={dismissCelebration}>
                    Later
                  </button>
                  <button type="button" className="button-primary" onClick={() => followAndDismiss(celebrations[0])}>
                    Make it follow me
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default App
