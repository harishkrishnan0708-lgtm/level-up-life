/** A tiny pixel-art canvas: a grid of colours (or empty cells) that drawings are painted onto. */

export type Cell = string | null

/** Picks a colour for a pixel, or null to leave it untouched. Lets shapes shade themselves by position. */
export type Paint = string | ((x: number, y: number) => string | null)

export class PixelGrid {
  readonly width: number
  readonly height: number
  readonly cells: Cell[]

  constructor(width: number, height = width) {
    this.width = width
    this.height = height
    this.cells = Array.from({ length: width * height }, () => null)
  }

  private contains(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height
  }

  get(x: number, y: number): Cell {
    return this.contains(x, y) ? this.cells[y * this.width + x] : null
  }

  set(x: number, y: number, paint: Paint): void {
    if (!this.contains(x, y)) {
      return
    }
    const color = typeof paint === 'string' ? paint : paint(x, y)
    if (color) {
      this.cells[y * this.width + x] = color
    }
  }

  /** Recolours a pixel only if it currently has one of the given colours, for adding detail inside a shape. */
  recolor(x: number, y: number, color: string, within: readonly string[]): void {
    const current = this.get(x, y)
    if (current && within.includes(current)) {
      this.set(x, y, color)
    }
  }

  /** Fills every pixel whose centre lies inside the ellipse. */
  ellipse(cx: number, cy: number, rx: number, ry: number, paint: Paint): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx
        const dy = (y + 0.5 - cy) / ry
        if (dx * dx + dy * dy <= 1) {
          this.set(x, y, paint)
        }
      }
    }
  }

  /** Fills a rectangle; both corners are included. */
  rect(x0: number, y0: number, x1: number, y1: number, paint: Paint): void {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        this.set(x, y, paint)
      }
    }
  }

  /** Draws a one-pixel line (Bresenham's algorithm). Ends are rounded to whole pixels, or the walk could never land on them. */
  line(fromX: number, fromY: number, toX: number, toY: number, paint: Paint): void {
    const [x0, y0, x1, y1] = [fromX, fromY, toX, toY].map(Math.round)
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const stepX = x0 < x1 ? 1 : -1
    const stepY = y0 < y1 ? 1 : -1
    let error = dx + dy
    let x = x0
    let y = y0
    for (;;) {
      this.set(x, y, paint)
      if (x === x1 && y === y1) {
        return
      }
      const doubled = 2 * error
      if (doubled >= dy) {
        error += dy
        x += stepX
      }
      if (doubled <= dx) {
        error += dx
        y += stepY
      }
    }
  }

  /** Fills every pixel whose centre lies inside the polygon. */
  polygon(points: readonly (readonly [number, number])[], paint: Paint): void {
    const ys = points.map(([, y]) => y)
    const xs = points.map(([x]) => x)
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        if (insidePolygon(x + 0.5, y + 0.5, points)) {
          this.set(x, y, paint)
        }
      }
    }
  }

  /**
   * Outlines every shape: each empty pixel touching a filled one becomes a much darker version of that neighbour's colour,
   * so outlines are tinted to match what they edge rather than flat black.
   */
  outline(): void {
    const edges: [number, number, string][] = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.get(x, y) !== null) {
          continue
        }
        const neighbour = [this.get(x + 1, y), this.get(x - 1, y), this.get(x, y + 1), this.get(x, y - 1)].find((cell) => cell !== null)
        if (neighbour) {
          edges.push([x, y, shade(neighbour, -0.58)])
        }
      }
    }
    for (const [x, y, color] of edges) {
      this.set(x, y, color)
    }
  }
}

function insidePolygon(x: number, y: number, points: readonly (readonly [number, number])[]): boolean {
  let inside = false
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const [xi, yi] = points[index]
    const [xj, yj] = points[previous]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function toChannels(hex: string): number[] {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
}

/** Mixes a colour toward white (positive amount) or black (negative amount). */
export function shade(hex: string, amount: number): string {
  const target = amount < 0 ? 0 : 255
  return `#${toChannels(hex)
    .map((channel) => Math.round(channel + (target - channel) * Math.abs(amount)))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`
}

/** Three tones of one colour for simple pixel shading: a highlight, the base, and a shadow. */
export interface Ramp {
  light: string
  base: string
  dark: string
}

export function ramp(base: string, lift = 0.25, drop = 0.35): Ramp {
  return { light: shade(base, lift), base, dark: shade(base, -drop) }
}

/** Shades a shape lit from the left: a thin highlight on its left edge and a band of shadow down its right side. */
export function litFromLeft(colors: Ramp, centerX: number, halfWidth: number): (x: number, y: number) => string {
  return (x) => {
    const offset = (x + 0.5 - centerX) / halfWidth
    if (offset < -0.78) {
      return colors.light
    }
    return offset > 0.5 ? colors.dark : colors.base
  }
}

/** A copy of the grid with every filled pixel in one colour: a silhouette, for things not yet discovered. */
export function silhouette(grid: PixelGrid, color: string): PixelGrid {
  const shadow = new PixelGrid(grid.width, grid.height)
  grid.cells.forEach((cell, index) => {
    if (cell) {
      shadow.cells[index] = color
    }
  })
  return shadow
}

export interface PixelRun {
  x: number
  y: number
  width: number
  color: string
}

/** Merges neighbouring same-colour pixels in each row, so the grid draws with far fewer SVG rectangles. */
export function toRuns(grid: PixelGrid): PixelRun[] {
  const runs: PixelRun[] = []
  for (let y = 0; y < grid.height; y++) {
    let x = 0
    while (x < grid.width) {
      const color = grid.get(x, y)
      if (!color) {
        x++
        continue
      }
      let width = 1
      while (grid.get(x + width, y) === color) {
        width++
      }
      runs.push({ x, y, width, color })
      x += width
    }
  }
  return runs
}
