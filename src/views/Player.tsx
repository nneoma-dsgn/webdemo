'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { comingSoon, episodes, episodeThumb, featureFor, naira, studios, titles, trailers, type Title } from '../data/catalog'
import { accessLeft, buyPass, extendPass, fakePassLeft, getProgress, joinStudio, saveProgress, clearProgress, startPass, useClock, useViewing } from '../data/viewing'
import { Access, ReceiptCard, type Receipt } from '../components/Access'
import { ComingSoon } from '../components/ComingSoon'
import { Reveal, type RevealKind } from '../components/Reveal'
import { playUnlock } from '../components/unlockSound'
import { loadApi, type YTPlayer } from '../components/HeroVideo'
import { useMenu } from '../components/Menu'
import { savedToast, useSaved } from '../data/saved'

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

/* A fresh player per title and episode, so moving to the next episode starts clean. */
export default function Player() {
  const params = useParams<{ id: string }>()
  const ep = useSearchParams().get('ep')
  return <PlayerView key={`${params?.id}:${ep}`} />
}

/* Up Next appears near the end without credit markers: 4% of the running time before the end,
   at least 20s (short clips) and at most 6 min (films). Once it ends, a 10s countdown plays it. */
const upNextAt = (duration: number) => Math.min(360, Math.max(20, duration * 0.04))
const COUNTDOWN_S = 10

/* What to suggest after a film or a series finale: a random title with something to play,
   from the same genre when there is one. */
function suggestAfter(t: Title) {
  const pool = Object.values(titles).filter((x) => x.id !== t.id && trailers[x.id] && !comingSoon.some((c) => c.id === x.id))
  const near = pool.filter((x) => x.genre === t.genre || x.studioId === t.studioId)
  const from = near.length ? near : pool
  return from[Math.floor(Math.random() * from.length)]
}

