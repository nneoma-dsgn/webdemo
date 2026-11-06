'use client'

import { useEffect } from 'react'

/* After payment, a short moment before the film plays on its own. Three looks to compare:
   circo: the C of the logo draws itself and closes into a circle around the play mark, the
   circle turns into a lens, then an eight-blade aperture twists open onto the film.
   lights: the screen dims like a cinema, a warm glow breathes behind the title, the film fades up.
   iris: the screen goes dark, a point of light swells, then opens like a lens onto the film.
   Timings match the keyframes in app.css (.unlock). */

export type RevealKind = 'circo' | 'lights' | 'iris'

const TIMING: Record<RevealKind, { closed: number; open: number; done: number }> = {
  circo: { closed: 350, open: 2300, done: 5200 },
  lights: { closed: 800, open: 2600, done: 4600 },
  iris: { closed: 600, open: 2400, done: 4300 },
}

export function Reveal({ kind, title, studio, onClosed, onOpen, onDone }: { kind: RevealKind; title: string; studio?: string; onClosed: () => void; onOpen: () => void; onDone: () => void }) {
  useEffect(() => {
    const t = TIMING[kind]
    const ts = [window.setTimeout(onClosed, t.closed), window.setTimeout(onOpen, t.open), window.setTimeout(onDone, t.done)]
    return () => ts.forEach((x) => window.clearTimeout(x))
    // Runs once per reveal; the callbacks are fixed for its lifetime.
  }, [])

  return (
    <div className={`unlock unlock--${kind}`} role="status" aria-label={`Now showing ${title}`}>
      <i className="reveal__veil" aria-hidden />
      <i className="reveal__glow" aria-hidden />
      {kind === 'iris' && <i className="reveal__ring" aria-hidden />}
      {kind === 'circo' ? (
        <>
          <div className="reveal__aperture" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ ['--i' as string]: i }} />
            ))}
          </div>
          <i className="reveal__glass" aria-hidden />
          <svg className="reveal__c" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="45" pathLength="100" />
          </svg>
          <Mark />
        </>
      ) : (
        <div className="reveal__title">
          <span>Now showing</span>
          <strong>{title}</strong>
          {studio && <em>from {studio}</em>}
        </div>
      )}
    </div>
  )
}

/* The Circo play mark: a rounded triangle in the brand gradient with a soft inner fold. */
function Mark() {
  return (
    <svg className="reveal__mark" viewBox="0 0 100 110" aria-hidden>
      <defs>
        <linearGradient id="mark-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a1a" />
          <stop offset="0.45" stopColor="#ff2d4a" />
          <stop offset="1" stopColor="#c2105e" />
        </linearGradient>
        <radialGradient id="mark-fold" cx="0.42" cy="0.5" r="0.45">
          <stop offset="0" stopColor="#5a0a2a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#5a0a2a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M22 8C12 2 2 8 2 20v70c0 12 10 18 20 12l66-37c9-5 9-15 0-20z" fill="url(#mark-fill)" />
      <path d="M22 8C12 2 2 8 2 20v70c0 12 10 18 20 12l66-37c9-5 9-15 0-20z" fill="url(#mark-fold)" />
    </svg>
  )
}
