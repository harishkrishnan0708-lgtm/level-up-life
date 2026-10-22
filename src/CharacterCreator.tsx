import { useState, type FormEvent } from 'react'
import './CharacterCreator.css'
import { HERO_CLASSES } from './game'
import {
  BACKSTORY_MAX_LENGTH,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  HELD_ITEMS,
  HERO_TITLES,
  NAME_MAX_LENGTH,
  OUTFIT_COLORS,
  OUTFIT_STYLES,
  RACES,
  RACE_INFO,
  SKIN_TONES,
  displayName,
  raceAndClass,
  isWearable,
  validateHeroName,
  type Appearance,
  type HeroDraft,
  type Race,
  type Option,
} from './hero'
import Portrait from './Portrait'
import { shopItem } from './wares'

interface OptionPickerProps<Id extends string> {
  label: string
  options: readonly Option<Id>[]
  value: Id
  onChange: (value: Id) => void
  /** Premium gear the hero owns; other premium options show as locked. */
  ownedGear?: readonly string[]
}

/** A row of choices; options with a color show as swatches, others as labelled chips. */
function OptionPicker<Id extends string>({ label, options, value, onChange, ownedGear = [] }: OptionPickerProps<Id>) {
  const selected = options.find((option) => option.id === value)
  return (
    <fieldset className="picker">
      <legend>
        {label}
        {selected?.color && <span className="picker-selected">{selected.label}</span>}
      </legend>
      <div className="picker-options" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          if (!isWearable(option, ownedGear)) {
            const price = shopItem(option.id)?.price
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={false}
                aria-disabled={true}
                aria-label={`${option.label}, locked: sold by the merchant for ${price} coins`}
                className="chip locked"
                disabled
              >
                {option.label} · {price} coins
              </button>
            )
          }
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === value}
              aria-label={option.label}
              className={option.color ? 'swatch' : `chip${option.premium ? ' premium' : ''}`}
              style={option.color ? { backgroundColor: option.color } : undefined}
              onClick={() => onChange(option.id)}
            >
              {option.color ? null : `${option.premium ? '✦ ' : ''}${option.label}`}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

interface CharacterCreatorProps {
  initialDraft: HeroDraft
  mode: 'create' | 'edit'
  onSave: (draft: HeroDraft) => void
  /** Omitted when there is no hero to go back to yet. */
  onCancel?: () => void
  /** Gear this hero has bought from the merchant. */
  ownedGear: readonly string[]
}

