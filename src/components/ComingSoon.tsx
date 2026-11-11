'use client'

import { useEffect, useState } from 'react'
import { type Title } from '../data/catalog'
import { useReminders } from '../data/reminders'
import { useMenu } from './Menu'
import { Button } from './ui'

/* Where a coming-soon trailer ends: the scene blurs out like a premiere screen, the thumbnail
   comes up, and below it the title, release date, a line of description, Notify Me and Replay. */

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const PREMIERE_HOUR = 19 // evening premiere, local time

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


export function ComingSoon({ t, when, onReplay }: { t: Title; when: string; onReplay: () => void }) {
  const { toast } = useMenu()
  const reminders = useReminders()
  const on = reminders.has(t.id)
  const now = useNow()
  const date = premiere(when)
  const left = date ? Math.max(0, date.getTime() - now) : 0

  return (
    <div className="soon" role="dialog" aria-label={`${t.name}, ${when.toLowerCase()}`}>
      <img className="soon__bg" src={t.still} alt="" />
      <i className="soon__shade" aria-hidden />

      {/* The scene blurs out behind; the thumbnail sits above an Apple TV style block. */}
      <div className="soon__body">
        <img className="soon__thumb" src={t.poster} alt="" />
        <h2 className="soon__title">{t.name}</h2>
        <span className="soon__date">
          {date ? `Coming ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}${left < 864e5 ? ' · Tonight' : ''}` : when}
        </span>
        <p className="soon__blurb">{t.blurb}</p>
        <div className="soon__actions">
          <Button
            size="lg"
            variant={on ? 'secondary' : 'primary'}
            aria-pressed={on}
            icon={
              on ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              )
            }
            onClick={() => {
              if (reminders.toggle(t.id)) toast(`We’ll let you know when ${t.name} drops`)
            }}
          >
            {on ? 'Notifying You' : 'Notify Me'}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            }
            onClick={onReplay}
          >
            Replay
          </Button>
        </div>
      </div>
    </div>
  )
}
