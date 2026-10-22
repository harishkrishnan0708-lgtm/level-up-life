import { paintBackdrop, type BackdropTab } from './backdrops'
import { dayPhase } from './marketPixels'
import { cachedImage } from './pixelImage'
import { useHour } from './useHour'

/** The place each tab is set in, painted for the time of day and fixed behind the page as it scrolls. */
function TabBackdrop({ tab }: { tab: BackdropTab }) {
  const hour = useHour()
  const phase = dayPhase(hour)
  // The sun moves through the day, so daytime scenes are painted per hour.
  const key = `backdrop-${tab}-${phase === 'day' ? hour : phase}`
  const image = cachedImage(key, () => paintBackdrop(tab, phase, hour))
  return <div className={`tab-backdrop${phase === 'day' ? ' daylight' : ''}`} style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
}

export default TabBackdrop
