'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { titles, trailers } from '../data/catalog'
import { loadApi, type YTPlayer } from '../components/HeroVideo'
import { useMenu } from '../components/Menu'

/* Circo video player. Loading screen after Netflix (title top-left, spinner centre); controls
   after the Circo mobile player (glass skip/play circles, red scrubber) and Apple TV / Netflix web
   (episode + title bottom-left, tools bottom-right). Controls fade out while playing and idle.
   Plays the title's trailer from YouTube for the prototype; production streams Circo's own video. */

const IDLE_MS = 3000
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, '0')
  return h ? `${h}:${m.toString().padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export default function Player() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const { open, toast } = useMenu()
  const t = titles[params?.id ?? ''] ?? titles.kob
  const clip = trailers[t.id]
  const ep = search.get('ep')

  const root = useRef<HTMLDivElement>(null)
  const mount = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [speed, setSpeed] = useState(1)
  const [subs, setSubs] = useState(false)
  const [idle, setIdle] = useState(false)
  const [full, setFull] = useState(false)
  const [scrubbing, setScrubbing] = useState<number | null>(null)
  const idleT = useRef(0)

  /* --- YouTube player --- */
  useEffect(() => {
    if (!clip) return
    let cancelled = false
    loadApi().then(() => {
      if (cancelled || !mount.current || !window.YT) return
      const YT = window.YT
      player.current = new YT.Player(mount.current, {
        videoId: clip.videoId,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: () => {
            setReady(true)
            player.current?.setVolume?.(80)
          },
          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === YT.PlayerState.PLAYING)
            setBuffering(e.data === YT.PlayerState.BUFFERING)
            if (e.data === YT.PlayerState.PLAYING) {
              setStarted(true)
              setDuration(player.current?.getDuration?.() ?? 0)
            }
          },
        },
      })
    })
    return () => {
      cancelled = true
      player.current?.destroy()
      player.current = null
    }
  }, [clip])

  // Clock for the scrubber.
  useEffect(() => {
    if (!ready) return
    const tick = window.setInterval(() => {
      const p = player.current
      if (!p) return
      setTime(p.getCurrentTime())
      const d = p.getDuration?.() ?? 0
      if (d) setDuration(d)
    }, 250)
    return () => window.clearInterval(tick)
  }, [ready])

  /* --- Controls --- */
  const toggle = useCallback(() => {
    const p = player.current
    if (!p || !ready) return
    if (playing) p.pauseVideo()
    else p.playVideo()
  }, [playing, ready])

  const seekBy = useCallback(
    (d: number) => {
      const p = player.current
      if (!p || !ready) return
      const next = Math.min(Math.max(0, p.getCurrentTime() + d), duration || Infinity)
      p.seekTo?.(next, true)
      setTime(next)
    },
    [duration, ready],
  )

  const toggleMute = useCallback(() => {
    const p = player.current
    if (!p || !ready) return
    if (muted) p.unMute()
    else p.mute()
    setMuted(!muted)
  }, [muted, ready])

  const changeVolume = (v: number) => {
    const p = player.current
    setVolume(v)
    p?.setVolume?.(v)
    if (v === 0 && !muted) {
      p?.mute()
      setMuted(true)
    } else if (v > 0 && muted) {
      p?.unMute()
      setMuted(false)
    }
  }

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else root.current?.requestFullscreen?.()
  }, [])

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  const exit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    if (window.history.length > 1) router.back()
    else router.push('/')
  }, [router])

  /* --- Idle: hide controls while playing and the mouse rests --- */
  const wake = useCallback(() => {
    setIdle(false)
    window.clearTimeout(idleT.current)
    idleT.current = window.setTimeout(() => setIdle(true), IDLE_MS)
  }, [])

  useEffect(() => {
    wake()
    return () => window.clearTimeout(idleT.current)
  }, [wake])

  /* --- Keyboard --- */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, [role=menu]')) return
      wake()
      if (e.key === ' ' || e.key === 'k') toggle()
      else if (e.key === 'ArrowRight') seekBy(10)
      else if (e.key === 'ArrowLeft') seekBy(-10)
      else if (e.key === 'm') toggleMute()
      else if (e.key === 'f') toggleFull()
      else if (e.key === 'Escape' && !document.fullscreenElement) exit()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [toggle, seekBy, toggleMute, toggleFull, exit, wake])

  /* --- Menus (shared dropdown) --- */
  const speedMenu = (el: HTMLElement) =>
    open(el, {
      label: 'Playback speed',
      header: <span className="dd__title">Playback speed</span>,
      items: SPEEDS.map((r) => ({
        id: `s${r}`,
        label: r === 1 ? 'Normal' : `${r}×`,
        icon: r === speed ? 'check' : undefined,
        onSelect: () => {
          setSpeed(r)
          player.current?.setPlaybackRate?.(r)
        },
      })),
    })

  const subsMenu = (el: HTMLElement) =>
    open(el, {
      label: 'Subtitles',
      header: <span className="dd__title">Subtitles</span>,
      items: [
        { id: 'off', label: 'Off', icon: !subs ? 'check' : undefined, onSelect: () => setSubs(false) },
        {
          id: 'en',
          label: 'English',
          icon: subs ? 'check' : undefined,
          onSelect: () => {
            setSubs(true)
            toast('Subtitles aren’t available for this preview')
          },
        },
      ],
    })

  const moreMenu = (el: HTMLElement) =>
    open(el, {
      label: `${t.name} options`,
      header: <span className="dd__title">{t.name}</span>,
      items: [
        { id: 'later', label: 'Watch later', icon: 'bookmark', onSelect: () => toast('Added to Saved for later') },
        { id: 'share', label: 'Share', icon: 'share', onSelect: () => toast('Link copied') },
        { kind: 'separator', id: 's' },
        { id: 'report', label: 'Report a problem', icon: 'flag', danger: true, onSelect: () => toast('Thanks, we’ll look into it') },
      ],
    })

  const shown = scrubbing ?? time
  const pct = duration ? (shown / duration) * 100 : 0
  const hide = idle && playing && started && scrubbing === null
  const series = t.kind === 'series'
  const epLabel = ep ?? (series ? 'S1 · E1' : null)

  return (
    <div ref={root} className={`vp${hide ? ' vp--idle' : ''}${!started && clip ? ' vp--loading' : ''}`} onMouseMove={wake} onClick={wake}>
      {/* Video, contained (letterboxed) rather than cropped. Rendered large and scaled down so
          YouTube's own overlays shrink with it. */}
      <div className={`vp__video${started ? ' is-on' : ''}`} aria-hidden>
        <div ref={mount} />
      </div>
      {!clip && <img className="vp__still" src={t.still} alt="" />}

      {/* Click anywhere on the picture to play / pause. */}
      <button className="vp__surface" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} onDoubleClick={toggleFull} tabIndex={-1} />

      {/* Loading: title and episode top-left, spinner centre (until the first frame). */}
      {!started && clip && (
        <div className="vp__loading" role="status" aria-label={`Loading ${t.name}`}>
          <div className="vp__loading-title">
            <span>{t.name}</span>
            {epLabel && <strong>{epLabel}</strong>}
          </div>
          <span className="spin-grad" aria-hidden />
        </div>
      )}
      {started && buffering && <span className="spin-grad vp__buffer" aria-label="Buffering" />}

      {!clip && (
        <div className="vp__unavailable">
          <strong>Preview unavailable</strong>
          <span>There’s no trailer for {t.name} in this prototype yet.</span>
        </div>
      )}

      {/* --- Chrome --- */}
      <div className="vp__top">
        <button className="vp__icon" onClick={exit} aria-label="Back">
          <Svg d={['M19 12H5', 'm12 19-7-7 7-7']} />
        </button>
        <div className="vp__top-right">
          <button className="vp__icon" onClick={() => toast('Looking for devices nearby')} aria-label="Cast to device">
            <Svg d={['M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6', 'M2 12a9 9 0 0 1 8 8', 'M2 16a5 5 0 0 1 4 4', 'M2 20h.01']} />
          </button>
          <button className="vp__icon" onClick={(e) => moreMenu(e.currentTarget)} aria-label="More options">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
        </div>
      </div>

      {started && (
        <div className="vp__center">
          <button className="vp__skip" onClick={() => seekBy(-10)} aria-label="Back 10 seconds">
            <SkipIcon dir={-1} />
          </button>
          <button className="vp__play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
                <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 20 20" aria-hidden style={{ marginLeft: 4 }}>
                <path d="M5.75 3.78C5.42 3.58 5 3.82 5 4.21v11.58c0 .39.42.63.75.43l9.77-5.79a.5.5 0 0 0 0-.86L5.75 3.78Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <button className="vp__skip" onClick={() => seekBy(10)} aria-label="Forward 10 seconds">
            <SkipIcon dir={1} />
          </button>
        </div>
      )}

      <div className="vp__bottom">
        <div className="vp__scrub">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={shown}
            aria-label="Seek"
            aria-valuetext={`${fmt(shown)} of ${fmt(duration)}`}
            style={{ ['--p' as string]: `${pct}%` }}
            onChange={(e) => setScrubbing(Number(e.target.value))}
            onPointerUp={() => {
              if (scrubbing !== null) {
                player.current?.seekTo?.(scrubbing, true)
                setTime(scrubbing)
              }
              setScrubbing(null)
            }}
            onKeyUp={() => {
              if (scrubbing !== null) player.current?.seekTo?.(scrubbing, true)
              setScrubbing(null)
            }}
          />
          <div className="vp__times">
            <span>{fmt(shown)}</span>
            <span>-{fmt(duration - shown)}</span>
          </div>
        </div>

        <div className="vp__row">
          <div className="vp__title">
            {epLabel && <span>{epLabel}</span>}
            <strong>{t.name}</strong>
          </div>
          <div className="vp__tools">
            <div className="vp__volume">
              <button className="vp__icon" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted || volume === 0 ? (
                  <Svg d={['M11 5L6 9H2v6h4l5 4V5z', 'M23 9l-6 6', 'M17 9l6 6']} />
                ) : (
                  <Svg d={['M11 5L6 9H2v6h4l5 4V5z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M19 5a10 10 0 0 1 0 14']} />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                aria-label="Volume"
                style={{ ['--p' as string]: `${muted ? 0 : volume}%` }}
                onChange={(e) => changeVolume(Number(e.target.value))}
              />
            </div>
            {series && (
              <button className="vp__icon" onClick={() => toast('Next episode is coming soon')} aria-label="Next episode" title="Next episode">
                <Svg d={['M6 4l10 8-10 8V4z', 'M19 5v14']} />
              </button>
            )}
            <button className={`vp__icon${subs ? ' is-on' : ''}`} onClick={(e) => subsMenu(e.currentTarget)} aria-label="Subtitles" title="Subtitles">
              <Svg d={['M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'M7 13h3', 'M13 13h4', 'M7 16h8']} />
            </button>
            <button className="vp__icon vp__speed" onClick={(e) => speedMenu(e.currentTarget)} aria-label={`Playback speed ${speed}x`} title="Playback speed">
              {speed === 1 ? <Svg d={['M12 14l4-4', 'M3.34 19a10 10 0 1 1 17.32 0']} /> : <span>{speed}×</span>}
            </button>
            <button className="vp__icon" onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'} title="Full screen">
              {full ? (
                <Svg d={['M8 3v3a2 2 0 0 1-2 2H3', 'M21 8h-3a2 2 0 0 1-2-2V3', 'M3 16h3a2 2 0 0 1 2 2v3', 'M16 21v-3a2 2 0 0 1 2-2h3']} />
              ) : (
                <Svg d={['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3']} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Svg({ d }: { d: string[] }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d.map((x) => (
        <path key={x} d={x} />
      ))}
    </svg>
  )
}

function SkipIcon({ dir }: { dir: 1 | -1 }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g transform={dir === 1 ? 'translate(24 0) scale(-1 1)' : undefined}>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </g>
      <text x="12" y="15.6" textAnchor="middle" fontSize="7.2" fontWeight="700" fill="currentColor" stroke="none">
        10
      </text>
    </svg>
  )
}
