import { describe, expect, it } from 'vitest'
import { newGame, toggleQuest } from './game'
import {
  EMPTY_ROSTER,
  activeHero,
  addHero,
  displayName,
  editHero,
  equipGear,
  loadRoster,
  newHeroDraft,
  saveRoster,
  setHeroProgress,
  startingGame,
  switchHero,
  raceAndClass,
  validateHeroName,
  type HeroDraft,
} from './hero'

const TODAY = '2026-10-06'

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

function draft(overrides: Partial<HeroDraft> = {}): HeroDraft {
  return { ...newHeroDraft(), name: 'Harish', ...overrides }
}

describe('hero names', () => {
  it('rejects blank and overly long names', () => {
    expect(validateHeroName('   ')).not.toBeNull()
    expect(validateHeroName('x'.repeat(21))).not.toBeNull()
    expect(validateHeroName('Harish')).toBeNull()
  })

  it('adds the title after the name', () => {
    expect(displayName({ name: 'Harish', title: 'the Unbroken' })).toBe('Harish the Unbroken')
    expect(displayName({ name: 'Harish', title: '' })).toBe('Harish')
  })
})

describe('roster of heroes', () => {
  it('makes a newly created hero the active one', () => {
    const roster = addHero(EMPTY_ROSTER, draft({ name: '  Harish  ' }), newGame(TODAY))
    expect(activeHero(roster)?.name).toBe('Harish')
  })

  it('keeps each hero’s progress separate', () => {
    let roster = addHero(EMPTY_ROSTER, draft({ name: 'First' }), newGame(TODAY))
    const firstId = roster.activeHeroId!
    roster = setHeroProgress(roster, firstId, { game: toggleQuest(newGame(TODAY), 'lift', 'warrior') })
    roster = addHero(roster, draft({ name: 'Second' }), newGame(TODAY))
    expect(activeHero(roster)?.game.totalXp).toBe(0)
    roster = switchHero(roster, firstId)
    expect(activeHero(roster)?.game.totalXp).toBe(45)
  })

  it('editing a hero keeps their progress', () => {
    let roster = addHero(EMPTY_ROSTER, draft(), toggleQuest(newGame(TODAY), 'water', 'warrior'))
    const id = roster.activeHeroId!
    roster = editHero(roster, id, draft({ name: 'Harish', heroClass: 'mage', appearance: { ...newHeroDraft().appearance, hat: 'pointed' } }))
    const hero = activeHero(roster)!
    expect(hero.heroClass).toBe('mage')
    expect(hero.appearance.hat).toBe('pointed')
    expect(hero.game.totalXp).toBe(15)
  })
})

describe('gear', () => {
  it('can only be worn once it has been bought', () => {
    let roster = addHero(EMPTY_ROSTER, draft(), newGame(TODAY))
    const id = roster.activeHeroId!
    expect(activeHero(equipGear(roster, id, 'heldItem', 'lantern'))?.appearance.heldItem).toBe('none')

    const hero = activeHero(roster)!
    roster = setHeroProgress(roster, id, { holdings: { ...hero.holdings, gear: ['lantern'] } })
    expect(activeHero(equipGear(roster, id, 'heldItem', 'lantern'))?.appearance.heldItem).toBe('lantern')
  })

  it('is taken off when loading a save that wears gear the hero does not own', () => {
    const store = memoryStore()
    const roster = addHero(EMPTY_ROSTER, draft({ appearance: { ...newHeroDraft().appearance, hat: 'ember-crown' } }), newGame(TODAY))
    saveRoster(store, roster)
    expect(activeHero(loadRoster(store, TODAY))?.appearance.hat).toBe('none')
  })
})

describe('races', () => {
  it('are saved with the hero, and older heroes without one load as human', () => {
    const store = memoryStore()
    const orc = draft({ appearance: { ...newHeroDraft().appearance, race: 'orc', skin: 'orc' } })
    saveRoster(store, addHero(EMPTY_ROSTER, orc, newGame(TODAY)))
    expect(activeHero(loadRoster(store, TODAY))?.appearance).toMatchObject({ race: 'orc', skin: 'orc' })

    const saved = JSON.parse(store.getItem('level-up-life/roster')!)
    delete saved.heroes[0].appearance.race
    store.setItem('level-up-life/roster', JSON.stringify(saved))
    expect(activeHero(loadRoster(store, TODAY))?.appearance.race).toBe('human')
  })

  it('show alongside the class', () => {
    expect(raceAndClass({ heroClass: 'mage', appearance: { ...newHeroDraft().appearance, race: 'elf' } })).toBe('Elf Mage')
  })
})

describe('saving heroes', () => {
  it('restores every hero after the app is reopened', () => {
    const store = memoryStore()
    let roster = addHero(EMPTY_ROSTER, draft({ name: 'First', title: 'the Grim' }), newGame(TODAY))
    roster = addHero(roster, draft({ name: 'Second', appearance: { ...newHeroDraft().appearance, heldItem: 'wand' } }), newGame(TODAY))
    saveRoster(store, roster)

    const reopened = loadRoster(store, TODAY)
    expect(reopened.heroes.map(displayName)).toEqual(['First the Grim', 'Second'])
    expect(activeHero(reopened)?.appearance.heldItem).toBe('wand')
  })

  it('resets each hero’s quests on a new day', () => {
    const store = memoryStore()
    saveRoster(store, addHero(EMPTY_ROSTER, draft(), toggleQuest(newGame('2026-10-05'), 'lift', 'warrior')))
    const hero = activeHero(loadRoster(store, TODAY))!
    expect(hero.game.completedQuestIds).toEqual([])
    expect(hero.game.totalXp).toBe(45)
  })

  it('falls back to defaults for unknown appearance options and skips broken heroes', () => {
    const store = memoryStore({
      'level-up-life/roster': JSON.stringify({
        activeHeroId: 'missing',
        heroes: [
          { id: 'a', name: 'Harish', title: '', backstory: '', heroClass: 'necromancer', appearance: { hat: 'sombrero' }, game: newGame(TODAY) },
          { id: 'b', name: '', game: newGame(TODAY) },
        ],
      }),
    })
    const roster = loadRoster(store, TODAY)
    expect(roster.heroes).toHaveLength(1)
    expect(roster.activeHeroId).toBe('a')
    expect(roster.heroes[0].heroClass).toBe('warrior')
    expect(roster.heroes[0].appearance.hat).toBe('none')
  })

  it('starts empty when saved data is corrupt', () => {
    expect(loadRoster(memoryStore({ 'level-up-life/roster': '{not json' }), TODAY)).toEqual(EMPTY_ROSTER)
  })

  it('gives the first hero any progress saved before heroes existed', () => {
    const legacy = toggleQuest(newGame(TODAY), 'sports', 'warrior')
    const store = memoryStore({ 'level-up-life/game': JSON.stringify(legacy) })
    expect(startingGame(store, EMPTY_ROSTER, TODAY).totalXp).toBe(30)

    const withHero = addHero(EMPTY_ROSTER, draft(), legacy)
    expect(startingGame(store, withHero, TODAY).totalXp).toBe(0)
  })
})
