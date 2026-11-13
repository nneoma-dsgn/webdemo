'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { exploreEpisodes, exploreTitle } from '../data/explore'
import { ALWAYS, icons, films, upcoming, languagesFor, HICCUPS, roll, episodes, episodeThumb, featureFor, naira, studios, titles, trailers, type Title } from '../data/catalog'
import { accessLeft, setAudioLang, setQuality, setSubLang, type Quality, buyPass, extendPass, fakePassLeft, getProgress, joinStudio, saveProgress, clearProgress, startPass, useClock, useViewing } from '../data/viewing'
import { Access } from '../components/Access'
import { ComingSoon } from '../components/ComingSoon'
import { Reveal, type RevealKind } from '../components/Reveal'
import { playUnlock } from '../components/unlockSound'
import { loadApi, timeOf, type YTPlayer } from '../components/HeroVideo'
import { useMenu } from '../components/Menu'
import { savedToast, useSaved } from '../data/saved'
import { openMini } from '../data/mini'
import { isBlocked, isMuted, toggleBlocked, toggleMuted } from '../data/moderation'
import { Button, Text } from '../components/ui'
import { isPhone } from '../components/viewport'

/* Circo video player. Loading screen after Netflix (title top-left, spinner centre); controls
   after the Circo mobile player (glass skip/play circles, red scrubber) and Apple TV / Netflix web
   (episode + title bottom-left, tools bottom-right). Controls fade out while playing and idle.
   Plays the teaser, then the title once unlocked, from YouTube for the prototype; production
   streams Circo's own video. */

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
// No player after this long counts as a failed load.
const LOAD_TIMEOUT_MS = 15000
// Ready but still not playing after this long means autoplay was blocked.
const AUTOPLAY_GRACE_MS = 2500
// Slow connection: one stall this long, or this many stalls within a minute. Then quiet for a while.
const SLOW_STALL_MS = 4000
const SLOW_STALLS = 3
const SLOW_QUIET_MS = 5 * 60 * 1000

/* What to suggest after a film or a series finale: a random title with something to play,
   from the same genre when there is one. */
function suggestAfter(t: Title) {
  const pool = Object.values(titles).filter((x) => x.id !== t.id && trailers[x.id] && !upcoming(x.id))
  const near = pool.filter((x) => x.genre === t.genre || x.studioId === t.studioId)
  const from = near.length ? near : pool
  return from[Math.floor(Math.random() * from.length)]
}

