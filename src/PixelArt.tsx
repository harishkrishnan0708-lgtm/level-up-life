import { useMemo } from 'react'
import { toRuns, type PixelGrid } from './pixel'

interface PixelArtProps {
  grid: PixelGrid
  className?: string
  /** Accessible description; leave out when the picture is decorative. */
  label?: string
  /** Part of the grid to show, as an SVG viewBox; defaults to the whole grid. */
  viewBox?: string
}

/** Draws a pixel grid as crisp SVG rectangles, merging same-coloured neighbours so it stays light. */
function PixelArt({ grid, className, label, viewBox }: PixelArtProps) {
  const runs = useMemo(() => toRuns(grid), [grid])
  return (
    <svg
      className={className}
      viewBox={viewBox ?? `0 0 ${grid.width} ${grid.height}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {runs.map(({ x, y, width, color }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={width} height={1} fill={color} />
      ))}
    </svg>
  )
}

export default PixelArt