function PlayerView() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const { open, toast } = useMenu()
  const t = titles[params?.id ?? ''] ?? titles.kob
  // Series with real episodes play each episode's own clip; everything else plays its trailer.
  const eps = episodes[t.id]
  // Where this title was left off (read once; the player remounts per title and episode).
  const [saved0] = useState(() => getProgress(t.id))
  const ep = search.get('ep') ?? saved0?.ep ?? null
  const epNo = Number(ep?.match(/(\d+)\s*$/)?.[1] ?? 1)
  const epClip = eps?.[epNo - 1] ?? eps?.[0]
  // Not out yet: the trailer ends on a reminder instead of access options.
  const soon = comingSoon.find((c) => c.id === t.id)
  const saved = useSaved()
  // Resume point for this exact episode: skip near-zero starts and finished ones.
  const [resumeAt] = useState(() => (saved0 && (saved0.ep ?? null) === ep && saved0.t > 10 && (!saved0.d || saved0.t < saved0.d - 30) ? Math.floor(saved0.t) : 0))
  const [resumed, setResumed] = useState(false)
  // Which post-payment reveal to show while they're compared: ?reveal=circo (default), lights or iris.
  const r = search.get('reveal')
  const revealKind: RevealKind = r === 'lights' || r === 'iris' ? r : 'circo'

  const root = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
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
  // Tapping the picture hides the controls; tapping again brings them back.
  const [hidden, setHidden] = useState(false)
  const [full, setFull] = useState(false)
  const [scrubbing, setScrubbing] = useState<number | null>(null)
  // Series only: Info / Episodes panel under the scrubber (Apple TV style).
  const [panel, setPanel] = useState<'info' | 'episodes' | null>(null)
  // The trailer has finished: offer a pass (public studio) or a subscription (private studio).
  const [ended, setEnded] = useState(false)
  // Paid in this session: the trailer plays through without asking again.
  // Access: a 24-hour pass for this title or a subscription to its studio.
  const viewing = useViewing()
  const now = useClock(1000)
  const accessMs = accessLeft(viewing, t, now)
  const unlocked = accessMs !== null && accessMs > 0
  /* Teaser until you have access; then the title itself (an episode's own clip, or the film).
     Sticky for this visit, so a pass running out mid-film doesn't swap the video. */
  const [featureMode, setFeatureMode] = useState(unlocked)
  useEffect(() => {
    if (unlocked) setFeatureMode(true)
  }, [unlocked])
  const clip = featureMode
    ? { videoId: epClip?.videoId ?? featureFor(t.id, epNo), start: 0, end: 0 }
    : (trailers[t.id] ?? (epClip ? { videoId: epClip.videoId, start: 0, end: 0 } : undefined))
  const isPassAccess = unlocked && !viewing.subs[t.studioId]
  const passExpired = accessMs === 0
  // Prototype: ?passLeft=5m (or 90s, 2h) fakes a pass that is about to run out.
  useEffect(() => {
    const m = search.get('passLeft')?.match(/^(\d+)(s|m|h)$/)
    if (m) fakePassLeft(t.id, Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5 }[m[2] as 's' | 'm' | 'h'])
    // Once per load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Shown once the unlock reveal has finished.
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const closeReceipt = useCallback(() => setReceipt(null), [])
  // Viewer chose to watch the credits instead of moving on.
  const [stayed, setStayed] = useState(false)
  // Just paid: the reveal is running.
  const [reveal, setReveal] = useState(false)
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
        playerVars: { autoplay: 1, start: featureMode ? resumeAt : 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: () => {
            setReady(true)
            player.current?.setVolume?.(80)
          },
          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === YT.PlayerState.PLAYING)
            setBuffering(e.data === YT.PlayerState.BUFFERING)
            if (e.data === YT.PlayerState.ENDED) {
              setEnded(true)
              if (document.fullscreenElement) document.exitFullscreen?.()
            }
            if (e.data === YT.PlayerState.PLAYING) {
              // A pass's 24 hours start on first play.
              startPass(t.id)
              if (resumeAt && featureMode) setResumed(true)
              setEnded(false)
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
    // Only a new video should rebuild the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.videoId])

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

  // Height of the bottom controls, so Up Next can sit just above them when they show.
  useEffect(() => {
    const el = bottom.current
    if (!el || !root.current) return
    const ro = new ResizeObserver(() => root.current?.style.setProperty('--ctrl-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Moving the mouse over the player brings the controls back, even after a tap hid them.
  // Tiny moves (the hand settling after a tap) are ignored.
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const onHover = (e: React.MouseEvent) => {
    const p = lastPos.current
    lastPos.current = { x: e.clientX, y: e.clientY }
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 4) return
    setHidden(false)
    wake()
  }

  /* --- Keyboard --- */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, [role=menu]')) return
      wake()
      setHidden(false)
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
        saved.has(t.id)
          ? { id: 'later', label: 'Saved for later', icon: 'check', onSelect: () => toast(savedToast(saved.toggle(t.id))) }
          : { id: 'later', label: 'Watch later', icon: 'bookmark', onSelect: () => toast(savedToast(saved.toggle(t.id))) },
        { id: 'share', label: 'Share', icon: 'share', onSelect: () => toast('Link copied') },
        { id: 'mute', label: 'Mute', icon: 'mute', onSelect: () => toast(`You’ll see less from ${studios[t.studioId]?.name ?? 'this studio'}`) },
        { kind: 'separator', id: 's' },
        { id: 'block', label: 'Block', icon: 'block', danger: true, onSelect: () => toast(`${studios[t.studioId]?.name ?? 'This studio'} is blocked`) },
        { id: 'report', label: 'Report', icon: 'flag', danger: true, onSelect: () => toast('Thanks, we’ll look into it') },
      ],
    })

  const replay = () => {
    setEnded(false)
    player.current?.seekTo?.(0, true)
    player.current?.playVideo()
  }
  // After renewing a pass that ran out mid-film: carry on from the same spot.
  const carryOn = () => {
    setHalted(false)
    player.current?.playVideo()
  }

  const shown = scrubbing ?? time
  const pct = duration ? (shown / duration) * 100 : 0
  const hide = (hidden || (idle && playing && started)) && scrubbing === null && !panel
  const series = t.kind === 'series'
  const studio = studios[t.studioId]
  const epLabel = ep ?? (series ? 'S1 · E1' : null)
  // Current episode number from labels like "S1 · E4" or "EP 2".
  const epNum = Number(epLabel?.match(/(\d+)\s*$/)?.[1] ?? 1)
  const epPrefix = epLabel?.includes('S') && epLabel.includes('E') ? epLabel.replace(/E\s*\d+\s*$/, 'E') : 'EP '
  const episodeList = eps
    ? eps.map((e, i) => ({ n: i + 1, label: `${epPrefix}${i + 1}`, name: e.title, mins: e.mins, blurb: e.blurb as string | undefined, art: episodeThumb(e.videoId) }))
    : Array.from({ length: 8 }, (_, i) => ({ n: i + 1, label: `${epPrefix}${i + 1}`, name: i === 0 ? 'Pilot' : `Chapter ${i + 1}`, mins: 42 + ((i * 7) % 12), blurb: undefined as string | undefined, art: t.still }))
  const current = episodeList[epNum - 1] ?? episodeList[0]
  const next = episodeList[epNum]
  const nextBlurb = [
    'Old loyalties are tested when a new rule changes the game for everyone.',
    'A fragile alliance forms, but not everyone at the table can be trusted.',
    'A secret from the past resurfaces and forces a choice no one wants to make.',
    'With the stakes higher than ever, one player risks it all on a gamble.',
    'The truth behind the game begins to unravel as tensions boil over.',
    'Every move counts as the remaining players face their hardest test yet.',
    'Endings and beginnings collide in a finale that changes everything.',
  ][(epNum - 1) % 7]
  const goNext = () => next && router.replace(`/watch/${t.id}?ep=${encodeURIComponent(next.label)}`)

  // Up Next: the next episode, or after a film or finale, a suggestion. Paid-for titles only.
  const [pick] = useState(() => suggestAfter(t))
  const nextEp = eps ? next : undefined
  const up = nextEp
    ? { kicker: 'Next episode', title: `${nextEp.label} · ${nextEp.name}`, blurb: nextEp.blurb, art: nextEp.art, cta: 'Next Episode', go: goNext }
    : pick
      ? { kicker: 'You might like', title: pick.name, blurb: pick.blurb, art: pick.still, cta: `Play ${pick.kind === 'series' ? 'Series' : 'Film'}`, go: () => router.replace(`/watch/${pick.id}`) }
      : null
  const left = duration ? duration - time : Infinity
  const upNext = !!up && unlocked && !stayed && started && (ended || left <= upNextAt(duration))

  // Once it has finished: count down, then play what's next.
  const [count, setCount] = useState<number | null>(null)
  const counting = ended && !!up && unlocked && !stayed
  useEffect(() => setCount(counting ? COUNTDOWN_S : null), [counting])
  useEffect(() => {
    if (count === null) return
    if (count === 0) {
      up?.go()
      return
    }
    const tick = window.setTimeout(() => setCount(count - 1), 1000)
    return () => window.clearTimeout(tick)
    // up.go only changes with the title or episode, which remounts the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  /* --- Resume: save where you are every few seconds while you have access. Near the end the
     title counts as watched: a series moves on to the next episode, a film drops out. --- */
  const saveRef = useRef({ unlocked, ep, next: nextEp?.label })
  // Teasers don't count as watching.
  saveRef.current = { unlocked: unlocked && featureMode, ep, next: nextEp?.label }
  useEffect(() => {
    if (!ready) return
    const save = () => {
      const p = player.current
      const r = saveRef.current
      if (!p || !r.unlocked) return
      const cur = p.getCurrentTime()
      const d = p.getDuration?.() ?? 0
      if (!d || cur < 5) return
      if (cur >= d - upNextAt(d)) {
        if (r.next) saveProgress(t.id, { ep: r.next, t: 0, d: 0 })
        else clearProgress(t.id)
      } else saveProgress(t.id, { ep: r.ep ?? undefined, t: cur, d })
    }
    const id = window.setInterval(save, 3000)
    return () => {
      window.clearInterval(id)
      save()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // "Resumed from" chip: a few seconds, then out of the way.
  useEffect(() => {
    if (!resumed) return
    const t = window.setTimeout(() => setResumed(false), 7000)
    return () => window.clearTimeout(t)
  }, [resumed])

  /* --- Pass time: warn in the last 10 minutes; if it runs out mid-play, pause and offer more. --- */
  const [warnClosed, setWarnClosed] = useState(false)
  const [halted, setHalted] = useState(false)
  const passWarn = isPassAccess && accessMs !== null && isFinite(accessMs) && accessMs <= 10 * 6e4 && !warnClosed
  useEffect(() => {
    if (passExpired && started && !ended) {
      player.current?.pauseVideo()
      setHalted(true)
    }
  }, [passExpired, started, ended])

  return (
    <div ref={root} className={`vp${hide ? ' vp--idle' : ''}${hide && idle ? ' vp--rest' : ''}${!started && clip ? ' vp--loading' : ''}${panel ? ' vp--panel' : ''}${(ended || halted) && !unlocked ? ' vp--ended' : ''}`} onMouseMove={onHover} onClick={wake}>
      {/* Video, contained (letterboxed) rather than cropped. Rendered large and scaled down so
          YouTube's own overlays shrink with it. */}
      <div className={`vp__video${started ? ' is-on' : ''}`} aria-hidden>
        <div ref={mount} />
      </div>
      {!clip && <img className="vp__still" src={t.still} alt="" />}

      {/* Tap the picture to hide or show the controls; double-click for full screen. */}
      <button
        className="vp__surface"
        aria-label={hide ? 'Show controls' : 'Hide controls'}
        onClick={() => {
          if (hide) {
            setHidden(false)
            wake()
          } else setHidden(true)
        }}
        onDoubleClick={toggleFull}
        tabIndex={-1}
      />

      {/* Loading: title and episode top-left, spinner centre (until the first frame). */}
      {!started && clip && (
        <div className="vp__loading" role="status" aria-label={`Loading ${t.name}`}>
          <div className="vp__loading-title">
            <span>{t.name}</span>
            {featureMode && epLabel && <strong>{epLabel}</strong>}
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

      {ended && soon && <ComingSoon t={t} when={soon.when} onReplay={replay} />}

      {((ended && !soon && !unlocked) || (halted && !unlocked)) && (
        <div className="vp-access" role="dialog" aria-label={`Get access to ${t.name}`}>
          <img className="vp-access__bg" src={t.still} alt="" />
          <Access
            t={t}
            studio={studio}
            expired={passExpired}
            onReplay={replay}
            onPlay={(plan, r) => {
              if (plan) joinStudio(t.studioId, plan)
              else buyPass(t.id)
              setReceipt(r)
              setReveal(true)
              playUnlock()
            }}
          />
        </div>
      )}

      {reveal && <Reveal kind={revealKind} title={t.name} studio={studio?.name} onClosed={() => {}} onOpen={halted ? carryOn : replay} onDone={() => setReveal(false)} />}

      {receipt && !reveal && <ReceiptCard r={receipt} onClose={closeReceipt} />}

      {/* Pass running low: the last 10 minutes. */}
      {passWarn && accessMs !== null && (
        <div className="vp-passwarn" role="status">
          <span className="vp-passwarn__dot" aria-hidden />
          <span>
            Your pass ends in <strong>{clockLeft(accessMs)}</strong>
          </span>
          <button
            className="vp-passwarn__extend"
            onClick={() => {
              extendPass(t.id)
              toast('24 more hours added to your pass')
            }}
          >
            Extend 24h · {naira(t.passPrice)}
          </button>
          <button className="vp-passwarn__close" onClick={() => setWarnClosed(true)} aria-label="Dismiss">
            <Svg d={['M18 6 6 18', 'M6 6l12 12']} />
          </button>
        </div>
      )}

      {upNext && up && (
        <div className="upnext" role="dialog" aria-label={up.kicker}>
          <img className="upnext__art" src={up.art} alt="" />
          <div className="upnext__text">
            <span className="upnext__kicker">{count !== null ? `Playing in ${count}` : up.kicker}</span>
            <strong>{up.title}</strong>
            {up.blurb && <p>{up.blurb}</p>}
            <div className="upnext__actions">
              <button className={`btn-white btn-white--sm upnext__play${count !== null ? ' is-counting' : ''}`} onClick={up.go} style={{ ['--left' as string]: `${COUNTDOWN_S}s` }}>
                {count !== null && <i className="upnext__fill" aria-hidden />}
                <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden>
                  <path d="M5.75 3.78C5.42 3.58 5 3.82 5 4.21v11.58c0 .39.42.63.75.43l9.77-5.79a.5.5 0 0 0 0-.86L5.75 3.78Z" fill="currentColor" />
                </svg>
                {up.cta}
              </button>
              <button className="upnext__stay" onClick={() => setStayed(true)}>
                {ended ? 'Cancel' : 'Watch credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vp__bottom" ref={bottom}>
        {resumed && (
          <div className="vp__resumed" role="status">
            Resumed from {fmt(resumeAt)}
            <button
              onClick={() => {
                player.current?.seekTo?.(0, true)
                setResumed(false)
              }}
            >
              Start over
            </button>
          </div>
        )}
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
          {/* One line: series title, then season / episode and the episode's title. */}
          <div className="vp__title">
            <strong>{t.name}</strong>
            {epLabel && (
              <span>
                {epLabel} · {current.name}
              </span>
            )}
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
              <div className="vp__next">
                <button className="vp__icon" onClick={() => (next ? goNext() : toast('That’s the last episode'))} aria-label="Next episode">
                  <Svg d={['M6 4l10 8-10 8V4z', 'M19 5v14']} />
                </button>
                {next && (
                  <div className="vp__next-card" role="tooltip">
                    <span className="vp__next-kicker">Next Episode</span>
                    <div className="vp__next-body">
                      <img src={next.art} alt="" />
                      <div className="vp__next-text">
                        <strong>
                          {next.label} · {next.name}
                        </strong>
                        <span className="vp__next-mins">{next.mins} min</span>
                        <p>{next.blurb ?? nextBlurb}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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

        {series && (
          <div className="vp__tabs" role="tablist" aria-label="Episode details">
            {(['info', 'episodes'] as const).map((k) => (
              <button key={k} role="tab" aria-selected={panel === k} className={panel === k ? 'is-on' : ''} onClick={() => setPanel(panel === k ? null : k)}>
                {k === 'info' ? 'Info' : 'Episodes'}
              </button>
            ))}
          </div>
        )}

        {series && panel === 'info' && (
          <div className="vp__panel vp__info">
            <div className="vp__info-main">
              <span className="vp__info-eyebrow">
                Season 1 · Episode {current.n}
              </span>
              <h3 className="vp__info-title">{current.name}</h3>
              <p className="vp__info-blurb">{t.blurb}</p>
              <div className="vp__info-actions">
                <button
                  className="btn-white btn-white--sm"
                  onClick={() => {
                    player.current?.seekTo?.(0, true)
                    player.current?.playVideo()
                    setPanel(null)
                  }}
                >
                  <Svg d={['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5']} />
                  Start Over
                </button>
                <button className="btn-dark btn-dark--sm" onClick={() => setPanel('episodes')}>
                  All Episodes
                </button>
                <button
                  className={`vp__info-round${saved.has(t.id) ? ' is-on' : ''}`}
                  onClick={() => toast(savedToast(saved.toggle(t.id)))}
                  aria-pressed={saved.has(t.id)}
                  aria-label={saved.has(t.id) ? 'Saved for later' : 'Watch later'}
                  title={saved.has(t.id) ? 'Saved for later' : 'Watch later'}
                >
                  <Svg d={saved.has(t.id) ? ['M5 12.5l4.5 4.5L19 7.5'] : ['M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z']} />
                </button>
                <button className="vp__info-round" onClick={() => toast('Link copied')} aria-label="Share" title="Share">
                  <Svg d={['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13']} />
                </button>
              </div>
            </div>
            {studio && (
              <button className="vp__studio" onClick={() => router.push(`/studio/${studio.id}`)} aria-label={`Visit ${studio.name}`}>
                <img src={studio.logo} alt="" />
                <span className="vp__studio-text">
                  <span className="vp__studio-kicker">More from this studio</span>
                  <span className="vp__studio-name">{studio.name}</span>
                </span>
                <span className="vp__studio-go" aria-hidden>
                  <Svg d={['M5 12h14', 'M13 6l6 6-6 6']} />
                </span>
              </button>
            )}
          </div>
        )}

        {series && panel === 'episodes' && (
          <div className="vp__panel vp__episodes">
            {episodeList.map((e) => (
              <button
                key={e.n}
                className={`vp__ep${e.n === epNum ? ' is-current' : ''}`}
                onClick={() => {
                  setPanel(null)
                  router.replace(`/watch/${t.id}?ep=${encodeURIComponent(e.label)}`)
                }}
              >
                <span className="vp__ep-art">
                  <img src={e.art} alt="" loading="lazy" />
                  {e.n === epNum && (
                    <span className="vp__ep-now">
                      <svg className="vp__ep-play" viewBox="0 0 10 12" aria-hidden><path d="M1 1.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L1.9.7a.6.6 0 0 0-.9.5z" /></svg>
                      Now Playing
                    </span>
                  )}
                </span>
                <span className="vp__ep-label">{e.label}</span>
                <strong>{e.name}</strong>
                <span className="vp__ep-mins">{e.mins} min</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

function clockLeft(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`
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
