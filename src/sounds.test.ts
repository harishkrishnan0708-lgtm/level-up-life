import { describe, expect, it } from 'vitest'
import { SOUNDS, isMuted, noteFrequency, playSound, setMuted } from './sounds'

describe('sounds', () => {
  it('tunes notes to concert pitch', () => {
    expect(noteFrequency(69)).toBe(440)
    expect(noteFrequency(81)).toBe(880)
    expect(noteFrequency(60)).toBeCloseTo(261.63, 2)
  })

  it('keeps every sound short, audible, and quiet enough not to startle', () => {
    for (const [name, { notes, volume }] of Object.entries(SOUNDS)) {
      const length = notes.reduce((total, [, ms]) => total + ms, 0)
      expect(length, name).toBeLessThanOrEqual(1200)
      expect(volume, name).toBeGreaterThan(0)
      expect(volume, name).toBeLessThanOrEqual(0.15)
      for (const [midi] of notes) {
        expect(noteFrequency(midi), name).toBeGreaterThan(40)
        expect(noteFrequency(midi), name).toBeLessThan(2000)
      }
    }
  })

  it('stays silent once muted, and can be turned back on', () => {
    setMuted(true)
    expect(isMuted()).toBe(true)
    expect(() => playSound('levelUp')).not.toThrow()
    setMuted(false)
    expect(isMuted()).toBe(false)
  })
})
