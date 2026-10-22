import { useEffect, useState } from 'react'

/** The hour shown, from the phone's clock; on the development server, `?hour=13` previews another time. */
function currentHour(): number {
  const preview = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get('hour') ?? NaN) : NaN
  return Number.isInteger(preview) && preview >= 0 && preview < 24 ? preview : new Date().getHours()
}

/** The hour of the day, checked every minute so scenes change with the clock while they're open. */
export function useHour(): number {
  const [hour, setHour] = useState(currentHour)
  useEffect(() => {
    const timer = window.setInterval(() => setHour(currentHour()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return hour
}
