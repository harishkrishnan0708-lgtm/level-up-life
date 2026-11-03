import AchievementBadge from './AchievementBadge'
import type { Achievement } from './achievements'

/** The pop-up for achievements just earned: one shown in full, or several listed together so they don't queue up. */
function AchievementCelebration({ achievements, onDone }: { achievements: readonly Achievement[]; onDone: () => void }) {
  const coins = achievements.reduce((total, achievement) => total + achievement.coins, 0)
  const [only] = achievements
  return (
    <div className="celebration-card achievement-card">
      <p className="achievement-kicker">★ {achievements.length === 1 ? 'Achievement' : `${achievements.length} achievements`} ★</p>
      {achievements.length === 1 ? (
        <>
          <AchievementBadge achievement={only} earned className="celebration-emblem" />
          <h2 id="celebration-title">{only.name}</h2>
          <p>{only.goal}</p>
        </>
      ) : (
        <>
          <h2 id="celebration-title">Deeds remembered</h2>
          <ul className="achievement-list">
            {achievements.map((achievement) => (
              <li key={achievement.id}>
                <AchievementBadge achievement={achievement} earned />
                <span>
                  <strong>{achievement.name}</strong>
                  {achievement.goal}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="celebration-companion">
        <strong>+{coins} coins</strong>
      </p>
      <button type="button" className="button-primary full" onClick={onDone}>
        Onward
      </button>
    </div>
  )
}

export default AchievementCelebration