function CharacterCreator({ initialDraft, mode, onSave, onCancel, ownedGear }: CharacterCreatorProps) {
  const [draft, setDraft] = useState(initialDraft)
  const [showNameError, setShowNameError] = useState(false)
  const nameError = validateHeroName(draft.name)

  function updateDraft(changes: Partial<HeroDraft>) {
    setDraft((current) => ({ ...current, ...changes }))
  }

  function setAppearance<Key extends keyof Appearance>(key: Key, value: Appearance[Key]) {
    setDraft((current) => ({ ...current, appearance: { ...current.appearance, [key]: value } }))
  }

  /** Choosing a race also picks a fitting skin tone, which the player can still change. */
  function chooseRace(race: Race) {
    setDraft((current) => ({ ...current, appearance: { ...current.appearance, race, skin: RACE_INFO[race].skin } }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (nameError) {
      setShowNameError(true)
      document.getElementById('hero-name')?.focus()
      return
    }
    onSave(draft)
  }

  return (
    <form className="creator" onSubmit={handleSubmit} noValidate>
      <header className="creator-preview">
        <div className="creator-portraits">
          <figure>
            <Portrait appearance={draft.appearance} className="creator-portrait" label="Your hero from the front" />
            <figcaption>Front</figcaption>
          </figure>
          <figure>
            <Portrait appearance={draft.appearance} facing="back" className="creator-portrait" label="Your hero from behind" />
            <figcaption>Back</figcaption>
          </figure>
        </div>
        <div>
          <p className="creator-kicker">{mode === 'create' ? 'Forge your hero' : 'Edit your hero'}</p>
          <h1>{draft.name.trim() ? displayName({ name: draft.name.trim(), title: draft.title }) : 'Nameless one'}</h1>
          <p className="creator-class">
            {raceAndClass(draft)}
          </p>
        </div>
      </header>

      <section className="creator-section">
        <label className="field-label" htmlFor="hero-name">
          Name
        </label>
        <input
          id="hero-name"
          className="text-input"
          value={draft.name}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          placeholder="What are you called?"
          aria-invalid={showNameError && nameError !== null}
          aria-describedby="hero-name-error"
          onChange={(event) => updateDraft({ name: event.target.value })}
          onBlur={() => setShowNameError(true)}
        />
        <p id="hero-name-error" className="field-error">
          {showNameError ? nameError : ''}
        </p>
        <OptionPicker label="Title" options={HERO_TITLES} value={draft.title} onChange={(title) => updateDraft({ title })} />
      </section>

      <section className="creator-section">
        <h2>Race</h2>
        <div className="class-grid" role="radiogroup" aria-label="Race">
          {RACES.map((race) => (
            <button
              key={race.id}
              type="button"
              role="radio"
              aria-checked={race.id === draft.appearance.race}
              className="class-card"
              onClick={() => chooseRace(race.id)}
            >
              <span className="class-name">{race.label}</span>
              <span className="class-blurb">{RACE_INFO[race.id].blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="creator-section">
        <h2>Class</h2>
        <div className="class-grid" role="radiogroup" aria-label="Class">
          {HERO_CLASSES.map((heroClass) => (
            <button
              key={heroClass.id}
              type="button"
              role="radio"
              aria-checked={heroClass.id === draft.heroClass}
              className="class-card"
              onClick={() => updateDraft({ heroClass: heroClass.id })}
            >
              <span className="class-name">{heroClass.name}</span>
              <span className="class-blurb">{heroClass.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="creator-section">
        <h2>Appearance</h2>
        <OptionPicker label="Skin" options={SKIN_TONES} value={draft.appearance.skin} onChange={(value) => setAppearance('skin', value)} />
        <OptionPicker label="Hair" options={HAIR_STYLES} value={draft.appearance.hairStyle} onChange={(value) => setAppearance('hairStyle', value)} />
        <OptionPicker label="Hair color" options={HAIR_COLORS} value={draft.appearance.hairColor} onChange={(value) => setAppearance('hairColor', value)} />
        <OptionPicker label="Eyes" options={EYE_COLORS} value={draft.appearance.eyes} onChange={(value) => setAppearance('eyes', value)} />
        <OptionPicker
          label="Clothing"
          options={OUTFIT_STYLES}
          value={draft.appearance.outfit}
          onChange={(value) => setAppearance('outfit', value)}
          ownedGear={ownedGear}
        />
        <OptionPicker label="Clothing color" options={OUTFIT_COLORS} value={draft.appearance.outfitColor} onChange={(value) => setAppearance('outfitColor', value)} />
        <OptionPicker label="Hat" options={HATS} value={draft.appearance.hat} onChange={(value) => setAppearance('hat', value)} ownedGear={ownedGear} />
        <OptionPicker
          label="In hand"
          options={HELD_ITEMS}
          value={draft.appearance.heldItem}
          onChange={(value) => setAppearance('heldItem', value)}
          ownedGear={ownedGear}
        />
        <p className="gear-hint">Gear in dashed frames is locked: Wick sells it at the market. ✦ marks gear you own.</p>
      </section>

      <section className="creator-section">
        <label className="field-label" htmlFor="hero-backstory">
          Backstory <span className="optional">(optional)</span>
        </label>
        <textarea
          id="hero-backstory"
          className="text-input"
          rows={3}
          maxLength={BACKSTORY_MAX_LENGTH}
          placeholder="Where do you come from? What drives you?"
          value={draft.backstory}
          onChange={(event) => updateDraft({ backstory: event.target.value })}
        />
        <p className="char-count">
          {draft.backstory.length} / {BACKSTORY_MAX_LENGTH}
        </p>
      </section>

      <div className="creator-actions">
        {onCancel && (
          <button type="button" className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button-primary">
          {mode === 'create' ? 'Begin your journey' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export default CharacterCreator
