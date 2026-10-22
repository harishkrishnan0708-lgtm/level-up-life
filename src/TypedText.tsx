import { useEffect, useState } from 'react'
import './TypedText.css'

/** Reveals text a few letters at a time, like someone speaking. Tap to show it all at once. */
function TypedText({ text, onDone }: { text: string; onDone: () => void }) {
  const [shown, setShown] = useState(() => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? text.length : 0))

  useEffect(() => {
    if (shown >= text.length) {
      onDone()
      return
    }
    const timer = window.setTimeout(() => setShown((count) => Math.min(text.length, count + 2)), 30)
    return () => window.clearTimeout(timer)
  }, [shown, text, onDone])

  return (
    <button type="button" className="typed-text" onClick={() => setShown(text.length)}>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      <span className="visually-hidden">{text}</span>
    </button>
  )
}

export default TypedText
