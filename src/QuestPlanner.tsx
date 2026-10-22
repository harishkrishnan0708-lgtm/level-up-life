import { useState, type FormEvent } from 'react'
import './QuestPlanner.css'
import type { QuestCategory } from './game'
import {
  MAX_CUSTOM_QUESTS,
  QUEST_NAME_MAX_LENGTH,
  REWARD_SIZES,
  WEEK,
  addCustomQuest,
  allQuests,
  questDays,
  toggleQuestDay,
  validateQuestName,
  type QuestPlan,
  type RewardSize,
} from './questPlan'

interface QuestPlannerProps {
  initialPlan: QuestPlan
  onSave: (plan: QuestPlan) => void
  onCancel: () => void
}

/** Sets which days each quest is on, and adds quests of the hero's own. */
function QuestPlanner({ initialPlan, onSave, onCancel }: QuestPlannerProps) {
  const [plan, setPlan] = useState(initialPlan)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<QuestCategory>('exercise')
  const [size, setSize] = useState<RewardSize>('medium')
  const [nameError, setNameError] = useState<string | null>(null)
  const roomLeft = MAX_CUSTOM_QUESTS - plan.custom.length

  function addQuest(event: FormEvent) {
    event.preventDefault()
    const problem = validateQuestName(name)
    setNameError(problem)
    if (problem) {
      return
    }
    setPlan(addCustomQuest(plan, { name, category, size }))
    setName('')
  }

  return (
    <div className="planner">
      <header className="planner-header">
        <p className="planner-kicker">Your week</p>
        <h1>Plan your quests</h1>
        <p className="planner-hint">
          Tap a day to turn a quest on or off. Each day shows only its own quests, and a day with none is a rest day that never breaks your
          streak.
        </p>
      </header>

      <section className="planner-card" aria-label="Which days each quest is on">
        <div className="week-grid" role="grid">
          <div className="week-row week-head" role="row">
            <span className="week-quest" role="columnheader">
              Quest
            </span>
            {WEEK.map(({ day, letter, name: dayName }) => (
              <span key={day} className="week-day-label" role="columnheader" aria-label={dayName}>
                {letter}
              </span>
            ))}
          </div>
          {allQuests(plan).map((quest) => (
            <div key={quest.id} className="week-row" role="row">
              <span className="week-quest" role="rowheader">
                {quest.name}
              </span>
              {WEEK.map(({ day, name: dayName }) => {
                const on = questDays(plan, quest.id).includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    role="gridcell"
                    className={`week-cell${on ? ' on' : ''}`}
                    aria-pressed={on}
                    aria-label={`${quest.name} on ${dayName}`}
                    onClick={() => setPlan(toggleQuestDay(plan, quest.id, day))}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="planner-card">
        <h2>Add a quest of your own</h2>
        {roomLeft > 0 ? (
          <form className="quest-form" onSubmit={addQuest} noValidate>
            <label htmlFor="quest-name">What will you do?</label>
            <input
              id="quest-name"
              className="text-input"
              value={name}
              maxLength={QUEST_NAME_MAX_LENGTH}
              placeholder="Stretch for 10 minutes"
              aria-invalid={nameError !== null}
              aria-describedby={nameError ? 'quest-name-error' : undefined}
              onChange={(event) => {
                setName(event.target.value)
                setNameError(null)
              }}
            />
            {nameError && (
              <p id="quest-name-error" className="field-error">
                {nameError}
              </p>
            )}
            <fieldset>
              <legend>Kind</legend>
              <div className="plan-choices">
                {(
                  [
                    ['exercise', 'Body'],
                    ['healthy', 'Restoration'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`plan-choice${category === value ? ' chosen' : ''}`}
                    aria-pressed={category === value}
                    onClick={() => setCategory(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Reward</legend>
              <div className="plan-choices">
                {(Object.keys(REWARD_SIZES) as RewardSize[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`plan-choice${size === key ? ' chosen' : ''}`}
                    aria-pressed={size === key}
                    onClick={() => setSize(key)}
                  >
                    {REWARD_SIZES[key].label} · {REWARD_SIZES[key].xp} XP
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="submit" className="button-secondary">
              + Add quest ({roomLeft} left)
            </button>
          </form>
        ) : (
          <p className="planner-hint">You’ve added {MAX_CUSTOM_QUESTS} quests of your own, the most a hero can carry.</p>
        )}
      </section>

      <div className="planner-actions">
        <button type="button" className="button-primary" onClick={() => onSave({ ...plan, scheduled: true })}>
          Save my week
        </button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default QuestPlanner
