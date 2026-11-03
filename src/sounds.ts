/**
 * Chiptune sound effects, synthesized in the browser with the Web Audio API the way old consoles made them:
 * square and triangle waves playing short runs of notes. Nothing to download.
 */

type Wave = 'square' | 'triangle'

/** A note as a MIDI number (60 is middle C) and how long it lasts in milliseconds. */
type Note = readonly [midi: number, ms: number]

interface Sound {
  wave: Wave
  notes: readonly Note[]
  volume: number
}

export const SOUNDS = {
  click: { wave: 'square', notes: [[86, 25]], volume: 0.04 },
  questDone: { wave: 'square', notes: [[76, 60], [84, 110]], volume: 0.08 },
  questUndone: { wave: 'triangle', notes: [[72, 70], [65, 120]], volume: 0.12 },
  coin: { wave: 'square', notes: [[83, 70], [88, 220]], volume: 0.07 },
  levelUp: { wave: 'square', notes: [[72, 80], [76, 80], [79, 80], [84, 80], [79, 80], [84, 320]], volume: 0.08 },
  achievement: { wave: 'square', notes: [[79, 90], [84, 90], [88, 90], [91, 360]], volume: 0.08 },
  streak: { wave: 'square', notes: [[76, 70], [79, 70], [83, 70], [88, 300]], volume: 0.08 },
  egg: { wave: 'triangle', notes: [[79, 80], [74, 80], [86, 200]], volume: 0.14 },
  hatch: { wave: 'square', notes: [[72, 60], [76, 60], [79, 60], [84, 60], [88, 60], [91, 260]], volume: 0.07 },
  siege: { wave: 'square', notes: [[43, 70], [38, 110]], volume: 0.09 },
  coinToss: { wave: 'square', notes: [[88, 40], [93, 40], [88, 40], [93, 40]], volume: 0.05 },
  victory: { wave: 'square', notes: [[67, 110], [72, 110], [76, 110], [79, 220], [76, 110], [79, 420]], volume: 0.08 },
  defeat: { wave: 'triangle', notes: [[67, 200], [66, 200], [65, 200], [64, 520]], volume: 0.14 },
  stalemate: { wave: 'triangle', notes: [[67, 180], [67, 320]], volume: 0.12 },
  blip: { wave: 'square', notes: [[64, 18]], volume: 0.025 },
} as const satisfies Record<string, Sound>

export type SoundName = keyof typeof SOUNDS

const MUTED_KEY = 'level-up-life/sound-off'

let context: AudioContext | null = null
let muted = readMuted()

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTED_KEY) === 'yes'
  } catch {
    return false
  }
}

export function isMuted(): boolean {
  return muted
}

/** Turns every sound off or on, remembered on this device. */
export function setMuted(off: boolean) {
  muted = off
  try {
    if (off) {
      window.localStorage.setItem(MUTED_KEY, 'yes')
    } else {
      window.localStorage.removeItem(MUTED_KEY)
    }
  } catch {
    // Without storage the choice still holds until the app closes.
  }
}

/** The frequency in hertz of a MIDI note number. */
export function noteFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/** Starts audio on a tap; phones only allow sound once the player has touched the page. */
export function unlockAudio() {
  if (muted || typeof AudioContext === 'undefined') {
    return
  }
  context ??= new AudioContext()
  if (context.state === 'suspended') {
    void context.resume()
  }
}

export function playSound(name: SoundName) {
  if (muted) {
    return
  }
  unlockAudio()
  if (!context) {
    return
  }
  const audio = context
  // The very first tap may still be waking the audio up; play once it's ready rather than dropping the sound.
  if (audio.state === 'running') {
    schedule(audio, SOUNDS[name])
  } else {
    void audio.resume().then(() => schedule(audio, SOUNDS[name]))
  }
}

function schedule(audio: AudioContext, { wave, notes, volume }: Sound) {
  let start = audio.currentTime
  for (const [midi, ms] of notes) {
    const length = ms / 1000
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = wave
    oscillator.frequency.value = noteFrequency(midi)
    // A quick fade at each end, so notes don't click.
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.005)
    gain.gain.setValueAtTime(volume, start + length * 0.7)
    gain.gain.linearRampToValueAtTime(0, start + length)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(start)
    oscillator.stop(start + length)
    start += length
  }
}
