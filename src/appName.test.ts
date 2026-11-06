import { describe, expect, it } from 'vitest'
import indexPage from '../index.html?raw'
import appSource from './App.tsx?raw'

describe('the app’s name', () => {
  it('is MyFantasyHeroJourney at the top of the app and on the browser tab', () => {
    expect(appSource).toContain('<span className="app-name">MyFantasyHeroJourney</span>')
    expect(indexPage).toContain('<title>MyFantasyHeroJourney</title>')
  })
})
