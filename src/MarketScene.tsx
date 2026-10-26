import { useMemo } from 'react'
import {
  FAR_STREET_LINE,
  HOUSE_WINDOWS,
  MARKET_HEIGHT,
  MARKET_PIXEL,
  MARKET_WIDTH,
  STALL_LANTERN_SPOT,
  STRING_LANTERN_SPOTS,
  WICK_EYES,
  WICK_HANDS,
  dayPhase,
  isLamplit,
  paintFarStreet,
  paintHouseWindow,
  paintNearStreet,
  paintStallLantern,
  paintStringLantern,
  paintTownsperson,
  paintWickGlove,
  type DayPhase,
  type Townsperson,
} from './marketPixels'
import { PixelGrid, toRuns, type PixelRun } from './pixel'
import { cachedImage } from './pixelImage'
import { useHour } from './useHour'

const SCENE_WIDTH = MARKET_WIDTH * MARKET_PIXEL
const SCENE_HEIGHT = MARKET_HEIGHT * MARKET_PIXEL

/**
 * Townsfolk crossing the far street: how they look, how far down the pavement they walk (later lanes are nearer, so
 * they're listed back to front), duration (s), delay (s), and direction.
 */
const PASSERSBY: readonly (Townsperson & { lane: number; duration: number; delay: number; reverse: boolean })[] = [
  { extra: 'staff', cloak: '#2a3242', lane: 0, duration: 34, delay: -20, reverse: true },
  { extra: 'none', cloak: '#26301f', lane: 1, duration: 38, delay: -30, reverse: true },
  { extra: 'basket', cloak: '#3e2a1c', lane: 2, duration: 26, delay: -4, reverse: false },
  { extra: 'none', cloak: '#3e1e1e', lane: 4, duration: 30, delay: -12, reverse: false },
]

const WICK_GLOVE = toRuns(paintWickGlove())

/** Where each moth circles the stall lantern, in pixels from its middle, and how far into its loop it starts. */
const LANTERN_MOTHS = [
  { dx: -7, dy: -3, delay: 0 },
  { dx: 6, dy: 1, delay: -1.3 },
  { dx: -2, dy: 7, delay: -2.6 },
]

/** Fog thickening toward the viewer at night, a thin mist at dawn and dusk, and none by day. */
const FOG_DENSITY: Record<DayPhase, number> = { night: 1, dawn: 0.6, dusk: 0.5, day: 0 }

const glowRings = new Map<number, PixelRun[]>()

/** A filled pixel circle of lamplight, painted once per size. */
function glowRing(radius: number): PixelRun[] {
  let runs = glowRings.get(radius)
  if (!runs) {
    const ring = new PixelGrid(radius * 2)
    ring.ellipse(radius, radius, radius, radius, '#ffc46b')
    runs = toRuns(ring)
    glowRings.set(radius, runs)
  }
  return runs
}

/** Fog thickening toward the viewer, in hard bands rather than a smooth fade. */
const FOG_BANDS = [
  { top: 220, height: 30, opacity: 0.08 },
  { top: 250, height: 40, opacity: 0.16 },
  { top: 290, height: 40, opacity: 0.26 },
  { top: 330, height: 30, opacity: 0.36 },
]

interface PixelsProps {
  runs: readonly PixelRun[]
  /** Where the layer's top-left pixel sits, in scene units. */
  x?: number
  y?: number
  className?: string
}

/** A pixel layer drawn at the scene's pixel size. */
function Pixels({ runs, x = 0, y = 0, className }: PixelsProps) {
  return (
    <g className={className} transform={`translate(${x} ${y}) scale(${MARKET_PIXEL})`}>
      {runs.map((run) => (
        <rect key={`${run.x}-${run.y}`} x={run.x} y={run.y} width={run.width} height={1} fill={run.color} />
      ))}
    </g>
  )
}

/** A soft lamp glow as stepped rings of light, each a little brighter toward the flame. */
function Glow({ cx, cy, radii }: { cx: number; cy: number; radii: readonly number[] }) {
  return (
    <>
      {radii.map((radius) => (
        <Pixels key={radius} runs={glowRing(radius)} x={(cx - radius) * MARKET_PIXEL} y={(cy - radius) * MARKET_PIXEL} className="lamp-glow" />
      ))}
    </>
  )
}

interface MarketSceneProps {
  /** Brightens the merchant's eyes for a moment, e.g. after a sale. */
  merchantPleased: boolean
}

