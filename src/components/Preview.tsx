'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { backdropSm, featured, studios, titles, trailers } from '../data/catalog'
import { loadApi, REVEAL_DELAY_MS, type YTPlayer } from './HeroVideo'
import { useMenu } from './Menu'
import { savedToast, useSaved } from '../data/saved'

/* Hover preview for poster rails (signed-in only). Resting on a poster opens one card that
   grows out of it: the trailer plays muted on top, and a frosted body tinted with the
   title's colour carries Watch Now, quick actions and details. One card for the app. */

type Ctx = { hover: (id: string, el: HTMLElement) => void; leave: () => void }
const PreviewCtx = createContext<Ctx | null>(null)
export const usePreview = () => useContext(PreviewCtx)

const OPEN_DELAY_MS = 450
// While the page is scrolling, posters sliding under the cursor shouldn't open previews.
const SCROLL_SETTLE_MS = 250
// `shown` flips after the delay; the card mounts hidden right away so the trailer starts loading early.
type Open = { id: string; x: number; y: number; w: number; ox: number; oy: number; shown: boolean }

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null)
  const openT = useRef(0)
  const closeT = useRef(0)
  const lastScroll = useRef(0)
  const settleT = useRef(0)
  const pending = useRef<{ id: string; el: HTMLElement } | null>(null)

  const hover = useCallback((id: string, el: HTMLElement) => {
    if (window.matchMedia('(hover: none)').matches) return
    // Mid-scroll: remember the poster and open once scrolling settles (if still on it).
    if (Date.now() - lastScroll.current < SCROLL_SETTLE_MS) {
      pending.current = { id, el }
      return
    }
    pending.current = null
    window.clearTimeout(closeT.current)
    window.clearTimeout(openT.current)
    {
      const r = el.getBoundingClientRect()
      const w = Math.max(340, r.width * 2)
      const h = (w * 9) / 16 + 170
      const x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12)
      const vy = Math.min(Math.max(12, r.top + r.height / 2 - h / 2), window.innerHeight - h - 12)
      // Stored in page coordinates so the card scrolls with the page, anchored to its poster.
      setOpen({ id, x: x + window.scrollX, y: vy + window.scrollY, w, ox: r.left + r.width / 2 - x, oy: r.top + r.height / 2 - vy, shown: false })
    }
    openT.current = window.setTimeout(() => setOpen((o) => (o && o.id === id ? { ...o, shown: true } : o)), OPEN_DELAY_MS)
  }, [])

  const leave = useCallback(() => {
    pending.current = null
    window.clearTimeout(openT.current)
    window.clearTimeout(closeT.current)
    closeT.current = window.setTimeout(() => setOpen(null), 140)
  }, [])

  // Scrolling (page or a rail) closes any preview and holds new ones until it stops.
  useEffect(() => {
    const onScroll = () => {
      lastScroll.current = Date.now()
      window.clearTimeout(openT.current)
      setOpen(null)
      window.clearTimeout(settleT.current)
      settleT.current = window.setTimeout(() => {
        const p = pending.current
        if (p && p.el.isConnected && p.el.matches(':hover')) hover(p.id, p.el)
      }, SCROLL_SETTLE_MS)
    }
    window.addEventListener('wheel', onScroll, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => {
      window.removeEventListener('wheel', onScroll)
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.clearTimeout(settleT.current)
    }
  }, [hover])

  return (
    <PreviewCtx.Provider value={{ hover, leave }}>
      {children}
      {open && <PreviewCard key={open.id} open={open} onEnter={() => window.clearTimeout(closeT.current)} onLeave={leave} />}
    </PreviewCtx.Provider>
  )
}

