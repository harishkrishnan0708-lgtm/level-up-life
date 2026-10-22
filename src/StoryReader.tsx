import { useCallback, useMemo, useState } from 'react'
import type { Hero } from './hero'
import { paintWickPortrait } from './marketPixels'
import PixelArt from './PixelArt'
import Portrait from './Portrait'
import { CHAPTERS, SPEAKER_LOOKS, SPEAKER_NAMES, chapterScript, unlockHint, type Chapter, type StoryLine } from './story'
import TypedText from './TypedText'

const WICK_PORTRAIT = paintWickPortrait()

const ROMAN = ['', 'I', 'II', 'III']

function SpeakerPortrait({ line, hero }: { line: StoryLine; hero: Hero }) {
  if (line.speaker === 'narrator') {
    return null
  }
  if (line.speaker === 'wick') {
    return <PixelArt grid={WICK_PORTRAIT} className="story-portrait" label="Wick" />
  }
  const appearance = line.speaker === 'hero' ? hero.appearance : SPEAKER_LOOKS[line.speaker]
  return <Portrait appearance={appearance} className="story-portrait" framing="face" />
}

interface StoryReaderProps {
  chapter: Chapter
  hero: Hero
  onChoose: (optionId: string) => void
  onFinish: () => void
  onClose: () => void
}

/** Plays a chapter of the Chronicle as a visual novel: one line at a time, a choice partway, and the ending. */
function StoryReader({ chapter, hero, onChoose, onFinish, onClose }: StoryReaderProps) {
  const choiceId = hero.story.choices[chapter.id]
  const { lines, choiceAt } = useMemo(() => chapterScript(chapter, choiceId), [chapter, choiceId])
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState(false)
  const markTyped = useCallback(() => setTyped(true), [])

  const choicePending = choiceAt !== null && !choiceId
  const choosing = choicePending && index >= lines.length
  const finished = !choosing && index >= lines.length
  const line = lines[Math.min(index, lines.length - 1)]

  function next() {
    if (index + 1 >= lines.length && !choicePending) {
      onFinish()
    }
    setTyped(false)
    setIndex(index + 1)
  }

  const speakerName = line.speaker === 'hero' ? hero.name : line.speaker === 'narrator' ? null : SPEAKER_NAMES[line.speaker]
  const chosen = chapter.choice?.options.find(({ id }) => id === choiceId)
  const nextChapter = CHAPTERS[CHAPTERS.indexOf(chapter) + 1]

  return (
    <div className="story-reader" role="dialog" aria-modal="true" aria-labelledby="story-title">
      <header className="story-header">
        <div>
          <p className="story-act">
            Act {ROMAN[chapter.act]} · Chapter {chapter.number}
          </p>
          <h2 id="story-title">{chapter.title}</h2>
        </div>
        <button type="button" className="story-close" aria-label="Close the Chronicle" onClick={onClose}>
          ✕
        </button>
      </header>

      {finished ? (
        <section className="story-end">
          <p className="story-act">End of Chapter {chapter.number}</p>
          <h3>{chapter.title}</h3>
          {chosen && <p className="story-chose">You chose: {chosen.label.toLowerCase()}.</p>}
          {nextChapter && (
            <p className="story-hint">
              {unlockHint(nextChapter)} to open Chapter {nextChapter.number}.
            </p>
          )}
          <button type="button" className="button-primary" onClick={onClose}>
            Back to the Chronicle
          </button>
        </section>
      ) : (
        <>
          <div className="story-stage">{!choosing && <SpeakerPortrait line={line} hero={hero} />}</div>
          <section className={`story-box${line.speaker === 'narrator' && !choosing ? ' story-narration' : ''}`} aria-live="polite">
            {choosing && chapter.choice ? (
              <>
                <p className="story-prompt">{chapter.choice.prompt}</p>
                <div className="story-options">
                  {chapter.choice.options.map((option) => (
                    <button key={option.id} type="button" className="button-secondary" onClick={() => onChoose(option.id)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="story-hint">Choose carefully. You can’t take it back.</p>
              </>
            ) : (
              <>
                {speakerName && <p className="story-speaker">{speakerName}</p>}
                <TypedText key={index} text={line.text.replaceAll('{hero}', hero.name)} onDone={markTyped} />
                <button type="button" className="button-secondary small story-next" onClick={next} disabled={!typed}>
                  {index + 1 < lines.length || choicePending ? 'Next ▸' : 'Finish ▸'}
                </button>
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default StoryReader
