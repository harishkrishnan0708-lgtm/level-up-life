import type { ReactNode } from 'react'
import './Emblem.css'

export type EmblemTone = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'ember' | 'blood' | 'unknown'

interface EmblemProps {
  /** What sits in the frame: pixel art, or a short word or letter where there is no art yet. */
  children: ReactNode
  tone?: EmblemTone
  className?: string
}

/** A frame coloured by rarity, around a picture or a label; legendary frames get a turning golden aura. */
function Emblem({ children, tone = 'common', className = '' }: EmblemProps) {
  return (
    <span className={`emblem emblem-${tone} ${className}`} aria-hidden="true">
      {tone === 'legendary' && <span className="emblem-aura" />}
      <span className="emblem-text">{children}</span>
    </span>
  )
}

export default Emblem