function PlayerView() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const { open, toast } = useMenu()
  // Explore's shows (podcasts, masterclasses and the rest) play here too, bought the same way.
  const found = titles[params?.id ?? ''] ?? exploreTitle(params?.id ?? '')
  // An id we don't know is a missing page, never a stand-in title.
  if (!found) notFound()
  const t = found
  // Series with real episodes play each episode's own clip; everything else plays its trailer.
  const eps = episodes[t.id] ?? exploreEpisodes(t.id)
  // Where this title was left off (read once; the player remounts per title and episode).
  const [saved0] = useState(() => getProgress(t.id))
  const ep = search.get('ep') ?? saved0?.ep ?? null
  const epNo = Number(ep?.match(/(\d+)\s*$/)?.[1] ?? 1)
  const epClip = eps?.[epNo - 1] ?? eps?.[0]
  // Not out yet: the trailer ends on a reminder instead of access options.
  const soon = upcoming(t.id)
  const saved = useSaved()
  // Resume point for this exact episode: skip near-zero starts and finished ones.
  // Coming back from the mini player (?t=) starts exactly there; otherwise the saved resume point.
  const tParam = Number(search.get('t') ?? 0)
  const [resumeAt] = useState(() => (tParam > 0 ? Math.floor(tParam) : saved0 && (saved0.ep ?? null) === ep && saved0.t > 10 && (!saved0.d || saved0.t < saved0.d - 30) ? Math.floor(saved0.t) : 0))
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
  const [idle, setIdle] = useState(false)
  // Tapping the picture hides the controls; tapping again brings them back.
  const [hidden, setHidden] = useState(false)
  const [full, setFull] = useState(false)
  const [scrubbing, setScrubbing] = useState<number | null>(null)
  // Series only: Info / Episodes panel under the scrubber (Apple TV style).
  const [panel, setPanel] = useState<'info' | 'episodes' | null>(null)
  // Phones: the details under the picture start folded behind an Info pill.
  const [infoOpen, setInfoOpen] = useState(false)
  // Phones, series: the details have been scrolled into (the picture is riding up / pinned).
  const [browsing, setBrowsing] = useState(false)
  // The trailer has finished: offer a pass (public studio) or a subscription (private studio).
  const [ended, setEnded] = useState(false)
  // Paid in this session: the trailer plays through without asking again.
  // Access: a 24-hour pass for this title or a subscription to its studio.
  const viewing = useViewing()
  const now = useClock(1000)
  const accessMs = accessLeft(viewing, t, now)
  // Not out yet: nothing unlocks it, not even a studio subscription. Teaser, then the coming-soon card.
  const unlocked = !soon && accessMs !== null && accessMs > 0
  /* Teaser until you have access; then the title itself (an episode's own clip, or the film).
     Sticky for this visit, so a pass running out mid-film doesn't swap the video. */
  /* With access you get the title itself, never its trailer: an episode's clip, else the title's
     own clip, else a sample film (a title with no clip yet). Without access: the trailer. */
  const [featureMode, setFeatureMode] = useState(unlocked)
  useEffect(() => {
    if (unlocked) setFeatureMode(true)
  }, [unlocked])
  // An episode's own clip, else another real video of the title, else its trailer (the sample
  // films only cover titles with no video at all).
  const clip = featureMode
    ? { videoId: epClip?.videoId ?? films[t.id] ?? featureFor(t.id, epNo), start: 0, end: 0 }
    : // No trailer of its own (Explore's episodes): a 45-second teaser cut from the episode.
      (trailers[t.id] ?? (epClip ? { videoId: epClip.videoId, start: 30, end: 75 } : undefined))
  const isPassAccess = unlocked && !viewing.subs[t.studioId]
  const passExpired = accessMs === 0
  // Prototype: ?passLeft=5m (or 90s, 2h) fakes a pass that is about to run out.
  useEffect(() => {
    const m = search.get('passLeft')?.match(/^(\d+)(s|m|h)$/)
    if (m) fakePassLeft(t.id, Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5 }[m[2] as 's' | 'm' | 'h'])
    // Once per load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Paid during this visit: don't put the checkout straight back up when the trailer replays.
  const [paidHere, setPaidHere] = useState(false)
  // Just paid: the viewer has tapped, so the film never asks to be tapped again.
  const paidRef = useRef(false)
  // Viewer chose to watch the credits instead of moving on.
  const [stayed, setStayed] = useState(false)
  // Just paid: the reveal is running.
  const [reveal, setReveal] = useState(false)
  // While the unlock animation runs the film waits, paused, and starts when it's done.
  const revealing = useRef(false)
  const idleT = useRef(0)

  /* --- Load failure: YouTube reports an error, or nothing is ready after 15s. Retry rebuilds
     the player. Prototype: ?fail=load (YouTube error) or ?fail=timeout (never loads), first try only. --- */
  const [failed, setFailed] = useState<null | 'error' | 'gone'>(null)
  const [attempt, setAttempt] = useState(0)
  // Rolled once per visit: a URL flag, or now and then a natural failure.
  // ?hiccups=off turns the random ones off (for clean testing).
  const calm = search.get('hiccups') === 'off'
  const [simulateFail] = useState(() => search.get('fail') ?? ALWAYS[t.id]?.load ?? (!calm && roll(HICCUPS.loadFail) ? (roll(0.5) ? 'load' : 'timeout') : null))
  // Autoplay blocked: the player is ready but the browser won't start it without a tap.
  const [blocked, setBlocked] = useState(false)
  const [noAutoplay] = useState(() => search.get('autoplay') === 'off' || !!ALWAYS[t.id]?.autoplay || (!calm && roll(HICCUPS.autoplayBlocked)))

  /* --- YouTube player --- */
  useEffect(() => {
    if (!clip) return
    let cancelled = false
    let isReady = false
    let didPlay = false
    let blockT = 0
    setFailed(null)
    setBlocked(false)
    const giveUp = window.setTimeout(() => {
      if (!isReady && !cancelled) setFailed('error')
    }, LOAD_TIMEOUT_MS)
    const sim = attempt === 0 ? simulateFail : null
    // YouTube replaces the element it's given with its iframe, so each video gets a fresh host
    // inside the stable container. Reusing one breaks when the teaser swaps to the film.
    const container = mount.current
    const host = document.createElement('div')
    container?.appendChild(host)
    setReady(false)
    setStarted(false)
    loadApi().then(() => {
      if (cancelled || !host.isConnected || !window.YT || sim === 'timeout') return
      const YT = window.YT
      player.current = new YT.Player(host, {
        videoId: sim === 'load' ? 'xxxxxxxxxxx' : clip.videoId,
        playerVars: { autoplay: noAutoplay && !paidRef.current ? 0 : 1, start: featureMode || tParam > 0 ? resumeAt : 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: () => {
            isReady = true
            setReady(true)
            player.current?.setVolume?.(80)
            // Ready but not playing a moment later: the browser blocked autoplay.
            blockT = window.setTimeout(() => {
              // Held paused for the unlock animation, or just paid for: not a blocked autoplay.
              if (revealing.current || paidRef.current) return
              if (!didPlay && !cancelled) setBlocked(true)
            }, AUTOPLAY_GRACE_MS)
          },
          // 100: removed or private; 101 / 150: the owner blocks embedding. Others: bad request or playback.
          onError: (e: { data: number }) => {
            if (cancelled) return
            window.clearTimeout(giveUp)
            setFailed(e.data === 100 || e.data === 101 || e.data === 150 ? 'gone' : 'error')
          },
          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === YT.PlayerState.PLAYING)
            setBuffering(e.data === YT.PlayerState.BUFFERING)
            if (e.data === YT.PlayerState.ENDED) {
              setEnded(true)
              if (document.fullscreenElement) document.exitFullscreen?.()
            }
            if (e.data === YT.PlayerState.PLAYING && revealing.current) {
              player.current?.pauseVideo?.()
              return
            }
            if (e.data === YT.PlayerState.PLAYING) {
              didPlay = true
              setBlocked(false)
              // A pass's 24 hours start on first play.
              startPass(t.id)
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
      window.clearTimeout(giveUp)
      window.clearTimeout(blockT)
      player.current?.destroy?.()
      player.current = null
      if (container) container.innerHTML = ''
    }
    // Only a new video (or a retry) should rebuild the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.videoId, attempt])

  // Clock for the scrubber.
  useEffect(() => {
    if (!ready) return
    const tick = window.setInterval(() => {
      const p = player.current
      if (!p) return
      const now = timeOf(p)
      if (now === null) return
      setTime(now)
      const d = p.getDuration?.() ?? 0
      if (d) setDuration(d)
    }, 250)
    return () => window.clearInterval(tick)
  }, [ready])

  /* --- Controls --- */
  const toggle = useCallback(() => {
    const p = player.current
    if (!p || !ready) return
    if (playing) p.pauseVideo?.()
    else p.playVideo?.()
  }, [playing, ready])

  const seekBy = useCallback(
    (d: number) => {
      const p = player.current
      if (!p || !ready) return
      const next = Math.min(Math.max(0, (timeOf(p) ?? 0) + d), duration || Infinity)
      p.seekTo?.(next, true)
      setTime(next)
    },
    [duration, ready],
  )

  const toggleMute = useCallback(() => {
    const p = player.current
    if (!p || !ready) return
    if (muted) p.unMute?.()
    else p.mute?.()
    setMuted(!muted)
  }, [muted, ready])

  const changeVolume = (v: number) => {
    const p = player.current
    setVolume(v)
    p?.setVolume?.(v)
    if (v === 0 && !muted) {
      p?.mute?.()
      setMuted(true)
    } else if (v > 0 && muted) {
      p?.unMute?.()
      setMuted(false)
    }
  }

  /* Full screen, and on a phone held upright, landscape too. Where the browser can (Android,
     desktop) it's real full screen plus an orientation lock. iPhone Safari can't put a page
     element in full screen or lock rotation, so there the player turns itself sideways on
     screen instead ("rotated"), until it's tapped again or the phone is actually turned. */
  const [rotated, setRotated] = useState(false)
  const toggleFull = useCallback(() => {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void }
    if (document.fullscreenElement) {
      orientation.unlock?.()
      document.exitFullscreen()
      return
    }
    const upright = isPhone() && window.matchMedia('(orientation: portrait)').matches
    if (document.fullscreenEnabled && root.current?.requestFullscreen) {
      root.current
        .requestFullscreen()
        .then(() => (upright ? orientation.lock?.('landscape') : undefined))
        .catch(() => {})
      return
    }
    if (upright || rotated) setRotated((r) => !r)
  }, [rotated])

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  // Menus open outside the player; while it's turned they turn with it (see .dd--sheet).
  useEffect(() => {
    document.body.classList.toggle('vp-rotated', rotated)
    return () => document.body.classList.remove('vp-rotated')
  }, [rotated])

  // Turning the phone for real hands over to the actual landscape layout.
  useEffect(() => {
    if (!rotated) return
    const mq = window.matchMedia('(orientation: landscape)')
    const on = () => mq.matches && setRotated(false)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [rotated])

  // Picture-in-picture: hand the video to the floating mini player and go back to browsing.
  const toMini = () => {
    if (!clip) return
    if (document.fullscreenElement) document.exitFullscreen()
    openMini({
      id: t.id,
      ep: ep ?? undefined,
      videoId: clip.videoId,
      t: timeOf(player.current) ?? resumeAt,
      title: t.name,
      sub: series && epLabel ? `${epLabel} · ${current.name}` : !featureMode ? 'Teaser' : undefined,
    })
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

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
  /* Quality: Auto, or a fixed 1080p / 720p / 480p (Data saver). Saved in the browser.
     Prototype note: YouTube embeds no longer accept a forced quality, so this records the
     choice; Circo's own streams would switch rendition. */
  const quality = viewing.quality
  // Short labels only; the one hint that matters is Data saver.
  const QUALITIES: { q: Quality; label: string; hint?: string }[] = [
    { q: 'auto', label: 'Auto', hint: 'Adjusts to your connection' },
    { q: '1080', label: '1080p', hint: 'HD' },
    { q: '720', label: '720p', hint: 'HD' },
    { q: '480', label: '480p', hint: 'Data saver' },
  ]
  const qualityMenu = (el: HTMLElement) =>
    open(el, {
      label: 'Quality',
      header: <span className="dd__title">Quality</span>,
      items: QUALITIES.map((o) => ({
        id: `q${o.q}`,
        label: o.label,
        hint: o.hint,
        icon: o.q === quality ? 'check' : undefined,
        onSelect: () => {
          setQuality(o.q)
          toast(o.q === 'auto' ? 'Quality set to Auto' : `Quality set to ${o.label}${o.q === '480' ? ' · Data saver' : ''}`)
        },
      })),
    })

  /* --- Audio & subtitles: the title's languages; your choice is remembered and applied to any
     title that offers it. English subtitles really play when the YouTube video has captions;
     other languages and dubs need Circo's own streams, so they're recorded for now. --- */
  const langs = languagesFor(t)
  const audioSel = viewing.audioLang && langs.audio.includes(viewing.audioLang) ? viewing.audioLang : langs.original
  const subSel = viewing.subLang && langs.subtitles.includes(viewing.subLang) ? viewing.subLang : null
  const [langOpen, setLangOpen] = useState(false)
  const langPanel = useRef<HTMLDivElement>(null)
  const langBtn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const p = player.current
    if (!ready || !p) return
    if (subSel === 'English') {
      p.loadModule?.('captions')
      p.setOption?.('captions', 'track', { languageCode: 'en' })
    } else p.unloadModule?.('captions')
  }, [ready, subSel])
  // Close on Escape or a click anywhere else.
  useEffect(() => {
    if (!langOpen) return
    const down = (e: PointerEvent) => {
      const n = e.target as Node
      if (!langPanel.current?.contains(n) && !langBtn.current?.contains(n)) setLangOpen(false)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setLangOpen(false)
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [langOpen])
  const pickAudio = (l: string) => {
    setAudioLang(l === langs.original ? null : l)
    if (l !== langs.original) toast(`${l} audio will play with Circo’s own streams`)
  }
  const pickSub = (l: string | null) => {
    setSubLang(l)
    if (l && l !== 'English') toast(`${l} subtitles will play with Circo’s own streams`)
  }

  // One settings menu for the less-used controls; each row opens its own list in the same spot.
  // Phones have no audio & subtitles panel, so Audio and Subtitles join Quality and Speed here.
  const settingsMenu = (el: HTMLElement) => {
    const phone = isPhone()
    open(el, {
      label: 'Settings',
      header: <span className="dd__title">Settings</span>,
      items: [
        { id: 'quality', label: 'Quality', hint: QUALITIES.find((o) => o.q === quality)?.label, chevron: true, onSelect: () => window.setTimeout(() => qualityMenu(el), 0) },
        { id: 'speed', label: 'Playback speed', hint: speed === 1 ? 'Normal' : `${speed}×`, chevron: true, onSelect: () => window.setTimeout(() => speedMenu(el), 0) },
        ...(phone
          ? [
              { id: 'audio', label: 'Audio', hint: audioSel, chevron: true, onSelect: () => window.setTimeout(() => audioMenu(el), 0) },
              { id: 'subs', label: 'Subtitles', hint: subSel ?? 'Off', chevron: true, onSelect: () => window.setTimeout(() => subsMenu(el), 0) },
            ]
          : []),
      ],
    })
  }

  const audioMenu = (el: HTMLElement) =>
    open(el, {
      label: 'Audio',
      header: <span className="dd__title">Audio</span>,
      items: langs.audio.map((l) => ({ id: `a-${l}`, label: l, hint: l === langs.original ? 'Original' : undefined, icon: l === audioSel ? ('check' as const) : undefined, onSelect: () => pickAudio(l) })),
    })

  const subsMenu = (el: HTMLElement) =>
    open(el, {
      label: 'Subtitles',
      header: <span className="dd__title">Subtitles</span>,
      items: [
        { id: 'sub-off', label: 'Off', icon: subSel === null ? ('check' as const) : undefined, onSelect: () => pickSub(null) },
        ...langs.subtitles.map((l) => ({ id: `sub-${l}`, label: l, icon: l === subSel ? ('check' as const) : undefined, onSelect: () => pickSub(l) })),
      ],
    })

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

  const moreMenu = (el: HTMLElement) =>
    open(el, {
      label: `${t.name} options`,
      header: <span className="dd__title">{t.name}</span>,
      items: [
        saved.has(t.id)
          ? { id: 'later', label: 'Saved for later', icon: 'check', onSelect: () => toast(savedToast(saved.toggle(t.id))) }
          : { id: 'later', label: 'Watch later', icon: 'bookmark', onSelect: () => toast(savedToast(saved.toggle(t.id))) },
        { id: 'share', label: 'Share', icon: 'share', onSelect: () => toast('Link copied') },
        isMuted(t.studioId)
          ? { id: 'mute', label: 'Unmute studio', icon: 'mute', onSelect: () => (toggleMuted(t.studioId), toast(`${studios[t.studioId]?.name ?? 'Studio'} unmuted`)) }
          : { id: 'mute', label: 'Mute', icon: 'mute', onSelect: () => (toggleMuted(t.studioId), toast(`You’ll see less from ${studios[t.studioId]?.name ?? 'this studio'}`)) },
        { kind: 'separator', id: 's' },
        isBlocked(t.studioId)
          ? { id: 'block', label: 'Unblock studio', icon: 'block', danger: true, onSelect: () => (toggleBlocked(t.studioId), toast(`${studios[t.studioId]?.name ?? 'Studio'} unblocked`)) }
          : { id: 'block', label: 'Block', icon: 'block', danger: true, onSelect: () => (toggleBlocked(t.studioId), toast(`${studios[t.studioId]?.name ?? 'This studio'} is blocked`)) },
      ],
    })

  const replay = () => {
    setEnded(false)
    player.current?.seekTo?.(0, true)
    player.current?.playVideo?.()
  }
  // After renewing a pass that ran out mid-film: carry on from the same spot.
  const carryOn = () => {
    setHalted(false)
    player.current?.playVideo?.()
  }

  const shown = scrubbing ?? time
  const pct = duration ? (shown / duration) * 100 : 0
  // Tapping the picture hides the controls; tapping again brings them back.
  const tapPicture = () => {
    if (hide) {
      setHidden(false)
      wake()
    } else setHidden(true)
  }

  /* Phones, series: the details scroll from anywhere on the screen. The picture rides up with
     them (--shift, a transform, updated once a frame) until it pins to the top. */
  const scrollFrame = useRef(0)
  const onDetailsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    cancelAnimationFrame(scrollFrame.current)
    scrollFrame.current = requestAnimationFrame(() => {
      const r = root.current
      if (!r) return
      const centred = (r.clientHeight - r.clientWidth * PHONE_PICTURE_RATIO) / 2
      r.style.setProperty('--shift', `${-Math.min(el.scrollTop, Math.max(0, centred))}px`)
      setBrowsing(el.scrollTop > 4)
      wake()
    })
  }
  // Over the picture, a tap is a tap on the picture (not on whatever has scrolled behind it).
  const onDetailsTap = (e: React.MouseEvent) => {
    const v = root.current?.querySelector('.vp__video')?.getBoundingClientRect()
    if (!v || e.clientY > v.bottom) return
    e.preventDefault()
    e.stopPropagation()
    tapPicture()
  }

  // A series' details, once scrolled into, stay up until the picture is tapped (no idle fade).
  const hide = (hidden || (idle && playing && started && !browsing)) && scrubbing === null && !panel && !langOpen

  // Hiding everything sends the picture back to the middle (CSS); ease that move, and the
  // return, without slowing the picture down while it follows a scroll.
  const [settling, setSettling] = useState(false)
  useEffect(() => {
    setSettling(true)
    const t = window.setTimeout(() => setSettling(false), 400)
    return () => window.clearTimeout(t)
  }, [hide])
  // Coming soon is only ever a trailer: no episodes, no Info, no next episode, no Up Next.
  const series = t.kind === 'series' && !soon
  const studio = studios[t.studioId]
  const epLabel = ep ?? (series ? 'S1 · E1' : null)
  // Current episode number from labels like "S1 · E4" or "EP 2".
  const epNum = Number(epLabel?.match(/(\d+)\s*$/)?.[1] ?? 1)
  const epPrefix = epLabel?.includes('S') && epLabel.includes('E') ? epLabel.replace(/E\s*\d+\s*$/, 'E') : 'EP '
  const episodeList = eps
    ? eps.map((e, i) => ({ n: i + 1, label: `${epPrefix}${i + 1}`, name: e.title, mins: e.mins, blurb: e.blurb as string | undefined, art: episodeThumb(e.videoId), season: ('season' in e && e.season) || 1 }))
    : Array.from({ length: 8 }, (_, i) => ({ n: i + 1, label: `${epPrefix}${i + 1}`, name: i === 0 ? 'Pilot' : `Chapter ${i + 1}`, mins: 42 + ((i * 7) % 12), blurb: undefined as string | undefined, art: t.still, season: 1 }))
  const current = episodeList[epNum - 1] ?? episodeList[0]
  // Seasons: the phone episode row shows one at a time, picked from a Season dropdown when
  // there's more than one (otherwise it's just headed Episodes).
  const seasons = Array.from(new Set(episodeList.map((e) => e.season))).sort((a, b) => a - b)
  const [season, setSeason] = useState<number | null>(null)
  const shownSeason = season ?? current.season
  const seasonMenu = (el: HTMLElement) =>
    open(el, {
      label: 'Season',
      items: seasons.map((n) => ({ id: `season-${n}`, label: `Season ${n}`, icon: n === shownSeason ? ('check' as const) : undefined, onSelect: () => setSeason(n) })),
    })
  // One meta line for the Info panel (desktop) and the details under the picture (phones).
  const infoMeta = series ? `Season ${current.season} · Episode ${current.n} · ${current.mins} min` : `${t.year} · ${t.genre}`
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
  // Only once a film or episode has actually finished; trailers end on the access screen.
  const upNext = !!up && unlocked && featureMode && !stayed && started && ended

  // Once it has finished: count down, then play what's next.
  const [count, setCount] = useState<number | null>(null)
  const counting = ended && !!up && unlocked && featureMode && !stayed
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
      const cur = timeOf(p)
      if (cur === null) return
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


  /* --- Slow connection: long or repeated buffering after playback has started. --- */
  const [slow, setSlow] = useState(false)
  const [fakeStall, setFakeStall] = useState(false)
  const stalls = useRef<number[]>([])
  const lastSlow = useRef(0)
  const stalled = (started && buffering) || fakeStall
  useEffect(() => {
    if (!stalled) return
    const now = Date.now()
    stalls.current = [...stalls.current.filter((x) => now - x < 60000), now]
    const flag = () => {
      if (Date.now() - lastSlow.current < SLOW_QUIET_MS) return
      lastSlow.current = Date.now()
      setSlow(true)
    }
    if (stalls.current.length >= SLOW_STALLS) flag()
    const long = window.setTimeout(flag, SLOW_STALL_MS)
    return () => window.clearTimeout(long)
  }, [stalled])

  useEffect(() => {
    if (!slow) return
    const t = window.setTimeout(() => setSlow(false), 6000)
    return () => window.clearTimeout(t)
  }, [slow])

  // Prototype: now and then (or with ?slow=1) a 7s stall about 8s in, once per visit.
  const [slowDemo] = useState(() => search.get('slow') === '1' || !!ALWAYS[t.id]?.slow || (!calm && roll(HICCUPS.slow)))
  const stallDone = useRef(false)
  const stallT = useRef(0)
  useEffect(() => () => window.clearTimeout(stallT.current), [])
  useEffect(() => {
    if (!slowDemo || stallDone.current || !playing || time < 8) return
    stallDone.current = true
    player.current?.pauseVideo?.()
    setFakeStall(true)
    // Kept in a ref: pausing re-runs this effect and must not cancel the resume.
    stallT.current = window.setTimeout(() => {
      setFakeStall(false)
      player.current?.playVideo?.()
    }, 7000)
  }, [slowDemo, playing, time])

  /* --- Pass time: warn in the last 10 minutes; if it runs out mid-play, pause and offer more. --- */
  const [warnClosed, setWarnClosed] = useState(false)
  const [halted, setHalted] = useState(false)
  const passWarn = isPassAccess && accessMs !== null && isFinite(accessMs) && accessMs <= 10 * 6e4 && !warnClosed
  useEffect(() => {
    if (passExpired && started && !ended) {
      player.current?.pauseVideo?.()
      setHalted(true)
    }
  }, [passExpired, started, ended])

  return (
    <div ref={root} className={`vp${series ? ' vp--series' : ''}${settling ? ' vp--settling' : ''}${rotated ? ' vp--rotated' : ''}${hide ? ' vp--idle' : ''}${hide && idle ? ' vp--rest' : ''}${!started && clip ? ' vp--loading' : ''}${panel ? ' vp--panel' : ''}${(ended && (soon || (!featureMode && !paidHere))) || (halted && !unlocked) ? ' vp--ended' : ''}`} onMouseMove={onHover} onClick={wake}>
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
        onClick={tapPicture}
        onDoubleClick={toggleFull}
        tabIndex={-1}
      />

      {/* Phones: what's playing under the picture (title, blurb, studio) and, for a series, the
          episodes to swipe through. Stays put while the controls fade. */}
      {clip && !failed && !(ended && soon) && (
        <div
          className="vp-details"
          onScroll={series ? onDetailsScroll : undefined}
          onClickCapture={series ? onDetailsTap : undefined}
        >
          {series && <div className="vp-details__spacer" aria-hidden />}
          <div className="vp-details__inner">
            {/* Title with the same Info pill as desktop; Info opens the meta line, blurb and studio.
                For a series it stays put under the pinned picture while the rest scrolls. */}
            <div className="vp-details__head">
              <Text variant="h3" as="h2" className="vp-details__title">
                {series ? `${t.name} - ${current.name}` : t.name}
              </Text>
              <div className="vp__tabs vp__tabs--inline">
                <button aria-expanded={infoOpen} className={infoOpen ? 'is-on' : ''} onClick={() => setInfoOpen((o) => !o)}>
                  {infoOpen ? 'Hide' : 'Info'}
                </button>
              </div>
            </div>
            {infoOpen && (
              <div className="vp-details__info">
                <Text variant="body-sm" tone="muted" className="vp-details__meta">
                  {infoMeta}
                </Text>
                <Text variant="body-sm" tone="secondary" className="vp-details__blurb">
                  {(series && current.blurb) || t.blurb}
                </Text>
              </div>
            )}
            {studio && infoOpen && (
              <div className="vp-details__studio">
                <span className="vp-details__who">
                  <img src={studio.logo} alt="" width={40} height={40} />
                  <strong>{studio.name}</strong>
                </span>
                <Button size="sm" onClick={() => router.push(`/studio/${studio.id}`)}>
                  See More
                </Button>
              </div>
            )}
            {series && (
              <section className="vp-details__eps" aria-label="Episodes">
                {seasons.length > 1 ? (
                  <button className="vp-details__season" aria-haspopup="menu" onClick={(e) => seasonMenu(e.currentTarget)}>
                    Season {shownSeason}
                    <Svg d={['m6 9 6 6 6-6']} />
                  </button>
                ) : (
                  <Text variant="body" as="h3" className="vp-details__eps-title">
                    Episodes
                  </Text>
                )}
                <div className="vp-details__eps-row">
                  {episodeList.filter((e) => e.season === shownSeason).map((e) => (
                    <button
                      key={e.n}
                      className="vp-details__ep"
                      aria-current={e.n === epNum ? 'true' : undefined}
                      onClick={() => router.replace(`/watch/${t.id}?ep=${encodeURIComponent(e.label)}`)}
                    >
                      <img src={t.poster} alt="" loading="lazy" />
                      <Text variant="caption" tone="muted" as="span" className="vp-details__ep-n">
                        Episode {e.n}
                      </Text>
                      <strong>
                        {e.n}. {e.name}
                      </strong>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* Loading: title and episode top-left, spinner centre (until the first frame). */}
      {!started && clip && !failed && (
        <div className="vp__loading" role="status" aria-label={blocked ? `${t.name} is ready to play` : `Loading ${t.name}`}>
          <div className="vp__loading-title">
            <span>{t.name}</span>
            {featureMode && epLabel && <strong>{epLabel}</strong>}
          </div>
          {blocked ? (
            <button
              className="vp-tapplay"
              onClick={() => {
                player.current?.playVideo?.()
                setBlocked(false)
              }}
              aria-label={`Play ${t.name}`}
            >
              <svg width="40" height="40" viewBox="0 0 20 20" aria-hidden>
                <path d="M5.75 3.78C5.42 3.58 5 3.82 5 4.21v11.58c0 .39.42.63.75.43l9.77-5.79a.5.5 0 0 0 0-.86L5.75 3.78Z" fill="currentColor" />
              </svg>
            </button>
          ) : (
            <span className="spin-grad" aria-hidden />
          )}
        </div>
      )}
      {((started && buffering) || fakeStall) && <span className="spin-grad vp__buffer" aria-label="Buffering" />}

      {failed && (
        <div className="vp-fail" role="alert">
          <span className="vp-fail__icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <strong>Something went wrong</strong>
          <Text variant="body" tone="secondary" className="vp-fail__text">
            {failed === 'gone'
              ? `${t.name} isn’t available to play right now. We’re looking into it.`
              : 'We couldn’t load this video. Check your connection and try again.'}
          </Text>
          <div className="vp-fail__actions">
            <Button size="sm" icon={<Svg d={['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5']} />} onClick={() => setAttempt((a) => a + 1)}>
              Retry
            </Button>
            <Button variant="secondary" size="sm" onClick={exit}>
              Go back
            </Button>
          </div>
        </div>
      )}

      {!clip && (
        <div className="vp__unavailable">
          <strong>Preview unavailable</strong>
          <span>There’s no teaser for {t.name} in this prototype yet.</span>
        </div>
      )}

      {/* --- Chrome --- */}
      <div className="vp__top">
        <button className="vp__icon" onClick={exit} aria-label="Back">
          <span className="vp-desk">
            <Svg d={['M19 12H5', 'm12 19-7-7 7-7']} />
          </span>
          <img className="vp-phone" src={icons.chevronLeft} alt="" width={24} height={24} />
        </button>
        <div className="vp__top-right">
          {/* Not on phones: there's no room for a floating window on a small screen. */}
          <button className="vp__icon vp__pip" onClick={toMini} aria-label="Picture in picture" title="Picture in picture">
            <Svg d={['M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5', 'M14 14h7v6h-7z']} />
          </button>
          <button className="vp__icon" onClick={() => toast('Looking for devices nearby')} aria-label="Cast to device">
            <span className="vp-desk">
              <Svg d={['M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6', 'M2 12a9 9 0 0 1 8 8', 'M2 16a5 5 0 0 1 4 4', 'M2 20h.01']} />
            </span>
            <img className="vp-phone" src={icons.cast} alt="" width={24} height={24} />
          </button>
          <button className="vp__icon" onClick={(e) => moreMenu(e.currentTarget)} aria-label="More options">
            <svg className="vp-desk" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
            <img className="vp-phone" src={icons.morePlayer} alt="" width={24} height={24} />
          </button>
        </div>
      </div>

      {started && (
        <div className="vp__center">
          <button className="vp__skip" onClick={() => seekBy(-10)} aria-label="Back 10 seconds">
            <span className="vp-desk">
              <SkipIcon dir={-1} />
            </span>
            <img className="vp-phone" src={icons.rotateCcw} alt="" width={32} height={32} />
          </button>
          <button className="vp__play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing && <img className="vp-phone" src={icons.pause} alt="" width={24} height={32} />}
            {playing ? (
              <svg className="vp-desk" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
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
            <span className="vp-desk">
              <SkipIcon dir={1} />
            </span>
            <img className="vp-phone" src={icons.rotateCw} alt="" width={32} height={32} />
          </button>
        </div>
      )}

      {ended && soon && <ComingSoon t={t} when={soon.when} onReplay={replay} />}
      {/* Same close as the access screen, pinned top right. */}
      {ended && soon && (
        <div className="vp-access__top">
          <button className="vp-access__close" onClick={exit} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* A trailer always ends on the access tickets. */}
      {((ended && !soon && !featureMode && !paidHere) || (halted && !unlocked)) && (
        <div className="vp-access" role="dialog" aria-label={`Get access to ${t.name}`}>
          <img className="vp-access__bg" src={t.still} alt="" />
          <Access
            t={t}
            studio={studio}
            expired={passExpired}
            onPlay={(plan) => {
              if (plan) joinStudio(t.studioId, plan)
              else buyPass(t.id)
              setPaidHere(true)
              paidRef.current = true
              setBlocked(false)
              revealing.current = true
              player.current?.pauseVideo?.()
              setReveal(true)
              playUnlock()
            }}
          />
        </div>
      )}

      {/* Replay and close stay pinned top right over the checkout, however tall it gets. */}
      {((ended && !soon && !featureMode && !paidHere) || (halted && !unlocked)) && !reveal && (
        <div className="vp-access__top">
          <Button variant="secondary" size="sm" icon={<Svg d={['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5']} />} onClick={replay}>
            Replay Teaser
          </Button>
          <button className="vp-access__close" onClick={exit} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {reveal && (
        <Reveal
          kind={revealKind}
          title={t.name}
          studio={studio?.name}
          onClosed={() => {}}
          onOpen={() => {}}
          onDone={() => {
            revealing.current = false
            setReveal(false)
            if (halted) carryOn()
            else replay()
          }}
        />
      )}

      {/* Pass running low: the last 10 minutes. */}
      {passWarn && accessMs !== null && (
        <div className="vp-passwarn" role="status">
          <span className="vp-passwarn__dot" aria-hidden />
          <span>
            Your pass ends in <strong>{clockLeft(accessMs)}</strong>
          </span>
          <Button
            size="sm"
            onClick={() => {
              extendPass(t.id)
              toast('24 more hours added to your pass')
            }}
          >
            Extend 24h · {naira(t.passPrice)}
          </Button>
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
              <Button size="sm" className={`upnext__play${count !== null ? ' is-counting' : ''}`} onClick={up.go} style={{ ['--left' as string]: `${COUNTDOWN_S}s` }}>
                {count !== null && <i className="upnext__fill" aria-hidden />}
                <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden>
                  <path d="M5.75 3.78C5.42 3.58 5 3.82 5 4.21v11.58c0 .39.42.63.75.43l9.77-5.79a.5.5 0 0 0 0-.86L5.75 3.78Z" fill="currentColor" />
                </svg>
                {up.cta}
              </Button>
              <Button variant="secondary" size="sm" className="upnext__stay" onClick={() => setStayed(true)}>
                {ended ? 'Cancel' : 'Watch credits'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast-style, from the top; clears itself. */}
      {slow && (
        <div className="vp-slow" role="status">
          <Svg d={['M5 12.55a11 11 0 0 1 14.08 0', 'M1.42 9a16 16 0 0 1 21.16 0', 'M8.53 16.11a6 6 0 0 1 6.95 0', 'M12 20h.01']} />
          <strong>Internet connection unstable</strong>
        </div>
      )}

      {langOpen && (
        <div ref={langPanel} className="langs" role="dialog" aria-label="Audio and subtitles">
          <div className="langs__col">
            <span className="langs__head">Audio</span>
            {langs.audio.map((l) => (
              <button key={l} className={`langs__opt${l === audioSel ? ' is-on' : ''}`} onClick={() => pickAudio(l)} aria-pressed={l === audioSel}>
                {l}
                {l === langs.original && <small>Original</small>}
              </button>
            ))}
          </div>
          <div className="langs__col">
            <span className="langs__head">Subtitles</span>
            <button className={`langs__opt${!subSel ? ' is-on' : ''}`} onClick={() => pickSub(null)} aria-pressed={!subSel}>
              Off
            </button>
            {langs.subtitles.map((l) => (
              <button key={l} className={`langs__opt${l === subSel ? ' is-on' : ''}`} onClick={() => pickSub(l)} aria-pressed={l === subSel}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="vp__bottom" ref={bottom}>
        {/* Phones: elapsed / total, then settings (Quality, Speed, Audio, Subtitles) and full
            screen, along the bottom edge of the picture. */}
        <div className="vp__edge vp-phone">
          <span>
            {fmt(shown)} / {fmt(duration)}
          </span>
          <span className="vp__edge-tools">
            <button onClick={(e) => settingsMenu(e.currentTarget)} aria-label="Settings">
              <Svg d={SETTINGS_ICON} />
            </button>
            {/* Expand (corners out) and collapse (corners in), drawn so they share settings' weight. */}
            <button onClick={toggleFull} aria-label={full || rotated ? 'Exit full screen' : 'Full screen'}>
              <Svg d={full || rotated ? COLLAPSE_ICON : EXPAND_ICON} />
            </button>
          </span>
        </div>
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
            {clip && !series && !soon && (
              <div className="vp__tabs vp__tabs--inline">
                <button aria-expanded={panel === 'info'} className={panel === 'info' ? 'is-on' : ''} onClick={() => setPanel(panel === 'info' ? null : 'info')}>
                  {panel === 'info' ? 'Hide' : 'Info'}
                </button>
              </div>
            )}
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
            <button ref={langBtn} className={`vp__icon${subSel ? ' is-on' : ''}`} onClick={() => setLangOpen((o) => !o)} aria-label="Audio and subtitles" aria-expanded={langOpen} title="Audio & subtitles">
              <Svg d={['M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'M7 13h3', 'M13 13h4', 'M7 16h8']} />
            </button>
            <button className="vp__icon" onClick={(e) => settingsMenu(e.currentTarget)} aria-label="Settings" title="Settings">
              <Svg d={SETTINGS_ICON} />
            </button>
            <button className="vp__icon" onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'} title="Full screen">
              <Svg d={full ? COLLAPSE_ICON : EXPAND_ICON} />
            </button>
          </div>
        </div>

        {/* Series: Info and Episodes on their own row. Shows have just Info, next to the title. */}
        {clip && series && (
          <div className="vp__tabs" role="tablist" aria-label="Episode details">
            {(['info', 'episodes'] as const).map((k) => (
              <button key={k} role="tab" aria-selected={panel === k} className={panel === k ? 'is-on' : ''} onClick={() => setPanel(panel === k ? null : k)}>
                {k === 'info' ? (panel === 'info' ? 'Hide' : 'Info') : 'Episodes'}
              </button>
            ))}
          </div>
        )}

        {panel === 'info' && (
          <div className="vp__panel vp__info">
            <div className="vp__info-main">
              <span className="vp__info-eyebrow">{infoMeta}</span>
              <h3 className="vp__info-title">{series ? current.name : t.name}</h3>
              <p className="vp__info-blurb">{(series && current.blurb) || t.blurb}</p>
              <div className="vp__info-actions">
                <Button
                  size="sm"
                  icon={<Svg d={['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5']} />}
                  onClick={() => {
                    player.current?.seekTo?.(0, true)
                    player.current?.playVideo?.()
                    setPanel(null)
                  }}
                >
                  Start Over
                </Button>
                {series && (
                  <Button variant="secondary" size="sm" onClick={() => setPanel('episodes')}>
                    All Episodes
                  </Button>
                )}
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
                <span className="vp__studio-name">{studio.name}</span>
                <Svg d={['M9 6l6 6-6 6']} />
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

/* The phone picture's height for its width: the mobile design's 430 x 286 frame (the CSS
   --vp-h is the same ratio). */
const PHONE_PICTURE_RATIO = 286 / 430

const EXPAND_ICON = ['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3']
const COLLAPSE_ICON = ['M8 3v3a2 2 0 0 1-2 2H3', 'M21 8h-3a2 2 0 0 1-2-2V3', 'M3 16h3a2 2 0 0 1 2 2v3', 'M16 21v-3a2 2 0 0 1 2-2h3']
const SETTINGS_ICON = ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z']

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
