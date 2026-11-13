'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { hideCaptions, loadApi, REVEAL_DELAY_MS, type YTPlayer } from './HeroVideo'
import { Button } from './ui'
import { isPhone } from './viewport'

export type TheaterItem = {
  id: string
  title: string
  still: string
  /* Official key art (poster) for the queue and the still before the trailer starts. */
  poster: string
  tint: string
  /* Preview trailer on YouTube, played as a short clip from the middle so studio cards are skipped. */
  videoId: string
  start: number
  end: number
}

/* Circo Theater: one big screen playing the current title's trailer clip, with a queue of
   thumbnails underneath. The section pins to the middle of the screen for a short stretch of
   scrolling: it grows into focus while the page dims, scrolling steps through the queue, and
   when the user pauses each clip plays out and hands over to the next. On phones the screen
   fills the width, with Watch Now and a swipeable queue under it, and scrolling doesn't step
   through titles. */
export function Theater({ items, cta }: { items: TheaterItem[]; cta: { label: string; onClick: () => void } }) {
  const n = items.length
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [muted, setMuted] = useState(true)
  const pin = useRef<HTMLDivElement>(null)
  const mount = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const ready = useRef(false)
  const lastStep = useRef(-1)
  const it = items[active]

  const next = useCallback(() => setActive((a) => (a + 1) % n), [n])

  /* Pin + scroll: the screen grows from a card to fill the viewport as the section scrolls in,
     then the rest of the pinned stretch steps through the queue. */
  const [grow, setGrow] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = pin.current
      if (!el) return
      const vh = window.innerHeight
      const r = el.getBoundingClientRect()
      // Starts when the section top passes 35% of the screen, done 25vh into the pin.
      const g = Math.min(1, Math.max(0, (vh * 0.35 - r.top) / (vh * 0.6)))
      setGrow(g)
      const pinned = r.top <= 1 && r.bottom >= vh - 1
      setFocused(pinned)
      // Phones: scrolling only brings the screen into focus; clips hand over on their own and
      // the queue is tapped or swiped.
      if (isPhone()) return
      const growPx = vh * 0.25
      const travel = r.height - vh - growPx
      if (!pinned || travel <= 0 || -r.top < growPx) {
        if (!pinned) lastStep.current = -1
        return
      }
      const step = Math.min(n - 1, Math.floor(((-r.top - growPx) / travel) * n))
      if (step !== lastStep.current) {
        lastStep.current = step
        setActive(step)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [n])

  useEffect(() => {
    document.body.classList.toggle('spot-focus', focused)
    return () => document.body.classList.remove('spot-focus')
  }, [focused])

  /* One YouTube player for the whole section; clips are swapped into it. */
  const nextRef = useRef(next)
  const itemsRef = useRef(items)
  itemsRef.current = items
  nextRef.current = next
  useEffect(() => {
    let cancelled = false
    let revealTimer = 0
    loadApi().then(() => {
      if (cancelled || !mount.current || !window.YT) return
      const YT = window.YT
      // Created with the first clip so YouTube has a video to initialise around (an empty
      // player can stall before onReady) and starts buffering it before the user arrives.
      const first = itemsRef.current[0]
      player.current = new YT.Player(mount.current, {
        videoId: first.videoId,
        playerVars: { start: first.start, end: first.end, autoplay: 0, mute: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, cc_load_policy: 0, cc_lang_pref: 'none' },
        events: {
          onReady: () => {
            ready.current = true
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.PLAYING) {
              hideCaptions(player.current)
              // Reveal as soon as frames are flowing so picture and sound start together.
              window.clearTimeout(revealTimer)
              revealTimer = window.setTimeout(() => setPlaying(true), REVEAL_DELAY_MS)
            }
            if (e.data === YT.PlayerState.ENDED) {
              window.clearTimeout(revealTimer)
              setPlaying(false)
              nextRef.current()
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
      ready.current = false
    }
  }, [])

  /* Load the active clip while in focus; pause when the section leaves focus. */
  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    if (!focused) {
      if (ready.current) player.current?.pauseVideo()
      return
    }
    const start = () => {
      if (!ready.current || !player.current) {
        // Keep waiting for the player while this clip is still the active one.
        t = window.setTimeout(start, 150)
        return
      }
      player.current.loadVideoById({ videoId: it.videoId, startSeconds: it.start, endSeconds: it.end })
    }
    let t = window.setTimeout(start, 0)
    return () => window.clearTimeout(t)
  }, [active, focused, it.videoId, it.start, it.end])

  /* Progress for the queue, from the player clock; falls back to a timer if video can't play. */
  useEffect(() => {
    if (!focused) return
    const span = it.end - it.start
    const began = Date.now()
    const tick = window.setInterval(() => {
      const p = player.current
      if (playing && p) {
        setProgress(Math.min(1, Math.max(0, (p.getCurrentTime() - it.start) / span)))
      } else {
        // Still image fallback: advance after the clip length even without video.
        const f = (Date.now() - began) / 1000 / span
        if (f >= 1.15) nextRef.current()
        else if (!playing) setProgress(Math.min(1, f))
      }
    }, 200)
    return () => window.clearInterval(tick)
  }, [focused, playing, active, it.start, it.end])

  /* Phones swipe the queue sideways: keep the playing title in view (the queue only, never
     the page). */
  const queue = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const q = queue.current
    const el = q?.children[active] as HTMLElement | undefined
    if (!q || !el || q.scrollWidth <= q.clientWidth) return
    q.scrollTo({ left: el.offsetLeft - (q.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' })
  }, [active])

  const toggleSound = () => {
    const p = player.current
    if (!p || !ready.current) return
    if (muted) p.unMute()
    else p.mute()
    setMuted(!muted)
  }

  return (
    <div className="spot-pin" ref={pin}>
      <section className={`theater${focused ? ' is-focus' : ''}`} style={{ ['--tint' as string]: it.tint, ['--p' as string]: grow }} aria-label="Now on Circo">
        <div className="spot__glow" aria-hidden />
        <header className="spot__head">
          <h2 className="shelf__title">Now on Circo</h2>
        </header>

        <div className="theater__stage">
          <div className={`screen${playing ? ' screen--playing' : ''}`}>
            {items.map((x, i) => (
              <div key={x.id} className={`screen__still${i === active ? ' is-on' : ''}`}>
                <img className="screen__blur" src={x.poster} alt="" />
                <img className="screen__poster" src={x.poster} alt="" />
                <img className="screen__wide" src={x.still} alt="" />
              </div>
            ))}
            <div className="screen__video" aria-hidden>
              <div ref={mount} />
            </div>
            <div className="screen__shade" />
            {playing && (
              <button className="screen__sound" onClick={toggleSound} aria-label={muted ? 'Turn sound on' : 'Mute'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  {muted ? <path d="M23 9l-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
                </svg>
              </button>
            )}
          </div>

          {/* Outside the screen so phones can stack it between the screen and the queue; on
              larger screens it's placed over the screen's corner. */}
          <Button className="screen__cta" aria-label={`${cta.label}: ${it.title}`} onClick={cta.onClick}>
            {cta.label}
          </Button>

          <div className="queue" ref={queue} role="tablist" aria-label="Up next">
            {items.map((x, i) => (
              <button key={x.id} role="tab" aria-selected={i === active} aria-label={x.title} className={`queue__item${i === active ? ' is-on' : ''}`} onClick={() => setActive(i)}>
                <img src={x.poster} alt="" loading="lazy" />
                <span className="queue__bar">
                  <span style={{ transform: `scaleX(${i === active ? progress : i < active ? 1 : 0})` }} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