/** The market seen from in front of Wick's stall, in pixel art, at the real time of day. */
function MarketScene({ merchantPleased }: MarketSceneProps) {
  const hour = useHour()
  const phase = dayPhase(hour)
  const lamplit = isLamplit(phase)
  // The sun moves through the day, so daytime skies are painted per hour.
  const far = cachedImage(phase === 'day' ? `far-day-${hour}` : `far-${phase}`, () => paintFarStreet(phase, hour))
  const near = cachedImage(`near-${phase}`, () => paintNearStreet(phase))
  const sprites = useMemo(
    () => ({
      stringLantern: toRuns(paintStringLantern(phase)),
      stallLantern: toRuns(paintStallLantern(phase)),
      windows: HOUSE_WINDOWS.map(({ width, height, glass }) => toRuns(paintHouseWindow(width, height, glass, phase))),
      townsfolk: PASSERSBY.map((person) => toRuns(paintTownsperson(person, phase))),
    }),
    [phase],
  )
  return (
    <svg
      className="market-scene"
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <image href={far} width={SCENE_WIDTH} height={SCENE_HEIGHT} className="street-layer" />

      {/* Townsfolk walking along the far pavement, seen through the open back of the stall */}
      {PASSERSBY.map(({ lane, duration, delay, reverse }, index) => (
        <g key={lane} transform={`translate(0 ${(FAR_STREET_LINE + 1 + lane) * MARKET_PIXEL})`}>
          <g
            className="passerby"
            style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
          >
            <Pixels runs={sprites.townsfolk[index]} x={-18} y={-40} />
          </g>
        </g>
      ))}

      <image href={near} width={SCENE_WIDTH} height={SCENE_HEIGHT} className="street-layer" />

      {/* Lit windows in both houses */}
      {HOUSE_WINDOWS.map(({ left, top, width, flicker }, index) =>
        [left, MARKET_WIDTH - left - width].map((x) => (
          <Pixels
            key={`${index}-${x}`}
            runs={sprites.windows[index]}
            x={x * MARKET_PIXEL}
            y={top * MARKET_PIXEL}
            className={flicker && lamplit ? 'flicker-slow' : undefined}
          />
        )),
      )}

      {/* Lanterns on the string across the street */}
      {STRING_LANTERN_SPOTS.map(([x, y], index) => (
        <g key={x} className={lamplit ? (index % 2 ? 'flicker' : 'flicker-slow') : undefined}>
          {lamplit && <Glow cx={x} cy={y + 3} radii={[6, 4]} />}
          <Pixels runs={sprites.stringLantern} x={(x - 2) * MARKET_PIXEL} y={y * MARKET_PIXEL} />
        </g>
      ))}

      {/* Wick's gloved hands on the counter; now and then he rubs them together, pleased with himself */}
      {WICK_HANDS.map(([x, y], index) => (
        <g key={x} className={index ? 'glove-right' : 'glove-left'}>
          <Pixels runs={WICK_GLOVE} x={(x - 6) * MARKET_PIXEL} y={(y - 4) * MARKET_PIXEL} />
        </g>
      ))}

      {/* Wick's eyes: the face is never seen, only these */}
      <g className={`merchant-eyes${merchantPleased ? ' pleased' : ''}`}>
        {WICK_EYES.map(([x, y]) => (
          <g key={x}>
            <rect x={(x - 1) * MARKET_PIXEL} y={(y - 1) * MARKET_PIXEL} width={5 * MARKET_PIXEL} height={4 * MARKET_PIXEL} fill="#ffcf6b" opacity="0.22" />
            <g className="merchant-eye">
              <rect x={x * MARKET_PIXEL} y={y * MARKET_PIXEL} width={3 * MARKET_PIXEL} height={2 * MARKET_PIXEL} fill="#ffd98a" />
              <rect x={(x + 1) * MARKET_PIXEL} y={y * MARKET_PIXEL} width={MARKET_PIXEL} height={MARKET_PIXEL} fill="#fff1c4" />
            </g>
          </g>
        ))}
      </g>

      {/* The lantern lighting the stall */}
      <g className={lamplit ? 'flicker' : undefined}>
        {lamplit && <Glow cx={STALL_LANTERN_SPOT[0] + 3} cy={STALL_LANTERN_SPOT[1] + 5} radii={[22, 15, 9]} />}
        <Pixels runs={sprites.stallLantern} x={STALL_LANTERN_SPOT[0] * MARKET_PIXEL} y={STALL_LANTERN_SPOT[1] * MARKET_PIXEL} />
      </g>
      {/* Moths drawn to the stall lantern, as moths are */}
      {lamplit &&
        LANTERN_MOTHS.map(({ dx, dy, delay }) => (
          <g key={delay} transform={`translate(${(STALL_LANTERN_SPOT[0] + 3 + dx) * MARKET_PIXEL} ${(STALL_LANTERN_SPOT[1] + 4 + dy) * MARKET_PIXEL})`}>
            <g className="moth" style={{ animationDelay: `${delay}s` }}>
              <rect x={-MARKET_PIXEL} width={3 * MARKET_PIXEL} height={MARKET_PIXEL} fill="#e8dcc0" />
              <rect y={MARKET_PIXEL} width={MARKET_PIXEL} height={MARKET_PIXEL} fill="#5a4a3a" />
            </g>
          </g>
        ))}

      {FOG_DENSITY[phase] > 0 && (
        <g className="market-fog">
          {FOG_BANDS.map(({ top, height, opacity }) => (
            <rect key={top} y={top} width={SCENE_WIDTH} height={height} fill={phase === 'night' ? '#3a3340' : '#c8b8c8'} opacity={opacity * FOG_DENSITY[phase]} />
          ))}
        </g>
      )}
    </svg>
  )
}

export default MarketScene
