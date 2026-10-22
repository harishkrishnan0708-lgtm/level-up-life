import { useState } from 'react'
import './Story.css'
import type { Hero } from './hero'
import { PRACTICE_RIVAL } from './raids'
import { CHAPTERS, chapterStatus, unlockHint, type Chapter } from './story'
import StoryReader from './StoryReader'

const STATUS_LABELS = { new: 'New', read: 'Read', unwritten: 'Being written', locked: 'Locked' } as const


interface ChronicleProps {
  hero: Hero
  onChoose: (chapterId: string, optionId: string) => void
  onFinish: (chapterId: string) => void
  onRetakeFort: () => void
}

/** The story: chapters unlocked by beating rivals, read as a visual novel. */
function Chronicle({ hero, onChoose, onFinish, onRetakeFort }: ChronicleProps) {
  const [reading, setReading] = useState<Chapter | null>(null)
  // Show the chapters opened so far and the next locked one, so the story's shape stays a surprise.
  const statuses = CHAPTERS.map((chapter) => chapterStatus(chapter, hero.war, hero.story))
  const firstLocked = statuses.indexOf('locked')
  const shown = firstLocked === -1 ? CHAPTERS : CHAPTERS.slice(0, firstLocked + 1)

  return (
    <section className="chronicle" aria-labelledby="chronicle-title">
      <h3 id="chronicle-title">The Chronicle</h3>
      <p className="chronicle-hint">Every lord you defeat opens a new chapter of the story.</p>
      <ol className="chapter-list">
        {shown.map((chapter, index) => {
          const status = statuses[index]
          const readable = status === 'new' || status === 'read'
          return (
            <li key={chapter.id} className={`chapter chapter-${status}`}>
              <button type="button" className="chapter-button" disabled={!readable} onClick={() => setReading(chapter)}>
                <span className="chapter-number">{chapter.number}</span>
                <span className="chapter-text">
                  <span className="chapter-title">{status === 'locked' ? '???' : chapter.title}</span>
                  <span className="chapter-unlock">{status === 'locked' ? `${unlockHint(chapter)} to unlock` : `Act ${chapter.act}`}</span>
                </span>
                <span className={`chapter-status status-${status}`}>{STATUS_LABELS[status]}</span>
              </button>
              {status === 'locked' && chapter.unlockedBy === PRACTICE_RIVAL.id && !hero.war.activeSiege && (
                <button type="button" className="button-secondary small chapter-retake" onClick={onRetakeFort}>
                  Retake the Old Watch Fort · doesn’t use today’s raid
                </button>
              )}
            </li>
          )
        })}
      </ol>
      {reading && (
        <StoryReader
          key={reading.id}
          chapter={reading}
          hero={hero}
          onChoose={(optionId) => onChoose(reading.id, optionId)}
          onFinish={() => onFinish(reading.id)}
          onClose={() => setReading(null)}
        />
      )}
    </section>
  )
}

export default Chronicle
