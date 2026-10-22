import { useMemo } from 'react'
import Emblem from './Emblem'
import { paintPet } from './petSprites'
import type { Pet } from './pets'
import PixelArt from './PixelArt'
import { silhouette } from './pixel'

/** Colour of an undiscovered pet's silhouette: just visible against the dark frame. */
const UNFOUND = '#3a3340'

/** A pet's pixel sprite in a frame coloured by rarity (legendary frames get a golden aura); unfound pets are a dark silhouette. */
function PetIcon({ pet, found = true, className = '' }: { pet: Pet; found?: boolean; className?: string }) {
  const sprite = useMemo(() => {
    const grid = paintPet(pet.id)
    return grid && !found ? silhouette(grid, UNFOUND) : grid
  }, [pet.id, found])
  return (
    <Emblem tone={found ? pet.rarity : 'unknown'} className={`pet-icon ${className}`}>
      {sprite ? <PixelArt grid={sprite} className="pet-sprite" /> : '?'}
    </Emblem>
  )
}

export default PetIcon
