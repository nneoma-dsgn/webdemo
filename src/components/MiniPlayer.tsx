'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { closeMini, useMini } from '../data/mini'
import { loadApi, timeOf, type YTPlayer } from './HeroVideo'

/* Picture-in-picture inside Circo: the video keeps playing in a small window in the corner
   while you browse. Expand returns to the full player at the same moment; close stops it.
   (Real, over-other-apps PiP needs Circo's own video element; YouTube embeds don't allow it.) */
export function MiniPlayer() {
  const mini = useMini()
  const pathname = usePathname()
  const router = useRouter()
  const mount = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0)

  // The full player has its own video; opening it retires the mini one.
  const onWatch = pathname?.startsWith('/watch')
  useEffect(() => {
    if (onWatch && mini) closeMini()
  }, [onWatch, mini])

  useEffect(() => {
    if (!mini) return
    let cancelled = false
    const container = mount.current
    const host = document.createElement('div')
    container?.appendChild(host)
    loadApi().then(() => {
      if (cancelled || !window.YT) return
      const YT = window.YT
      player.current = new YT.Player(host, {
        videoId: mini.videoId,
        playerVars: { autoplay: 1, start: Math.floor(mini.t), controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3 },
        events: {
          onStateChange: (e: { data: number }) => setPlaying(e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING),
        },
      })
    })
    const tick = window.setInterval(() => {
      const p = player.current
      const d = p?.getDuration?.() ?? 0
      const now = timeOf(p)
      if (now !== null && d) setProgress(now / d)
    }, 500)
    return () => {
      cancelled = true
      window.clearInterval(tick)
      player.current?.destroy?.()
      player.current = null
      if (container) container.innerHTML = ''
    }
  }, [mini])

  if (!mini || onWatch) return null

  const expand = () => {
    const t = Math.floor(timeOf(player.current) ?? mini.t)
    const q = new URLSearchParams({ t: String(t) })
    if (mini.ep) q.set('ep', mini.ep)
    router.push(`/watch/${mini.id}?${q}`)
  }

  return (
    <div className="mini" role="region" aria-label={`Now playing: ${mini.title}`}>
      <div className="mini__video" aria-hidden>
        <div ref={mount} />
      </div>
      <button className="mini__surface" onClick={expand} aria-label="Back to full screen" tabIndex={-1} />
      <div className="mini__bar">
        <div className="mini__text">
          <strong>{mini.title}</strong>
          {mini.sub && <span>{mini.sub}</span>}
        </div>
        <button
          className="mini__btn"
          onClick={() => {
            if (playing) player.current?.pauseVideo?.()
            else player.current?.playVideo?.()
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
              <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
              <path d="M5.75 3.78C5.42 3.58 5 3.82 5 4.21v11.58c0 .39.42.63.75.43l9.77-5.79a.5.5 0 0 0 0-.86L5.75 3.78Z" fill="currentColor" />
            </svg>
          )}
        </button>
        <button className="mini__btn" onClick={expand} aria-label="Back to full screen" title="Full screen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </button>
        <button className="mini__btn" onClick={closeMini} aria-label="Close player" title="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
      <i className="mini__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />
    </div>
  )
}
