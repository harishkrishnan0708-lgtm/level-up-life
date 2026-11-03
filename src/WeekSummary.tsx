import './WeekSummary.css'
import type { Hero } from './hero'
import StreakFlame from './StreakFlame'
import { weekSummary, type QuestMark, type SummaryDay } from './weekTally'

const MARK_SYMBOLS: Record<QuestMark, string> = { done: '✓', missed: '·', off: '', upcoming: '', unknown: '?' }
const MARK_WORDS: Record<QuestMark, string> = { done: 'done', missed: 'missed', off: 'not scheduled', upcoming: 'still to do', unknown: 'not recorded' }
const DAY_WORDS: Record<SummaryDay['result'], string> = {
  kept: 'streak kept',
  saved: 'saved by a candle',
  missed: 'streak missed',
  rest: 'rest day',
  today: 'today',
  upcoming: 'still to come',
  before: 'before your hero began',
}

function shortDate(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** How each day went for the streak, shown under its letter. */
function DayMark({ result }: { result: SummaryDay['result'] }) {
  if (result === 'kept' || result === 'saved') {
    return <StreakFlame className="summary-flame" />
  }
  return <span className="summary-day-mark">{result === 'missed' ? '✕' : result === 'rest' ? 'z' : ''}</span>
}

/** This week at a glance: each quest by day, the streak, and what the week has earned. */
function WeekSummary({ hero, onClose }: { hero: Hero; onClose: () => void }) {
  const summary = weekSummary(hero.streak, hero.game, hero.plan)
  const { days, rows } = summary
  const percent = summary.questsPlanned > 0 ? Math.round((summary.questsDone / summary.questsPlanned) * 100) : 0

  return (
    <div className="planner week-summary">
      <header className="planner-header">
        <p className="planner-kicker">This week</p>
        <h1>
          {shortDate(days[0].day)} – {shortDate(days[6].day)}
        </h1>
        <p className="planner-hint">Each quest by day: ✓ done, · missed. A flame marks a day that kept your streak.</p>
      </header>

      <section className="planner-card" aria-label="Quests by day">
        <div className="week-grid" role="grid">
          <div className="week-row week-head" role="row">
            <span className="week-quest" role="columnheader">
              Quest
            </span>
            {days.map(({ day, letter, name, result }) => (
              <span key={day} className={`week-day-label${result === 'today' ? ' today' : ''}`} role="columnheader" aria-label={`${name}, ${DAY_WORDS[result]}`}>
                {letter}
                <DayMark result={result} />
              </span>
            ))}
          </div>
          {rows.length === 0 && <p className="summary-empty">No quests are scheduled this week.</p>}
          {rows.map(({ quest, marks }) => (
            <div key={quest.id} className="week-row" role="row">
              <span className="week-quest" role="rowheader">
                {quest.name}
              </span>
              {marks.map((mark, index) => (
                <span key={days[index].day} role="gridcell" className={`summary-cell ${mark}`} aria-label={`${days[index].name}: ${MARK_WORDS[mark]}`}>
                  {MARK_SYMBOLS[mark]}
                </span>
              ))}
            </div>
          ))}
        </div>
        {summary.missingDetail && <p className="summary-note">? marks days played before the game kept track of each quest. From today on, every day is recorded.</p>}
      </section>

      <section className="planner-card summary-totals" aria-label="Week totals">
        <p>
          <span>Days kept</span>
          <strong>
            {summary.daysKept} of {summary.daysWithQuests}
          </strong>
        </p>
        <p>
          <span>Quests done</span>
          <strong>
            {summary.questsDone} of {summary.questsPlanned}
            {summary.questsPlanned > 0 && ` (${percent}%)`}
          </strong>
        </p>
        <p>
          <span>Earned</span>
          <strong>
            +{summary.xp} XP · +{summary.coins} coins
          </strong>
        </p>
        <p>
          <span>Best quest</span>
          <strong>{summary.bestQuest ? `${summary.bestQuest.quest.name} (${summary.bestQuest.done} of ${summary.bestQuest.planned})` : 'None yet'}</strong>
        </p>
      </section>

      <div className="planner-actions">
        <button type="button" className="button-secondary" onClick={onClose}>
          Back to quests
        </button>
      </div>
    </div>
  )
}

export default WeekSummary
