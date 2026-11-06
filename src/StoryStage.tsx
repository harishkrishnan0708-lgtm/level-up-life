import { useEffect, useMemo, useState } from 'react'
import type { Hero } from './hero'
import MarketScene from './MarketScene'
import { paintWickPortrait } from './marketPixels'
import PixelArt from './PixelArt'
import { cachedImage } from './pixelImage'
import { FIGURE_HEIGHT, FIGURE_WIDTH, handPosition, paintFigure, type Expression, type Pose } from './heroPixels'
import { MANNERISMS, SPEAKER_NAMES, characterLook, type CastState } from './cast'
import type { Actor, SceneId, Speaker, Staging } from './story'
import {
  CAMPFIRE,
  CELLAR_TORCHES,
  DESERT_SAND,
  DUNGEON_DRIPS,
  FEN_EMBERS,
  FORT_SMOKE,
  KEEP_SNOW,
  GATE_EMBERS,
  LAVA_GLOWS,
  TOWN_LIGHTS,
  WAR_TORCHES,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  STEPPE_WIND,
  paintCampNight,
  paintBoneDesert,
  paintBurnedGate,
  paintBurnedVillage,
  paintCinderFen,
  paintDungeon,
  paintElvenForest,
  paintHarrowFord,
  paintKeepCourtyard,
  paintMothHill,
  paintVolcanoFortress,
  paintWarCircle,
  paintSaltRoad,
  paintFortCellar,
  paintFortYard,
  paintKeepHall,
  paintSteppeCamp,
  type Point,
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

/**
 * Quiet background life, small and slow so the eye finds it only after a while: birds, glows, drips, fireflies.
 * Each scene gets one vivid colour against its dull ones.
 */

/** Birds gliding across the sky, flapping now and then: [x, y, seconds to cross]. */
function Birds({ flock, color }: { flock: readonly (readonly [number, number, number])[]; color: string }) {
  return (
    <>
      {flock.map(([x, y, seconds], index) => (
        <g key={index} className="bird-glide" style={{ animationDuration: `${seconds}s`, animationDelay: `${-index * seconds * 0.4}s` }}>
          <g className="bird-flap" style={{ animationDelay: `${-index * 0.3}s` }}>
            <rect x={x - 2} y={y - 1} width={1} height={1} fill={color} />
            <rect x={x - 1} y={y} width={3} height={1} fill={color} />
            <rect x={x + 2} y={y - 1} width={1} height={1} fill={color} />
          </g>
        </g>
      ))}
    </>
  )
}

/** Soft lights that slowly brighten and fade: fire under smoke, a lit window, the sun. */
function Glows({ spots, color, size = 3 }: { spots: readonly Point[]; color: string; size?: number }) {
  return (
    <>
      {spots.map(([x, y], index) => (
        <g key={`${x}-${y}`} className="glow-pulse" style={{ animationDelay: `${-index * 1.3}s` }}>
          <rect x={x - size * 2} y={y - size} width={size * 4} height={size * 2} fill={color} opacity={0.18} />
          <rect x={x - size} y={y - size / 2} width={size * 2} height={size} fill={color} opacity={0.5} />
        </g>
      ))}
    </>
  )
}

/** Little lights wandering in the dark: fireflies, will-o'-wisps. */
function Wanderers({ spots, color, className }: { spots: readonly Point[]; color: string; className: string }) {
  return (
    <>
      {spots.map(([x, y], index) => (
        <g key={`${x}-${y}`} className={className} style={{ animationDelay: `${-index * 1.7}s` }}>
          <rect x={x - 1} y={y - 1} width={3} height={3} fill={color} opacity={0.25} />
          <rect x={x} y={y} width={1} height={1} fill={color} />
        </g>
      ))}
    </>
  )
}

/** Stars that twinkle at their own pace. */
function Twinkles({ stars }: { stars: readonly Point[] }) {
  return (
    <>
      {stars.map(([x, y], index) => (
        <rect key={`${x}-${y}`} className="star-twinkle" x={x} y={y} width={1} height={1} fill="#fff4c8" style={{ animationDelay: `${-index * 0.9}s`, animationDuration: `${3 + (index % 3)}s` }} />
      ))}
    </>
  )
}

/** A drop of water gathering under the arch, falling, and splashing on the flagstones. */
function Drips({ spots }: { spots: readonly Point[] }) {
  return (
    <>
      {spots.map(([x, y], index) => (
        <g key={x} style={{ animationDelay: `${-index * 2.3}s` }} className="drip">
          <rect x={x} y={y} width={1} height={2} fill="#7ad0f0" />
        </g>
      ))}
    </>
  )
}

function FortYardLife() {
  return (
    <>
      <Birds flock={[[-10, 22, 34], [-24, 30, 40], [-16, 16, 46]]} color="#1a1220" />
      <Glows spots={FORT_SMOKE.map(([x, y]) => [x, y + 6] as Point)} color="#ff6a2a" size={2} />
      <Smoke />
    </>
  )
}

function CellarLife() {
  return (
    <>
      <Torches />
      <Drips spots={[[46, 60], [154, 64]]} />
    </>
  )
}

function KeepLife() {
  return (
    <>
      <Snow />
      <rect x={44} y={113} width={2} height={5} fill="#e8dcc0" />
      <g className="flicker">
        <rect x={39} y={106} width={12} height={8} fill="#ffc85a" opacity={0.15} />
        <rect x={44} y={110} width={2} height={3} fill="#ffc85a" />
        <rect x={44} y={109} width={1} height={1} fill="#fff1c4" />
      </g>
    </>
  )
}

function FenLife() {
  return (
    <>
      <Glows spots={[[125, 75]]} color="#ffb456" size={4} />
      <Wanderers spots={[[36, 104], [84, 118], [176, 110]]} color="#5ae8d4" className="wisp-drift" />
      <Embers />
    </>
  )
}

function SteppeLife() {
  return (
    <>
      <Glows spots={[[150, 78]]} color="#ffe08a" size={8} />
      <Birds flock={[[-10, 40, 38], [-20, 32, 44]]} color="#3a1420" />
      <Wind />
    </>
  )
}

function SaltRoadLife() {
  return (
    <>
      <Glows spots={[[148, 92]]} color="#ffb060" size={6} />
      <Birds flock={[[-10, 24, 36], [-24, 34, 46]]} color="#2a3a48" />
    </>
  )
}

function BurnedGateLife() {
  return (
    <>
      <Glows spots={GATE_EMBERS} color="#ff7a2a" size={4} />
      <Smoke />
      <Birds flock={[[-10, 30, 42]]} color="#1a1020" />
    </>
  )
}

function HarrowFordLife() {
  return (
    <>
      <Wind />
      <Birds flock={[[-10, 26, 34], [-22, 36, 42], [-36, 20, 38]]} color="#22242a" />
    </>
  )
}

function KeepCourtyardLife() {
  return (
    <>
      <Glows spots={[[99, 32]]} color="#ffd27a" size={7} />
      <Snow />
      <Birds flock={[[-10, 16, 40], [-30, 26, 48]]} color="#14161e" />
    </>
  )
}

function BurnedVillageLife() {
  return (
    <>
      <Glows spots={[[16, 68], [144, 64]]} color="#ffb03a" size={7} />
      <Embers />
    </>
  )
}

function MothHillLife() {
  return (
    <>
      <Twinkles stars={[[14, 10], [58, 28], [104, 12], [132, 40], [186, 24], [78, 52]]} />
      <Glows spots={TOWN_LIGHTS} color="#ffd27a" size={5} />
      <Wanderers spots={[[44, 104], [80, 118], [116, 96], [140, 112], [160, 92]]} color="#e8e4f4" className="firefly" />
    </>
  )
}

function WarCircleLife() {
  return (
    <>
      <Glows spots={WAR_TORCHES} color="#ffb03a" size={7} />
      <Glows spots={[[100, 72]]} color="#ffc25a" size={14} />
      <Wind />
    </>
  )
}

function DungeonLife() {
  return (
    <>
      <Torches />
      <Drips spots={DUNGEON_DRIPS} />
    </>
  )
}

function ElvenForestLife() {
  return (
    <>
      <Glows spots={[[52, 49], [150, 45], [76, 31], [122, 29]]} color="#bff4e4" size={5} />
      <Glows spots={[[38, 123], [164, 137], [150, 127]]} color="#5ae4f0" size={6} />
      <Wanderers spots={[[44, 80], [70, 110], [120, 90], [150, 112], [96, 60], [180, 84]]} color="#e8f48a" className="firefly" />
    </>
  )
}

function VolcanoFortressLife() {
  return (
    <>
      <Glows spots={LAVA_GLOWS} color="#ffb03a" size={9} />
      <Embers />
    </>
  )
}

function BoneDesertLife() {
  return (
    <>
      <Glows spots={[[146, 77]]} color="#ffb03a" size={5} />
      <Birds flock={[[-10, 18, 40], [-26, 28, 48], [-40, 22, 44]]} color="#241418" />
      {DESERT_SAND.map(([x, y], index) => (
        <rect key={x} className="wind-seed" x={x} y={y} width={2} height={1} fill="#f8e0b0" style={{ animationDelay: `${-index * 0.7}s` }} />
      ))}
    </>
  )
}

function CampNightLife() {
  return (
    <>
      <Twinkles stars={[[12, 8], [53, 20], [96, 6], [131, 30], [184, 12], [74, 44]]} />
      <Wanderers spots={[[30, 104], [64, 122], [150, 110], [184, 128], [96, 98]]} color="#d4f05a" className="firefly" />
      <Campfire />
    </>
  )
}

/** Each painted setting, and the movement drawn over it. */
const SETTINGS = {
  'fort-yard': { paint: paintFortYard, Life: FortYardLife },
  'fort-cellar': { paint: paintFortCellar, Life: CellarLife },
  'keep-hall': { paint: paintKeepHall, Life: KeepLife },
  'cinder-fen': { paint: paintCinderFen, Life: FenLife },
  'steppe-camp': { paint: paintSteppeCamp, Life: SteppeLife },
  'camp-night': { paint: paintCampNight, Life: CampNightLife },
  'salt-road': { paint: paintSaltRoad, Life: SaltRoadLife },
  dungeon: { paint: paintDungeon, Life: DungeonLife },
  'burned-gate': { paint: paintBurnedGate, Life: BurnedGateLife },
  'harrow-ford': { paint: paintHarrowFord, Life: HarrowFordLife },
  'keep-courtyard': { paint: paintKeepCourtyard, Life: KeepCourtyardLife },
  'burned-village': { paint: paintBurnedVillage, Life: BurnedVillageLife },
  'moth-hill': { paint: paintMothHill, Life: MothHillLife },
  'war-circle': { paint: paintWarCircle, Life: WarCircleLife },
  'elven-forest': { paint: paintElvenForest, Life: ElvenForestLife },
  'volcano-fortress': { paint: paintVolcanoFortress, Life: VolcanoFortressLife },
  'bone-desert': { paint: paintBoneDesert, Life: BoneDesertLife },
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

const prefersStillness = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True for a moment every few seconds, at an uneven pace, so a crowd never blinks in step. */
function useBlinking(): boolean {
  const [blinking, setBlinking] = useState(false)
  useEffect(() => {
    if (prefersStillness()) {
      return
    }
    let timer: number
    const waitForBlink = () => {
      timer = window.setTimeout(
        () => {
          setBlinking(true)
          timer = window.setTimeout(() => {
            setBlinking(false)
            waitForBlink()
          }, 140)
        },
        2200 + Math.random() * 3000,
      )
    }
    waitForBlink()
    return () => window.clearTimeout(timer)
  }, [])
  return blinking
}

/** While `talking`, flips between an open and a closed mouth, like a character mouthing their words. */
function useMouthOpen(talking: boolean): boolean {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!talking || prefersStillness()) {
      return
    }
    const timer = window.setInterval(() => setOpen((wasOpen) => !wasOpen), 120)
    return () => {
      window.clearInterval(timer)
      setOpen(false)
    }
  }, [talking])
  return talking && open
}

