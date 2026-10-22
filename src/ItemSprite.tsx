import { useMemo } from 'react'
import { paintItem } from './itemSprites'
import PixelArt from './PixelArt'

/** A shop item or kingdom building drawn as its pixel icon; decorative, since its button or tile carries the name. */
function ItemSprite({ itemId, className = '' }: { itemId: string; className?: string }) {
  const sprite = useMemo(() => paintItem(itemId), [itemId])
  return sprite ? <PixelArt grid={sprite} className={`item-sprite ${className}`} /> : null
}

export default ItemSprite
