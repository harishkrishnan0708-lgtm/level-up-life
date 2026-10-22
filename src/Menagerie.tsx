import './Menagerie.css'
import EggIcon from './EggIcon'
import type { Hero } from './hero'
import PetIcon from './PetIcon'
import { EGG_CHANCE, PETS, PET_RARITIES, RARITY_CHANCES, RARITY_LABELS, bonusLabel, petById, type EggRules } from './pets'

interface MenagerieProps {
  hero: Hero
  rules: EggRules
  onFollow: (petId: string) => void
  /** Only offered on the development server, so eggs can be seen without waiting days. */
  testLuck: { enabled: boolean; onChange: (enabled: boolean) => void } | null
}

function Menagerie({ hero, rules, onFollow, testLuck }: MenagerieProps) {
  const { pets } = hero
  const activePet = petById(pets.activePetId)
  const foundCount = PETS.filter((pet) => pets.owned[pet.id]).length

  return (
    <div className="menagerie">
      <header className="menagerie-header">
        <h2>Menagerie</h2>
        <p className="menagerie-count">
          {foundCount} of {PETS.length} creatures found
        </p>
      </header>

      <section className={`active-pet${activePet ? ` rarity-${activePet.rarity}` : ''}`} aria-label="Pet following you">
        {activePet ? (
          <>
            <PetIcon pet={activePet} className="active-pet-icon" />
            <div>
              <p className="active-pet-label">Following you</p>
              <p className="active-pet-name">{activePet.name}</p>
              <p className="active-pet-bonus">{bonusLabel(activePet)}</p>
            </div>
          </>
        ) : (
          <p className="active-pet-empty">No creature follows you yet. Hatch an egg and it will.</p>
        )}
      </section>

      <section className="nest">
        <h3>Nest</h3>
        {pets.eggs.length === 0 ? (
          <p className="nest-empty">
            No eggs. Finish all 7 quests in a day for a {Math.round(EGG_CHANCE * 100)}% chance to find one.
          </p>
        ) : (
          <ul className="egg-list">
            {pets.eggs.map((egg) => {
              const needed = rules.warmthNeeded(egg.rarity)
              const warmth = Math.min(egg.warmedBy.length, needed)
              return (
                <li key={egg.id} className="egg-row">
                  <EggIcon rarity={egg.rarity} progress={warmth / needed} className="egg-row-icon" />
                  <div className="egg-row-text">
                    <p className={`egg-rarity rarity-text-${egg.rarity}`}>{RARITY_LABELS[egg.rarity]} egg</p>
                    <div
                      className="warmth-bar"
                      role="progressbar"
                      aria-label={`${RARITY_LABELS[egg.rarity]} egg warmth`}
                      aria-valuemin={0}
                      aria-valuemax={needed}
                      aria-valuenow={warmth}
                    >
                      <div className="warmth-fill" style={{ width: `${(warmth / needed) * 100}%` }} />
                    </div>
                    <p className="egg-progress">
                      {warmth} / {needed} quests · hatches in {needed - warmth}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <p className="nest-hint">Every quest you complete warms every egg in your nest.</p>
      </section>

      {[...PET_RARITIES].reverse().map((rarity) => (
        <section key={rarity} className="pet-group">
          <h3 className={`rarity-text-${rarity}`}>
            {RARITY_LABELS[rarity]} <span className="pet-group-odds">{Math.round(RARITY_CHANCES[rarity] * 100)}% of eggs</span>
          </h3>
          <ul className="pet-grid">
            {PETS.filter((pet) => pet.rarity === rarity).map((pet) => {
              const count = pets.owned[pet.id] ?? 0
              const isActive = pets.activePetId === pet.id
              return (
                <li key={pet.id} className={`pet-card rarity-${pet.rarity}${count ? '' : ' unfound'}`}>
                  <PetIcon pet={pet} found={count > 0} />
                  <p className="pet-name">{count ? pet.name : '???'}</p>
                  <p className="pet-bonus">{bonusLabel(pet)}</p>
                  {count > 0 && (
                    <>
                      {count > 1 && <p className="pet-count">×{count}</p>}
                      <button
                        type="button"
                        className={isActive ? 'follow-button following' : 'follow-button'}
                        aria-pressed={isActive}
                        disabled={isActive}
                        onClick={() => onFollow(pet.id)}
                      >
                        {isActive ? 'Following' : 'Follow me'}
                      </button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {testLuck && (
        <label className="test-luck">
          <input type="checkbox" checked={testLuck.enabled} onChange={(event) => testLuck.onChange(event.target.checked)} />
          <span>
            <strong>Test luck</strong> (test server only, never in the real app): every perfect day drops an egg, eggs hatch
            after 1 quest, and you can raid as often as you like.
          </span>
        </label>
      )}
    </div>
  )
}

export default Menagerie
