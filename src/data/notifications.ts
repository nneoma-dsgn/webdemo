'use client'

import { useEffect, useMemo, useState } from 'react'
import { titleFor, titles, studios } from './catalog'
import { createListStore } from './listStore'
import { useReminders } from './reminders'
import { useViewing } from './viewing'

/* Notifications, two kinds for now:
     - reminder: a title you tapped Notify Me on is out.
     - episode: a new episode of a show you're watching, or from a studio you've joined.
   The prototype builds them from what's in this browser; in production the backend sends them
   (on release, and on each new episode) and tracks read state. */

export type Notice = { id: string; kind: 'reminder' | 'episode'; titleId: string; text: string; sub: string; art: string; href: string; at: number }

const readStore = createListStore('circo:notifications-read')
// Seen: the panel has been opened since it arrived (clears the bell's dot). Read: it was opened.
const seenStore = createListStore('circo:notifications-seen')
const HOUR = 36e5
// Stable timestamps per notice, so the list doesn't reshuffle on every render.
const ago = (key: string) => (([...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 70) + 1) * HOUR

/* Prototype: add ?notify to any URL to receive two new notifications just now (a release and
   a new episode, picked at random), to try the bell's dot and the panel. ?notify=clear removes
   every test notification and resets read and seen, so the list starts fresh. */
const EXTRA_KEY = 'circo:notifications-test'
type Extra = Notice
function loadExtra(): Extra[] {
  try {
    return JSON.parse(localStorage.getItem(EXTRA_KEY) ?? '[]')
  } catch {
    return []
  }
}
function addTestNotifications() {
  const pool = Object.values(titles)
  const pick = () => pool[Math.floor(Math.random() * pool.length)]
  const now = Date.now()
  const rel = pick()
  const ser = pool.filter((t) => t.kind === 'series')[Math.floor(Math.random() * pool.filter((t) => t.kind === 'series').length)]
  const fresh: Extra[] = [
    { id: `test-rem-${now}`, kind: 'reminder', titleId: rel.id, text: `${rel.name} is out!`, sub: 'Watch it now', art: rel.still, href: `/watch/${rel.id}`, at: now },
    { id: `test-ep-${now}`, kind: 'episode', titleId: ser.id, text: `New episode of ${ser.name}`, sub: studios[ser.studioId]?.name ?? '', art: ser.still, href: `/watch/${ser.id}`, at: now - 6e4 },
  ]
  try {
    localStorage.setItem(EXTRA_KEY, JSON.stringify([...fresh, ...loadExtra()]))
  } catch {}
}

export function useNotifications() {
  const [extra, setExtra] = useState<Extra[]>([])
  useEffect(() => {
    const url = new URL(location.href)
    if (url.searchParams.get('notify') === 'clear') {
      try {
        for (const k of [EXTRA_KEY, 'circo:notifications-read', 'circo:notifications-seen']) localStorage.removeItem(k)
      } catch {}
      url.searchParams.delete('notify')
      // A full reload so the read/seen lists pick up the reset.
      location.replace(url)
      return
    }
    if (url.searchParams.has('notify')) {
      addTestNotifications()
      url.searchParams.delete('notify')
      history.replaceState(null, '', url)
    }
    setExtra(loadExtra())
  }, [])

  const reminders = useReminders()
  const viewing = useViewing()
  const read = readStore.useList()
  const seen = seenStore.useList()

  const list = useMemo(() => {
    const now = Date.now()
    const out: Notice[] = []
    // Reminders: every title with Notify Me on.
    for (const t of Object.values(titles)) {
      if (!reminders.has(t.id)) continue
      out.push({ id: `rem-${t.id}`, kind: 'reminder', titleId: t.id, text: `${t.name} is out!`, sub: 'Watch it now', art: t.still, href: `/watch/${t.id}`, at: now - ago(t.id) })
    }
    // New episodes: series you've been watching, plus series from studios you've joined.
    const series = new Set<string>()
    for (const id of Object.keys(viewing.progress)) if (titleFor(id)?.kind === 'series') series.add(id)
    for (const [sid, sub] of Object.entries(viewing.subs))
      if (sub.until > now) for (const t of Object.values(titles)) if (t.studioId === sid && t.kind === 'series') series.add(t.id)
    for (const id of series) {
      const t = titleFor(id)
      if (!t) continue
      out.push({ id: `ep-${id}`, kind: 'episode', titleId: id, text: `New episode of ${t.name}`, sub: studios[t.studioId]?.name ?? '', art: t.still, href: `/watch/${id}`, at: now - ago(`ep-${id}`) })
    }
    return [...extra, ...out].sort((a, b) => b.at - a.at)
    // read isn't a dependency: the list itself doesn't change when something is read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, viewing.progress, viewing.subs, extra])

  return {
    list,
    isRead: read.has,
    unread: list.filter((n) => !read.has(n.id)).length,
    unseen: list.filter((n) => !seen.has(n.id) && !read.has(n.id)).length,
    markSeen: () => list.forEach((n) => !seen.has(n.id) && seen.toggle(n.id)),
    markRead: (id: string) => !read.has(id) && read.toggle(id),
  }
}

/* "Just now", "3h", "2d": how long ago, as notification lists show it. */
export function timeAgo(at: number) {
  const m = Math.round((Date.now() - at) / 6e4)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`
}
