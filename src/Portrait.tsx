import { useMemo } from 'react'
import type { Appearance } from './hero'
import { HERO_GRID_SIZE, paintHero, type Facing } from './heroPixels'
import PixelArt from './PixelArt'

interface PortraitProps {
  appearance: Appearance
  className?: string
  /** Accessible description; leave out when the hero's name is already shown next to the portrait. */
  label?: string
  /** 'front' is used around the app; 'back' appears only in character customization. */
  facing?: Facing
  /** 'face' zooms in on the head, for small avatars. */
  framing?: 'bust' | 'face'
}

/** The hero as pixel art, drawn as crisp SVG rectangles so it stays sharp at any size. */
function Portrait({ appearance, className, label, facing = 'front', framing = 'bust' }: PortraitProps) {
  const grid = useMemo(() => paintHero(appearance, facing), [appearance, facing])
  const viewBox = framing === 'face' ? '5 0 22 22' : `0 0 ${HERO_GRID_SIZE} ${HERO_GRID_SIZE}`
  return <PixelArt grid={grid} className={className} label={label} viewBox={viewBox} />
}

export default Portrait
