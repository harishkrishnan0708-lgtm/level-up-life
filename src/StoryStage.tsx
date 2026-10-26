import { useMemo } from 'react'
import type { Hero } from './hero'
import MarketScene from './MarketScene'
import { paintWickPortrait } from './marketPixels'
import PixelArt from './PixelArt'
import { cachedImage } from './pixelImage'
import { FIGURE_HEIGHT, FIGURE_WIDTH, handPosition, paintFigure, type Pose } from './heroPixels'
import { MANNERISMS, SPEAKER_NAMES, characterLook, type CastState } from './cast'
import type { Actor, SceneId, Speaker, Staging } from './story'
import {
  CAMPFIRE,
  CELLAR_TORCHES,
  FEN_EMBERS,
  FORT_SMOKE,
  KEEP_SNOW,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  STEPPE_WIND,
  paintCampNight,
  paintCinderFen,
  paintFortCellar,
  paintFortYard,
  paintKeepHall,
  paintSteppeCamp,
} from './storyScenes'

const WICK_PORTRAIT = paintWickPortrait()

/** Where each member of the cast stands across the stage, as a percentage of its width. */
const STAGE_MARKS: Record<number, readonly number[]> = { 1: [50], 2: [28, 72], 3: [17, 50, 83], 4: [13, 38, 63, 87] }

/** Specks of dust drifting through the cellar's torchlight. */
const DUST: readonly [number, number, number][] = [
  [58, 40, 0],
  [84, 70, 1.5],
  [118, 34, 3],
  [142, 76, 4.5],
]

function Smoke() {
  return (
    <>
      {FORT_SMOKE.flatMap(([x, y], plume) =>
        [0, 1, 2].map((puff) => (
          <g key={`${plume}-${puff}`} className="smoke-puff" style={{ animationDelay: `${-(puff * 2 + plume * 0.7)}s` }}>
            <rect x={x - 3} y={y - 1} width={7} height={3} fill="#8a8290" opacity={0.45} />
            <rect x={x - 2} y={y - 3} width={5} height={7} fill="#8a8290" opacity={0.45} />
            <rect x={x - 1} y={y - 2} width={3} height={4} fill="#a8a0ac" opacity={0.35} />
          </g>
        )),
      )}
    </>
  )
}

function Torches() {
  return (
    <>
      {CELLAR_TORCHES.map(([x, y], index) => (
        <g key={x} className={index ? 'flicker' : 'flicker-slow'}>
          <rect x={x - 14} y={y - 12} width={28} height={26} fill="#ffb456" opacity={0.08} />
          <rect x={x - 8} y={y - 7} width={16} height={16} fill="#ffb456" opacity={0.1} />
          <rect x={x - 2} y={y - 4} width={4} height={5} fill="#e2803a" />
          <rect x={x - 1} y={y - 6} width={2} height={5} fill="#ffd27a" />
        </g>
      ))}
      {DUST.map(([x, y, delay]) => (
        <rect key={x} className="dust-mote" x={x} y={y} width={1} height={1} fill="#c8b8a0" style={{ animationDelay: `${-delay}s` }} />
      ))}
    </>
  )
}

/** Holt's pipe smoke and Brannoc's coin, drawn over their figures in the same pixel grid. */
function Mannerism({ actor, pose }: { actor: Actor; pose: Pose }) {
  const habit = MANNERISMS[actor]
  if (habit === 'pipe-smoke') {
    return (
      <svg className="mannerism" viewBox={`0 0 ${FIGURE_WIDTH} ${FIGURE_HEIGHT}`} aria-hidden="true">
        {[0, 1.3, 2.6].map((delay) => (
          <rect key={delay} className="pipe-puff" x={22} y={17} width={2} height={2} fill="#c8c0c8" style={{ animationDelay: `${-delay}s` }} />
        ))}
      </svg>
    )
  }
  if (habit === 'coin-flip' && (pose === 'bound' || pose === 'stand')) {
    const [x, y] = pose === 'bound' ? [15, 31] : handPosition(pose, 'right')
    return (
      <svg className="mannerism" viewBox={`0 0 ${FIGURE_WIDTH} ${FIGURE_HEIGHT}`} aria-hidden="true">
        <g className="coin-toss">
          <rect x={x} y={y - 3} width={2} height={2} fill="#e8b33a" />
          <rect x={x} y={y - 3} width={1} height={1} fill="#ffe08a" />
        </g>
      </svg>
    )
  }
  if (habit === 'moth-jar' && (pose === 'stand' || pose === 'talk' || pose === 'point')) {
    // A glass jar in the hanging hand, two moths fluttering inside.
    const [x, y] = handPosition(pose, 'left')
    return (
      <svg className="mannerism" viewBox={`0 0 ${FIGURE_WIDTH} ${FIGURE_HEIGHT}`} aria-hidden="true">
        <rect x={x - 3} y={y + 1} width={6} height={7} fill="#a8c8e0" opacity={0.45} />
        <rect x={x - 3} y={y} width={6} height={1} fill="#5a4a3a" />
        <rect className="jar-moth" x={x - 1} y={y + 3} width={2} height={1} fill="#e8dcc0" />
        <rect className="jar-moth" x={x + 1} y={y + 5} width={1} height={1} fill="#e8dcc0" style={{ animationDelay: '-0.6s' }} />
      </svg>
    )
  }
  return null
}