function PreviewCard({ open, onEnter, onLeave }: { open: Open; onEnter: () => void; onLeave: () => void }) {
  const t = titles[open.id]
  const clip = trailers[open.id]
  const tint = featured.find((f) => f.id === open.id)?.tint ?? '#6b6b6b'
  const { toast, open: openMenu } = useMenu()
  const router = useRouter()
  const mount = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const ready = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const savedList = useSaved()
  const saved = savedList.has(t.id)
  // If the trailer can't start (blocked, slow, unavailable), show the backdrop instead of a blank frame.
  const [stalled, setStalled] = useState(!clip)

  useEffect(() => {
    if (!clip) return
    let cancelled = false
    let reveal = 0
    const stall = window.setTimeout(() => setStalled(true), 5000)
    loadApi().then(() => {
      if (cancelled || !mount.current || !window.YT) return
      const YT = window.YT
      player.current = new YT.Player(mount.current, {
        videoId: clip.videoId,
        playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0, start: clip.start, end: clip.end },
        events: {
          onReady: () => {
            ready.current = true
            // Starts muted via playerVars; any API call here makes YouTube flash its play/pause icon.
          },
          onError: () => setStalled(true),
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.PLAYING) {
              window.clearTimeout(reveal)
              window.clearTimeout(stall)
              // Hidden until YouTube's start overlays fade; they're large in a small frame.
              reveal = window.setTimeout(() => setPlaying(true), REVEAL_DELAY_MS)
            }
            if (e.data === YT.PlayerState.ENDED) setPlaying(false)
          },
        },
      })
    })
    return () => {
      cancelled = true
      window.clearTimeout(reveal)
      window.clearTimeout(stall)
      player.current?.destroy()
      player.current = null
    }
  }, [clip])

  return (
    <div
      className={`pv${open.shown ? ' is-shown' : ''}`}
      style={{ left: open.x, top: open.y, width: open.w, transformOrigin: `${open.ox}px ${open.oy}px`, ['--tint' as string]: tint }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      role="dialog"
      aria-label={`${t.name} preview`}
    >
      <div className={`pv__media${playing ? ' is-playing' : ''}`} onClick={() => router.push(`/watch/${t.id}`)}>
        {/* Loading base: a dark blur of the art, not the thumbnail itself. */}
        <img className="pv__blur" src={backdropSm(t.id)} alt="" />
        {clip && (
          <div className="pv__video" aria-hidden>
            <div ref={mount} />
          </div>
        )}
        {stalled && !playing && <img className="pv__still" src={backdropSm(t.id)} alt="" />}
        {playing && (
          <button
            className="pv__sound"
            onClick={(e) => {
              e.stopPropagation()
              const p = player.current
              if (!p || !ready.current) return
              if (muted) p.unMute()
              else p.mute()
              setMuted(!muted)
            }}
            aria-label={muted ? 'Turn sound on' : 'Mute'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {muted ? <path d="M23 9l-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
            </svg>
          </button>
        )}
        {clip && <span className="pv__progress" data-on={playing} style={{ animationDuration: `${clip.end - clip.start}s` }} />}
      </div>
      <div className="pv__body">
        <h3 className="pv__title">{t.name}</h3>
        <p className="pv__meta">
          <span className="pv__chip">{t.kind === 'series' ? 'Series' : 'Show'}</span>
          <span>{studios[t.studioId].name}</span>
        </p>
        <p className="pv__blurb">{t.blurb}</p>
        <div className="pv__actions">
          <button className="pv__watch" onClick={() => router.push(`/watch/${t.id}`)}>
            <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden>
              <path d="M5.75 3.78C5.42 3.58 5 3.82 5 4.21v11.58c0 .39.42.63.75.43l9.77-5.79a.5.5 0 0 0 0-.86L5.75 3.78Z" fill="currentColor" />
            </svg>
            Watch Now
          </button>
          <button
            className={`pv__round${saved ? ' is-on' : ''}`}
            aria-label={saved ? 'Saved for later' : 'Watch later'}
            aria-pressed={saved}
            title={saved ? 'Saved for later' : 'Watch later'}
            onClick={() => toast(savedToast(savedList.toggle(t.id)))}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {saved ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 5v14M5 12h14" />}
            </svg>
          </button>
          {/* The poster's ⋯ menu is covered by this card, so it lives here while previewing. */}
          <button className="pv__round" aria-label={`More options for ${t.name}`} onClick={(e) => openMenu(e.currentTarget, t.name)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
