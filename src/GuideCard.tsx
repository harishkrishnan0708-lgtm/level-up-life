import { GUIDE_STEPS } from './guide'

interface GuideCardProps {
  step: number
  heroName: string
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onPlanWeek: () => void
}

/** One stop on the first-time tour, sitting above the tab bar so the screen it describes shows behind it. */
function GuideCard({ step, heroName, onNext, onBack, onSkip, onPlanWeek }: GuideCardProps) {
  const { title, text } = GUIDE_STEPS[step]
  const last = step === GUIDE_STEPS.length - 1
  return (
    <div className="guide-shade">
      <section className="guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-title" aria-describedby="guide-text">
        <p className="guide-progress">
          {step + 1} of {GUIDE_STEPS.length}
        </p>
        <h2 id="guide-title">{title}</h2>
        <p id="guide-text">{text.replaceAll('{hero}', heroName)}</p>
        <div className="guide-actions">
          {last ? (
            <>
              <button type="button" className="button-secondary small" onClick={onSkip}>
                Maybe later
              </button>
              <button type="button" className="button-primary small" onClick={onPlanWeek}>
                Plan my week
              </button>
            </>
          ) : (
            <>
              <button type="button" className="guide-skip" onClick={onSkip}>
                Skip tour
              </button>
              {step > 0 && (
                <button type="button" className="button-secondary small" onClick={onBack}>
                  Back
                </button>
              )}
              <button type="button" className="button-primary small" onClick={onNext}>
                Next
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default GuideCard
