import { useMemo } from 'react'
import PixelArt from './PixelArt'
import { PixelGrid } from './pixel'

const FLAME_ROWS = ['....R....', '...RR....', '...ROR...', '..ROOR...', '..ROOOR..', '.ROOYOR..', '.ROYYYOR.', 'ROYYWYYOR', 'ROYWWWYOR', '.ROYWYOR.', '..ROOOR..', '...RRR...']
const LIT: Record<string, string> = { R: '#a8321e', O: '#e2803a', Y: '#ffd27a', W: '#fff1c4' }
const COLD: Record<string, string> = { R: '#4a4448', O: '#5a5458', Y: '#6a6468', W: '#7a7478' }

/** A little pixel flame for the streak; it goes grey and cold when the streak isn't lit today. */
function StreakFlame({ lit = true, className = 'streak-flame' }: { lit?: boolean; className?: string }) {
  const grid = useMemo(() => {
    const flame = new PixelGrid(FLAME_ROWS[0].length, FLAME_ROWS.length)
    FLAME_ROWS.forEach((row, y) =>
      [...row].forEach((letter, x) => {
        const colors = lit ? LIT : COLD
        if (colors[letter]) {
          flame.set(x, y, colors[letter])
        }
      }),
    )
    return flame
  }, [lit])
  return <PixelArt grid={grid} className={className} />
}

export default StreakFlame
