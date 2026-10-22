import { toRuns, type PixelGrid } from './pixel'

/** Upscale for painted images, so phones scaling them never smear one pixel into the next. */
const IMAGE_SCALE = 4

/**
 * Paints a big, still pixel picture into a PNG. As SVG it would be thousands of rectangles, which is slow on a phone
 * while other things animate over it.
 */
function toImage(grid: PixelGrid): string {
  const canvas = document.createElement('canvas')
  canvas.width = grid.width * IMAGE_SCALE
  canvas.height = grid.height * IMAGE_SCALE
  const context = canvas.getContext('2d')
  if (!context) {
    return ''
  }
  for (const { x, y, width, color } of toRuns(grid)) {
    context.fillStyle = color
    context.fillRect(x * IMAGE_SCALE, y * IMAGE_SCALE, width * IMAGE_SCALE, IMAGE_SCALE)
  }
  return canvas.toDataURL()
}

const images = new Map<string, string>()

/** A picture painted the first time it's needed under this key, and kept after that. */
export function cachedImage(key: string, paint: () => PixelGrid): string {
  let image = images.get(key)
  if (!image) {
    image = toImage(paint())
    images.set(key, image)
  }
  return image
}