/** Snow drifting down through the Grey Keep's broken window. */
function Snow() {
  return (
    <>
      {KEEP_SNOW.map(([x, y], index) => (
        <rect key={x} className="snowflake" x={x} y={y} width={1} height={1} fill="#e8ecf4" style={{ animationDelay: `${-index * 1.1}s` }} />
      ))}
    </>
  )
}

/** Embers drifting up off the burned fen. */
function Embers() {
  return (
    <>
      {FEN_EMBERS.map(([x, y], index) => (
        <rect key={x} className="ember-rise" x={x} y={y} width={1} height={1} fill="#e2803a" style={{ animationDelay: `${-index * 0.9}s` }} />
      ))}
    </>
  )
}

/** Seeds blowing across the steppe on the wind. */
function Wind() {
  return (
    <>
      {STEPPE_WIND.map(([x, y], index) => (
        <rect key={x} className="wind-seed" x={x} y={y} width={2} height={1} fill="#f0d8a8" style={{ animationDelay: `${-index * 0.7}s` }} />
      ))}
    </>
  )
}

/** The campfire: flames that flicker, a warm glow, and sparks rising into the dark. */
function Campfire() {
  const [x, y] = CAMPFIRE
  return (
    <>
      <g className="flicker">
        <rect x={x - 24} y={y - 14} width={48} height={22} fill="#ffb456" opacity={0.08} />
        <rect x={x - 12} y={y - 8} width={24} height={14} fill="#ffb456" opacity={0.1} />
        <rect x={x - 5} y={y - 6} width={10} height={7} fill="#e2803a" />
        <rect x={x - 3} y={y - 10} width={6} height={6} fill="#ffb347" />
        <rect x={x - 1} y={y - 13} width={2} height={5} fill="#ffd27a" />
      </g>
      {[0, 1, 2, 3].map((spark) => (
        <rect key={spark} className="ember-rise" x={x - 3 + spark * 2} y={y - 12} width={1} height={1} fill="#ffd27a" style={{ animationDelay: `${-spark * 0.8}s` }} />
      ))}
    </>
  )
}

/** Each painted setting, and the movement drawn over it. */
const SETTINGS = {
  'fort-yard': { paint: paintFortYard, Life: Smoke },
  'fort-cellar': { paint: paintFortCellar, Life: Torches },
  'keep-hall': { paint: paintKeepHall, Life: Snow },
  'cinder-fen': { paint: paintCinderFen, Life: Embers },
  'steppe-camp': { paint: paintSteppeCamp, Life: Wind },
  'camp-night': { paint: paintCampNight, Life: Campfire },
} as const

function PaintedSetting({ scene }: { scene: Exclude<SceneId, 'market'> }) {
  const { paint, Life } = SETTINGS[scene]
  return (
    <svg viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
      <image href={cachedImage(`scene-${scene}`, paint)} width={SCENE_WIDTH} height={SCENE_HEIGHT} className="street-layer" />
      <Life />
    </svg>
  )
}

function ActorFigure({ actor, pose, hero, cast }: { actor: Actor; pose: Pose; hero: Hero; cast: CastState }) {
  const state = actor === 'hero' ? null : cast[actor]
  const figure = useMemo(() => {
    if (actor === 'hero') {
      return paintFigure(hero.appearance, pose)
    }
    if (actor !== 'wick' && state) {
      const { appearance, features } = characterLook(actor, state)
      return paintFigure(appearance, pose, features)
    }
    return null
  }, [actor, hero.appearance, pose, state])
  if (!figure) {
    return <PixelArt grid={WICK_PORTRAIT} className="actor-art" label="Wick" />
  }
  return <PixelArt grid={figure} className="actor-art" label={actor === 'hero' ? hero.name : SPEAKER_NAMES[actor]} />
}

interface StoryStageProps {
  staging: Staging
  speaker: Speaker | null
  hero: Hero
  /** Where each character stands with the hero, which can change how they look. */
  cast: CastState
}

/** The scene a story line plays out in: a setting with a little life in it, and the cast standing in front. */
function StoryStage({ staging, speaker, hero, cast }: StoryStageProps) {
  const { scene, cast: onStage } = staging
  const marks = STAGE_MARKS[onStage.length] ?? []
  return (
    <div className="story-stage-scene">
      {/* A new place fades in, so each change of scene reads as a cut. */}
      <div key={scene} className="scene-backdrop">
        {scene === 'market' ? (
          <MarketScene merchantPleased={false} />
        ) : (
          <PaintedSetting scene={scene} />
        )}
      </div>
      {onStage.map((actor, index) => (
        <div
          key={actor}
          className={`actor${speaker === actor ? ' speaking' : speaker && speaker !== 'narrator' ? ' listening' : ''}`}
          // A crowd of four stands a little narrower so everyone fits.
          style={{ left: `${marks[index]}%`, width: onStage.length > 3 ? '24%' : undefined }}
        >
          <div className="actor-sway" style={{ animationDelay: `${-index * 0.9}s` }}>
            <ActorFigure actor={actor} pose={staging.poses[actor]} hero={hero} cast={cast} />
            {speaker !== actor && <Mannerism actor={actor} pose={staging.poses[actor]} />}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StoryStage
