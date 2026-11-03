import { useMemo } from 'react'
import './Achievements.css'
import './Journal.css'
import AchievementBadge from './AchievementBadge'
import { ACHIEVEMENTS, ACHIEVEMENT_KINDS } from './achievements'
import { characterLook, type Character, type CharacterState } from './cast'
import type { Hero } from './hero'
import { paintFigure } from './heroPixels'
import { mothClues, peopleMet, storySoFar } from './journalPages'
import { paintWickPortrait } from './marketPixels'
import PixelArt from './PixelArt'

const WICK_PORTRAIT = paintWickPortrait()
const ROMAN = ['', 'I', 'II', 'III']

/** A character's face for their Journal page, drawn as they look now. */
function Face({ who, state }: { who: Character; state: CharacterState }) {
  const grid = useMemo(() => {
    if (who === 'wick') {
      return WICK_PORTRAIT
    }
    const { appearance, features } = characterLook(who, state)
    return paintFigure(appearance, 'stand', features)
  }, [who, state])
  return <PixelArt grid={grid} className={`journal-face${state.standing === 'dead' ? ' departed' : ''}`} viewBox={who === 'wick' ? undefined : '5 0 22 22'} />
}

function shortDate(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Every achievement, grouped by kind: earned ones lit with the day earned, the rest showing how to earn them. */
function Achievements({ earned }: { earned: Record<string, string> }) {
  const count = ACHIEVEMENTS.filter(({ id }) => earned[id]).length
  return (
    <section className="journal-page" aria-labelledby="journal-achievements">
      <h3 id="journal-achievements">Achievements</h3>
      <p className="achievement-count">
        {count} of {ACHIEVEMENTS.length} earned
      </p>
      {ACHIEVEMENT_KINDS.map(({ kind, title }) => (
        <div key={kind} className="achievement-group">
          <h4>{title}</h4>
          <ul className="achievement-grid">
            {ACHIEVEMENTS.filter((achievement) => achievement.kind === kind).map((achievement) => {
              const day = earned[achievement.id]
              const hidden = !day && kind === 'secret'
              return (
                <li key={achievement.id} className={day ? 'earned' : 'locked'}>
                  <AchievementBadge achievement={achievement} earned={Boolean(day)} />
                  <span>
                    <strong>{hidden ? '???' : achievement.name}</strong>
                    {hidden ? 'A secret. Your choices will reveal it.' : achievement.goal}
                    {day ? <span className="achievement-date"> · {shortDate(day)}</span> : ` · ${achievement.coins} coins`}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}

/** The hero's journal: the story so far, the people met, and what's known about the Moth. */
function Journal({ hero }: { hero: Hero }) {
  const entries = storySoFar(hero.story)
  const people = peopleMet(hero.story)
  const clues = mothClues(hero.story, hero.war)

  if (entries.length === 0 && clues.length === 0) {
    return (
      <div className="journal-book">
        <header className="journal-header">
          <h2>{hero.name}’s Journal</h2>
        </header>
        <section className="journal-page journal-empty">
          <p>The pages are blank for now.</p>
          <p className="journal-hint">Take the Old Watch Fort from the War tab to begin your story. Everything you learn will be written here.</p>
        </section>
        <Achievements earned={hero.achievements} />
      </div>
    )
  }

  return (
    <div className="journal-book">
      <header className="journal-header">
        <h2>{hero.name}’s Journal</h2>
        <p className="journal-hint">The story so far, the people you’ve met, and what you know about them.</p>
      </header>

      {entries.length > 0 && (
        <section className="journal-page" aria-labelledby="journal-story">
          <h3 id="journal-story">The story so far</h3>
          <ol className="journal-entries">
            {entries.map((entry) => (
              <li key={entry.chapterId}>
                <p className="journal-chapter">
                  Act {ROMAN[entry.act]} · {entry.label}: {entry.title}
                </p>
                <p>{entry.summary}</p>
                {entry.outcome && <p className="journal-outcome">{entry.outcome}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {people.length > 0 && (
        <section className="journal-page" aria-labelledby="journal-people">
          <h3 id="journal-people">People you’ve met</h3>
          <ul className="journal-people">
            {people.map((person) => (
              <li key={person.who} className="journal-person">
                <Face who={person.who} state={person.state} />
                <div className="journal-person-text">
                  <p className="journal-name">{person.name}</p>
                  <p className="journal-role">{person.role}</p>
                  <p className="journal-standing">
                    {person.standing}
                    {person.feeling && ` · ${person.feeling}`}
                  </p>
                  <ul className="journal-facts">
                    {person.facts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {clues.length > 0 && (
        <section className="journal-page journal-mystery" aria-labelledby="journal-moth">
          <h3 id="journal-moth">The Moth</h3>
          <p className="journal-hint">Who is arming every side? What you’ve pieced together so far:</p>
          <ul className="journal-facts">
            {clues.map((clue) => (
              <li key={clue}>{clue}</li>
            ))}
          </ul>
        </section>
      )}

      <Achievements earned={hero.achievements} />
    </div>
  )
}

export default Journal
