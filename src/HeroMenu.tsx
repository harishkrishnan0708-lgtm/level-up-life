import { levelProgress } from './game'
import { displayName, raceAndClass, type Roster } from './hero'
import BackupControls from './BackupControls'
import Portrait from './Portrait'

interface HeroMenuProps {
  roster: Roster
  onSwitch: (heroId: string) => void
  onEdit: (heroId: string) => void
  onCreate: () => void
  onClose: () => void
  today: string
  onRestore: (roster: Roster) => void
}

/** Lists every hero so the player can switch, edit the active one, or create another. */
function HeroMenu({ roster, onSwitch, onEdit, onCreate, onClose, today, onRestore }: HeroMenuProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="hero-menu-title" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <h2 id="hero-menu-title">Your heroes</h2>
          <button type="button" className="close-button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <ul className="hero-list">
          {roster.heroes.map((hero) => {
            const isActive = hero.id === roster.activeHeroId
            return (
              <li key={hero.id} className={`hero-row${isActive ? ' active' : ''}`}>
                <button type="button" className="hero-row-main" aria-current={isActive} onClick={() => onSwitch(hero.id)}>
                  <Portrait appearance={hero.appearance} className="hero-row-portrait" framing="face" />
                  <span className="hero-row-text">
                    <span className="hero-row-name">{displayName(hero)}</span>
                    <span className="hero-row-meta">
                      Level {levelProgress(hero.game.totalXp).level} {raceAndClass(hero)}
                      {isActive ? ' · Playing now' : ''}
                    </span>
                  </span>
                </button>
                <button type="button" className="button-secondary small" onClick={() => onEdit(hero.id)}>
                  Edit
                </button>
              </li>
            )
          })}
        </ul>
        <button type="button" className="button-primary full" onClick={onCreate}>
          + Create a new hero
        </button>
        <BackupControls roster={roster} today={today} onRestore={onRestore} />
      </div>
    </div>
  )
}

export default HeroMenu
