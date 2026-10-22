import { dailyRumour } from './clues'
import { companionAt, hasClassBonus, heroClassInfo, levelProgress, questXp, rankName, type Quest, type QuestCategory } from './game'
import EggIcon from './EggIcon'
import { displayName, raceAndClass, type Hero } from './hero'
import { petById, petXpMultiplier, type EggRules } from './pets'
import Portrait from './Portrait'
import { WEEK, questsOn, weekdayOf } from './questPlan'
import { currentStreak, questsNeeded } from './streak'
import StreakFlame from './StreakFlame'

function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

const CATEGORY_TITLES: Record<QuestCategory, string> = {
  exercise: 'Trials of the body',
  healthy: 'Rites of restoration',
}

interface QuestBoardProps {
  hero: Hero
  /** 2 while a potion is active, otherwise 1. */
  potionMultiplier: number
  eggRules: EggRules
  onQuestTap: (quest: Quest) => void
  onOpenPets: () => void
  onPlanWeek: () => void
  today: string
}

function QuestBoard({ hero, potionMultiplier, eggRules, onQuestTap, onOpenPets, onPlanWeek, today }: QuestBoardProps) {
  const { game, pets } = hero
  const progress = levelProgress(game.totalXp)
  const classInfo = heroClassInfo(hero.heroClass)
  const companion = companionAt(progress.level)
  const pet = petById(pets.activePetId)
  const todaysQuests = questsOn(hero.plan, game.day)
  const doneCount = todaysQuests.filter((quest) => game.completedQuestIds.includes(quest.id)).length
  const streak = currentStreak(hero.streak, game, hero.plan)
  const needed = questsNeeded(todaysQuests.length)
  const categories = (Object.keys(CATEGORY_TITLES) as QuestCategory[]).filter((category) => todaysQuests.some((quest) => quest.category === category))
  const questsUntilHatch = Math.min(...pets.eggs.map((egg) => Math.max(0, eggRules.warmthNeeded(egg.rarity) - egg.warmedBy.length)))

  return (
    <>
      <header className="hero-card">
        <div className="hero-top">
          <div className="portrait-frame">
            <Portrait appearance={hero.appearance} className="hero-portrait" framing="face" label={`Portrait of ${hero.name}`} />
          </div>
          <div className="hero-info">
            <h1>{displayName(hero)}</h1>
            <p className="hero-meta">
              Level {progress.level} {rankName(progress.level)} · {raceAndClass(hero)}
            </p>
            <p className="hero-companion">
              Companion: {companion.name}
              {pet && ` · Pet: ${pet.name}`}
            </p>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="xp-wrap">
            <div
              className="xp-bar"
              role="progressbar"
              aria-label="XP toward next level"
              aria-valuemin={0}
              aria-valuemax={progress.xpForNextLevel}
              aria-valuenow={progress.xpIntoLevel}
            >
              <div className="xp-fill" style={{ width: `${(progress.xpIntoLevel / progress.xpForNextLevel) * 100}%` }} />
            </div>
            <p className="xp-label">
              {progress.xpIntoLevel} / {progress.xpForNextLevel} XP to level {progress.level + 1}
            </p>
          </div>
          <div className="coins" aria-label={`${game.coins} coins`}>
            <span className="coin-icon" aria-hidden="true" /> {game.coins}
          </div>
        </div>
      </header>

      {pets.eggs.length > 0 && (
        <button type="button" className="nest-strip" onClick={onOpenPets}>
          <span className="nest-strip-eggs" aria-hidden="true">
            {pets.eggs.slice(0, 4).map((egg) => (
              <EggIcon key={egg.id} rarity={egg.rarity} />
            ))}
          </span>
          <span>
            {pets.eggs.length === 1 ? '1 egg' : `${pets.eggs.length} eggs`} warming · next hatches in{' '}
            {questsUntilHatch === 1 ? '1 quest' : `${questsUntilHatch} quests`}
          </span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      {potionMultiplier > 1 && hero.holdings.xpBoostUntil && (
        <p className="boost-banner">
          Double XP is active
          {hero.holdings.xpBoostUntil === game.day ? ' until the end of today' : ` through ${formatDay(hero.holdings.xpBoostUntil)}`}.
        </p>
      )}

      <section className="today">
        <h2>Today's quests</h2>
        <p className="today-count">
          {todaysQuests.length === 0
            ? `A rest day: nothing is scheduled for ${WEEK.find(({ day }) => day === weekdayOf(game.day))?.name}. Recover well.`
            : doneCount === todaysQuests.length
              ? 'Every trial conquered. Rest well, champion.'
              : `${doneCount} of ${todaysQuests.length} done · tap a quest when you finish it`}
        </p>
        <div className={`streak-bar${streak.todayKept ? ' kept' : ''}`}>
          <StreakFlame lit={streak.days > 0} />
          <div className="streak-text">
            <p className="streak-count">{streak.days === 1 ? '1-day streak' : `${streak.days}-day streak`}</p>
            <p className="streak-hint">
              {todaysQuests.length === 0
                ? 'Rest days never break a streak.'
                : streak.todayKept
                  ? 'Today counts. Your streak is safe.'
                  : `Finish ${needed} of today’s ${todaysQuests.length} quests to ${streak.days > 0 ? 'keep it going' : 'start one'}.`}
              {streak.savedByCandle && ' A Candle of Respite burned for you.'}
            </p>
          </div>
          <div className="streak-extras">
            {hero.streak.best > 0 && <span>Best {Math.max(hero.streak.best, streak.days)}</span>}
            {hero.holdings.candles > 0 && <span>Candles {hero.holdings.candles}</span>}
          </div>
        </div>
        {!hero.plan.scheduled && (
          <button type="button" className="plan-banner" onClick={onPlanWeek}>
            <strong>Set up your week</strong>
            <span>Choose which days each quest is on, and add quests of your own.</span>
          </button>
        )}
      </section>

      {categories.map((category) => (
        <section key={category} className="quest-group">
          <h3>{CATEGORY_TITLES[category]}</h3>
          <ul>
            {todaysQuests.filter((quest) => quest.category === category).map((quest) => {
              const done = game.completedQuestIds.includes(quest.id)
              const bonus = hasClassBonus(quest, hero.heroClass)
              const petMultiplier = petXpMultiplier(pets, quest.category)
              const xp = Math.round(questXp(quest, hero.heroClass) * potionMultiplier * petMultiplier)
              return (
                <li key={quest.id}>
                  <button type="button" className={`quest${done ? ' done' : ''}`} aria-pressed={done} onClick={() => onQuestTap(quest)}>
                    <span className="quest-text">
                      <span className="quest-trial">{quest.trial}</span>
                      <span className="quest-name">{quest.name}</span>
                      <span className="quest-reward">
                        {done ? 'Done! Tap to undo' : `+${xp} XP · +${quest.coins} coins`}
                        {bonus && !done && <span className="bonus-tag">{classInfo.name} bonus</span>}
                        {pet && petMultiplier > 1 && !done && (
                          <span className="bonus-tag pet-tag">
                            {pet.name} +{Math.round(pet.bonus * 100)}%
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="quest-check" aria-hidden="true">
                      {done ? '✓' : ''}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {hero.plan.scheduled && (
        <button type="button" className="button-secondary small plan-edit" onClick={onPlanWeek}>
          Edit your week and quests
        </button>
      )}

      <aside className="rumour" aria-label="Tavern rumour">
        <p className="rumour-label">Overheard at the tavern</p>
        <p className="rumour-text">“{dailyRumour(today, hero.story)}”</p>
      </aside>
    </>
  )
}

export default QuestBoard