interface ActorFigureProps {
  actor: Actor
  pose: Pose
  mood: Expression
  /** Whether this actor's line is still being typed out. */
  talking: boolean
  hero: Hero
  cast: CastState
}

function ActorFigure({ actor, pose, mood, talking, hero, cast }: ActorFigureProps) {
  const state = actor === 'hero' ? null : cast[actor]
  const blinking = useBlinking()
  const mouthOpen = useMouthOpen(talking)
  const figure = useMemo(() => {
    const face = { expression: mood, blinking, talking: mouthOpen }
    if (actor === 'hero') {
      return paintFigure(hero.appearance, pose, {}, face)
    }
    if (actor !== 'wick' && state) {
      const { appearance, features } = characterLook(actor, state)
      return paintFigure(appearance, pose, features, face)
    }
    return null
  }, [actor, hero.appearance, pose, state, mood, blinking, mouthOpen])
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
  /** Whether the current line is still being typed out, so the speaker's mouth moves. */
  typing: boolean
}

/** The scene a story line plays out in: a setting with a little life in it, and the cast standing in front. */
function StoryStage({ staging, speaker, hero, cast, typing }: StoryStageProps) {
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
            <ActorFigure
              actor={actor}
              pose={staging.poses[actor]}
              mood={staging.moods[actor]}
              talking={typing && speaker === actor}
              hero={hero}
              cast={cast}
            />
            {speaker !== actor && <Mannerism actor={actor} pose={staging.poses[actor]} />}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StoryStage
