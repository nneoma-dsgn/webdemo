'use client'

import { useEffect, useRef, useState } from 'react'

/* Netflix-style hero trailer: the still shows first, the muted trailer fades in once it
   is actually playing, and fades back out to the still when it ends.
   Uses the YouTube IFrame API for preview; swap for the real stream (HLS) later. */

export type YTPlayer = {
  unloadModule?: (m: string) => void
  loadModule?: (m: string) => void
  setOption?: (module: string, option: string, value: unknown) => void
  loadVideoById: (o: { videoId: string; startSeconds?: number; endSeconds?: number }) => void
  getCurrentTime: () => number
  getDuration?: () => number
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void
  setVolume?: (v: number) => void
  setPlaybackRate?: (r: number) => void
  isMuted?: () => boolean
  mute: () => void
  unMute: () => void
  playVideo: () => void
  pauseVideo: () => void
  destroy: () => void
}
/* YouTube only adds the player's methods once it's ready; before that a call throws. */
export const timeOf = (p: YTPlayer | null | undefined) => (p && typeof p.getCurrentTime === 'function' ? p.getCurrentTime() : null)

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: object) => YTPlayer; PlayerState: { PLAYING: number; ENDED: number; PAUSED: number; BUFFERING: number } }
    onYouTubeIframeAPIReady?: () => void
  }
}

/* index.html starts fetching the API early; this just waits for it (or injects it as a fallback). */
/* Short beat after PLAYING so the first frame is on screen before the artwork fades.
   YouTube's own start indicator can't be hidden from here; see the note in the hero styles. */
export const REVEAL_DELAY_MS = 150

let apiPromise: Promise<void> | null = null
export function loadApi() {
  if (window.YT?.Player) return Promise.resolve()
  apiPromise ??= new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    }
  })
  return apiPromise
}

export function HeroVideo({ videoId, still, start = 0, end, onEnded }: { videoId: string; still: string; start?: number; end?: number; onEnded?: () => void }) {
  const endedRef = useRef(onEnded)
  endedRef.current = onEnded
  const mount = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  // Only set once the YouTube player reports ready; its methods do not exist before that.
  const ready = useRef<YTPlayer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduced) return
    let cancelled = false
    let revealTimer = 0
    loadApi().then(() => {
      if (cancelled || !mount.current || !window.YT) return
      const YT = window.YT
      player.current = new YT.Player(mount.current, {
        videoId,
        playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0, cc_lang_pref: 'none', start, ...(end ? { end } : {}) },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            ready.current = e.target
            // Starts muted via playerVars; any API call here makes YouTube flash its play/pause icon.
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.PLAYING) {
              // Reveal as soon as frames are flowing so picture and sound start together.
              window.clearTimeout(revealTimer)
              revealTimer = window.setTimeout(() => setPlaying(true), REVEAL_DELAY_MS)
            }
            if (e.data === YT.PlayerState.ENDED) {
              window.clearTimeout(revealTimer)
              setPlaying(false)
              endedRef.current?.()
            }
          },
        },
      })
    })
    return () => {
      cancelled = true
      window.clearTimeout(revealTimer)
      player.current?.destroy()
      player.current = null
      ready.current = null
    }
  }, [videoId, start, end, reduced])

  // Pause when the hero scrolls out of view, resume when it comes back.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    // Only toggle on real transitions: redundant play() calls make YouTube flash its
    // play/pause icon over the video.
    let pausedByScroll = false
    const io = new IntersectionObserver(([entry]) => {
      const p = ready.current
      if (!p) return
      const inView = entry.intersectionRatio >= 0.35
      if (!inView && !pausedByScroll) {
        p.pauseVideo()
        pausedByScroll = true
      } else if (inView && pausedByScroll) {
        p.playVideo()
        pausedByScroll = false
      }
    }, { threshold: [0, 0.35, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Moving the cursor over the hero brings the title back; it steps aside again after a
  // short idle, like a video player's controls. Marked on the hero as .hero--peek.
  useEffect(() => {
    const hero = wrap.current?.closest('.hero') as HTMLElement | null
    if (!hero) return
    let t = 0
    const peek = () => {
      hero.classList.add('hero--peek')
      window.clearTimeout(t)
      t = window.setTimeout(() => hero.classList.remove('hero--peek'), 2500)
    }
    const leave = () => {
      window.clearTimeout(t)
      hero.classList.remove('hero--peek')
    }
    hero.addEventListener('mousemove', peek)
    hero.addEventListener('mouseleave', leave)
    return () => {
      window.clearTimeout(t)
      hero.removeEventListener('mousemove', peek)
      hero.removeEventListener('mouseleave', leave)
      hero.classList.remove('hero--peek')
    }
  }, [])

  const toggleSound = () => {
    const p = ready.current
    if (!p) return
    if (muted) p.unMute()
    else p.mute()
    setMuted(!muted)
  }

  return (
    <div className={`hero-video${playing ? ' hero-video--on' : ''}`} ref={wrap}>
      <img className="hero__art" src={still} alt="" />
      <div className="hero-video__frame" aria-hidden>
        <div ref={mount} />
      </div>
      {playing && (
        <button className="hero-video__sound" onClick={toggleSound} aria-label={muted ? 'Turn sound on' : 'Mute'}>
          <SoundGlyph muted={muted} />
        </button>
      )}
    </div>
  )
}

function SoundGlyph({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      {muted ? <path d="M23 9l-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
    </svg>
  )
}
