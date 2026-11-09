'use client'

import { useEffect, useState } from 'react'
import { studios, type Title } from '../data/catalog'
import { useReminders } from '../data/reminders'
import { useMenu } from './Menu'

/* Where a coming-soon trailer ends, styled like a trailer's own end card: the scene behind, key
   art on one side, the title and a boxed release date on the other, then Remind me. */

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const PREMIERE_HOUR = 19 // evening premiere, local time
// Below this the waiting count reads as thin, so it isn't shown.
const SHOW_WAITING_FROM = 1000

/* "Coming 6 November" -> the next 6 November at 7pm. Null for open-ended copy like "More episodes soon". */
function premiere(when: string) {
  const m = when.match(/(\d{1,2})\s+([a-z]+)/i)
  const month = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1
  if (!m || month < 0) return null
  const now = new Date()
  const d = new Date(now.getFullYear(), month, Number(m[1]), PREMIERE_HOUR)
  if (d.getTime() < now.getTime()) d.setFullYear(d.getFullYear() + 1)
  return d
}

function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  return now
}

// Stable per title, so the count doesn't jump between visits.
const waitingFor = (id: string) => 200 + ([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 9000)

export function ComingSoon({ t, when, onReplay }: { t: Title; when: string; onReplay: () => void }) {
  const { toast } = useMenu()
  const reminders = useReminders()
  const on = reminders.has(t.id)
  const now = useNow()
  const date = premiere(when)
  const left = date ? Math.max(0, date.getTime() - now) : 0
  const waiting = waitingFor(t.id) + (on ? 1 : 0)
  const studio = studios[t.studioId]
  const day = date?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="soon" role="dialog" aria-label={`${t.name}, ${when.toLowerCase()}`}>
      <img className="soon__bg" src={t.still} alt="" />
      <i className="soon__shade" aria-hidden />

      {/* Laid out like a trailer's end card: key art on one side, title and date on the other. */}
      <div className="soon__body">
        <div className="soon__art" aria-hidden>
          {/* The poster's own colours, blurred behind it as a glow. */}
          <img className="soon__glow" src={t.poster} alt="" />
          <div className="soon__card">
            <img src={t.poster} alt="" />
          </div>
        </div>

        <div className="soon__copy">
          <h2 className="soon__title">{t.name}</h2>
          <p className="soon__meta">
            <span>{t.kind === 'series' ? 'Series' : 'Show'}</span>
            {studio && <span>{studio.name}</span>}
          </p>

          {date ? (
            <div className="soon__date" aria-label={`Premieres ${day} at 7pm`}>
              <span className="soon__cal" aria-hidden>
                <span>{date.toLocaleDateString('en-GB', { month: 'short' })}</span>
                <strong>{date.getDate()}</strong>
              </span>
              <span className="soon__when">
                <strong>Premieres {date.toLocaleDateString('en-GB', { weekday: 'long' })}</strong>
                <span>
                  {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} · 7pm ·{' '}
                  {left < 864e5 ? 'tonight' : `in ${Math.ceil(left / 864e5)} day${Math.ceil(left / 864e5) === 1 ? '' : 's'}`}
                </span>
              </span>
            </div>
          ) : (
            <p className="soon__open">{when}</p>
          )}

          <div className="soon__actions">
            <button
              className={`soon__remind${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => {
                if (reminders.toggle(t.id)) toast(`We’ll remind you when ${t.name} lands`)
              }}
            >
              {on ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              )}
              {on ? 'You’re on the list' : 'Remind me'}
            </button>
            <button className="soon__round" onClick={onReplay} aria-label="Replay teaser" title="Replay teaser">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button className="soon__round" onClick={() => toast('Link copied')} aria-label="Share" title="Share">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v13" />
              </svg>
            </button>
          </div>

          {waiting >= SHOW_WAITING_FROM && (
            <p className="soon__waiting">
              {on ? (
                <span>
                  <strong>You</strong> and {(waiting - 1).toLocaleString('en-NG')} others are waiting
                </span>
              ) : (
                <span>
                  <strong>{waiting.toLocaleString('en-NG')} people</strong> are waiting for this
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
