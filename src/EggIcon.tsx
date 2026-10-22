import { useId } from 'react'
import type { PetRarity } from './pets'

const SHELL_COLORS: Record<PetRarity, string> = {
  common: '#b8ab92',
  uncommon: '#7fae6e',
  rare: '#4f7fb8',
  epic: '#8a55c8',
  legendary: '#e0a43a',
}

const SPECKLES = [
  [13, 18, 1.6],
  [26, 14, 1.2],
  [29, 28, 1.8],
  [11, 33, 1.3],
  [21, 40, 1.5],
  [17, 25, 1],
] as const

interface EggIconProps {
  rarity: PetRarity
  /** 0 to 1: how close the egg is to hatching. Cracks appear past halfway. */
  progress?: number
  className?: string
}

/** A speckled egg in its rarity's color; it starts to crack as it gets close to hatching. */
function EggIcon({ rarity, progress = 0, className }: EggIconProps) {
  const gradientId = `egg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const shell = SHELL_COLORS[rarity]
  return (
    <svg className={`egg-icon egg-${rarity}${className ? ` ${className}` : ''}`} viewBox="0 0 40 50" aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor={shell} />
          <stop offset="1" stopColor="#120c0a" />
        </radialGradient>
      </defs>
      <path d="M20 2 C31 2 38 20 38 31 C38 42 30 48 20 48 C10 48 2 42 2 31 C2 20 9 2 20 2 Z" fill={`url(#${gradientId})`} />
      {SPECKLES.map(([x, y, radius]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={radius} fill="#0d0907" opacity="0.35" />
      ))}
      {progress >= 0.5 && <path d="M7 27 L12 24 L15 29 L19 25 L23 30 L27 26" fill="none" stroke="#0d0907" strokeWidth="1.2" />}
      {progress >= 0.8 && <path d="M27 26 L31 30 L34 27 M15 29 L14 34" fill="none" stroke="#0d0907" strokeWidth="1.2" />}
    </svg>
  )
}

export default EggIcon
