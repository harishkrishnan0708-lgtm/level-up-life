import { useMemo } from 'react'
import type { Achievement, AchievementKind } from './achievements'
import Emblem, { type EmblemTone } from './Emblem'
import PixelArt from './PixelArt'
import { PixelGrid } from './pixel'
import StreakFlame from './StreakFlame'

const TONES: Record<AchievementKind, EmblemTone> = { habits: 'ember', growth: 'uncommon', war: 'blood', secret: 'epic' }

/** Pixel icons for each kind of badge besides habits, which use the streak flame: a star, crossed swords, and a moth. */
const ICONS: Record<Exclude<AchievementKind, 'habits'>, { rows: readonly string[]; colors: Record<string, string> }> = {
  growth: {
    rows: ['....Y....', '....Y....', '...YWY...', 'YYYYWYYYY', '.YYWWWYY.', '..YYWYY..', '..YY.YY..', '.YY...YY.', '.Y.....Y.'],
    colors: { Y: '#7ec46a', W: '#d8f4c8' },
  },
  war: {
    rows: ['S.......S', '.S.....S.', '..S...S..', '...S.S...', '....S....', '...S.S...', '.HG...GH.', 'H.......H', '.........'],
    colors: { S: '#e8e0d8', H: '#8a5a2e', G: '#c8a040' },
  },
  secret: {
    rows: ['.........', 'WW.....WW', 'WWW...WWW', 'WWWWBWWWW', '.WWWBWWW.', '..WWBWW..', '.WW.B.WW.', 'WW.....WW', '.........'],
    colors: { W: '#c8a8f0', B: '#3a2a4a' },
  },
}

function KindIcon({ kind }: { kind: Exclude<AchievementKind, 'habits'> }) {
  const grid = useMemo(() => {
    const { rows, colors } = ICONS[kind]
    const icon = new PixelGrid(rows[0].length, rows.length)
    rows.forEach((row, y) =>
      [...row].forEach((letter, x) => {
        if (colors[letter]) {
          icon.set(x, y, colors[letter])
        }
      }),
    )
    return icon
  }, [kind])
  return <PixelArt grid={grid} className="achievement-icon" />
}

/** An achievement's badge: coloured by kind once earned, grey with a question mark until then. */
function AchievementBadge({ achievement, earned, className = '' }: { achievement: Achievement; earned: boolean; className?: string }) {
  if (!earned) {
    return (
      <Emblem tone="unknown" className={`achievement-badge ${className}`}>
        ?
      </Emblem>
    )
  }
  return (
    <Emblem tone={TONES[achievement.kind]} className={`achievement-badge ${className}`}>
      {achievement.kind === 'habits' ? <StreakFlame className="achievement-flame" /> : <KindIcon kind={achievement.kind} />}
    </Emblem>
  )
}

export default AchievementBadge
