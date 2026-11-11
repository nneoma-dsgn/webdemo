'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { feeds, icons, titleFor, titles, upcoming } from '../data/catalog'
import { ComingCard, ContinueCard, PosterCard } from '../components/Cards'
import { Shelf } from '../components/Shelf'
import { useMenu } from '../components/Menu'
import { HeroVideo } from '../components/HeroVideo'
import { useReminders } from '../data/reminders'
import { savedToast, useSaved } from '../data/saved'
import { accessLeft, clearProgress, useViewing } from '../data/viewing'
import { Button, ButtonLink, SegmentedControl } from '../components/ui'
import { useExploreTab } from '../components/Nav'

// Length of the fade-out before the feed swaps (the fade-in matches it in CSS).
const FEED_FADE_MS = 220

export default function Home() {
  const params = useSearchParams()
  const wanted: 'shows' | 'series' = params.get('tab') === 'series' ? 'series' : 'shows'
  /* Switching Shows / Series: the page fades out, the feed swaps while it's dark, then fades in. */
  const [tab, setTab] = useState(wanted)
  const [fading, setFading] = useState(false)
  useEffect(() => {
    if (wanted === tab) return
    setFading(true)
    const swap = window.setTimeout(() => {
      setTab(wanted)
      setFading(false)
      window.scrollTo({ top: 0 })
    }, FEED_FADE_MS)
    return () => window.clearTimeout(swap)
  }, [wanted, tab])
  const { toast } = useMenu()
  const explore = useExploreTab()
  const reminders = useReminders()
  const saved = useSaved()
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  // Shows and Series are separate feeds, each with its own hero carousel and shelves.
  const feed = feeds[tab]
  // Continue Watching: only what you've actually been watching, latest first.
  const viewing = useViewing()
  const kind = tab === 'series' ? 'series' : 'show'
  const watched = Object.entries(viewing.progress)
    // Explore's shows count too: a podcast series sits with Series, a single video with Shows.
    .filter(([id]) => titleFor(id)?.kind === kind)
    .sort((a, b) => b[1].at - a[1].at)
    .map(([id, p]) => {
      const ms = accessLeft(viewing, titleFor(id)!)
      return { id, ep: p.ep, progress: p.d ? p.t / p.d : 0, accessHours: ms === null ? 0 : isFinite(ms) ? ms / 36e5 : 24 }
    })
  const continueRow = watched
  const [slide, setSlide] = useState(0)
  useEffect(() => setSlide(0), [tab])
  const n = feed.heroes.length
  const clip = feed.heroes[slide % n]
  const hero = titles[clip.id]
  const go = (d: number) => setSlide((i) => (i + d + n) % n)

  // Switch slides by dragging/swiping the hero, trackpad side-swipes, or the arrow keys.
  const drag = useRef<{ x: number; y: number } | null>(null)
  const wheelLock = useRef(0)
  const swipe = {
    onPointerDown: (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button, a')) return
      drag.current = { x: e.clientX, y: e.clientY }
    },
    onPointerUp: (e: React.PointerEvent) => {
      const d = drag.current
      drag.current = null
      if (!d) return
      const dx = e.clientX - d.x
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(dx < 0 ? 1 : -1)
    },
    onPointerCancel: () => (drag.current = null),
    onWheel: (e: React.WheelEvent) => {
      if (Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY) || Date.now() < wheelLock.current) return
      wheelLock.current = Date.now() + 700
      go(e.deltaX > 0 ? 1 : -1)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    },
  }

  // Each slide plays its clip, then hands over; if video can't start, rotate on a timer.
  useEffect(() => {
    const t = window.setTimeout(() => go(1), (clip.end - clip.start + 6) * 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, tab])

  const remind = (id: string) => {
    if (reminders.toggle(id)) toast(`We'll remind you when ${titles[id].name} lands`)
  }

  return (
    <div className={`page page--home feed-fade${fading ? ' is-out' : ''}`}>
      <section className="hero hero--carousel" aria-roledescription="carousel" aria-label={`Featured: ${hero.name}`} tabIndex={0} {...swipe}>
        <HeroVideo key={`${tab}-${clip.id}`} videoId={clip.videoId} still={hero.still} start={clip.start} end={clip.end} onEnded={() => go(1)} />
        <div className="hero__scrim" />
        <SegmentedControl
          className="hero__tabs"
          label="Browse"
          value={tab}
          options={[
            { value: 'shows', label: 'Shows', href: '/' },
            { value: 'series', label: 'Series', href: '/?tab=series' },
            explore,
          ]}
        />
        <div className="hero__content" key={hero.id}>
          <h1 className="hero__title">{hero.name}</h1>
          <p className="hero__blurb">{hero.blurb}</p>
          <div className="hero__actions">
            <ButtonLink href={`/watch/${hero.id}`} icon={<PlayGlyph />}>
              {upcoming(hero.id) ? 'Watch Trailer' : 'Watch Now'}
            </ButtonLink>
            <Button variant="secondary" onClick={() => toast(savedToast(saved.toggle(hero.id)))} aria-pressed={saved.has(hero.id)}>
              {saved.has(hero.id) ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <img src={icons.plus} alt="" width={20} height={20} />
              )}
              {saved.has(hero.id) ? 'Saved for later' : 'Watch later'}
            </Button>
          </div>
        </div>
        <button className="hero__play" aria-label={`Play ${hero.name}`}>
          <img src={icons.play} alt="" width={20} height={20} />
        </button>
        <div className="hero__dots" role="tablist" aria-label="Featured titles">
          {feed.heroes.map((h, i) => (
            <button key={h.id} role="tab" aria-selected={i === slide % n} aria-label={titles[h.id].name} className={i === slide % n ? 'is-on' : ''} onClick={() => setSlide(i)}>
              {i === slide % n && <span key={`${tab}-${slide}`} style={{ animationDuration: `${clip.end - clip.start + 6}s` }} />}
            </button>
          ))}
        </div>
      </section>

      <div className="shelves">
        <Shelf title="Must See" to="/browse/must-see">
          {feed.mustSee.map((id) => (
            <PosterCard key={id} t={titles[id]} />
          ))}
        </Shelf>

        {/* Hidden until you've started something. */}
        {continueRow.some((c) => !removed.has(c.id)) && (
          <Shelf title="Continue Watching">
            {continueRow
              .filter((c) => !removed.has(c.id))
              .map((c) => (
                <ContinueCard
                  key={c.id}
                  t={titleFor(c.id)!}
                  accessHours={c.accessHours}
                  progress={c.progress}
                  ep={c.ep}
                  onRemove={() => {
                    clearProgress(c.id)
                    setRemoved((r) => new Set(r).add(c.id))
                    toast(`Removed ${titleFor(c.id)?.name} from Continue Watching`)
                  }}
                />
              ))}
          </Shelf>
        )}

        <Shelf title={feed.middle.title} to={`/browse/${feed.middle.id === 'nollywood' ? 'nollywood' : 'all'}`}>
          {feed.middle.items.map((id) => (
            <PosterCard key={id} t={titles[id]} />
          ))}
        </Shelf>

        <Shelf title="Coming to Circo" to="/browse/coming-to-circo">
          {feed.coming.map((c) => (
            <ComingCard key={c.id} t={titles[c.id]} when={c.when} label={c.label} reminded={reminders.has(c.id)} onRemind={() => remind(c.id)} />
          ))}
        </Shelf>

        <Shelf title="All" to="/browse/all">
          {feed.all.map((id) => (
            <PosterCard key={id} t={titles[id]} />
          ))}
        </Shelf>
      </div>
    </div>
  )
}

export function PlayGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <path d="M5.75 3.78C5.42 3.58 5 3.82 5 4.21v11.58c0 .39.42.63.75.43l9.77-5.79a.5.5 0 0 0 0-.86L5.75 3.78Z" fill="currentColor" />
    </svg>
  )
}
