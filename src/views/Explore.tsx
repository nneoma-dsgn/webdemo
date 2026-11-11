'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { category, clipThumb, clipThumbFallback, exploreTitle, findClip, rowsFor, showId, watchHref, type Episode } from '../data/explore'
import { ContinueCard } from '../components/Cards'
import { accessLeft, clearProgress, useViewing } from '../data/viewing'
import { Shelf } from '../components/Shelf'
import { icons } from '../data/catalog'
import { HeroVideo } from '../components/HeroVideo'
import { Button, ButtonLink, SegmentedControl } from '../components/ui'
import { useMenu } from '../components/Menu'
import { isSaved as isSavedNow, savedToast, toggleSaved, useSaved } from '../data/saved'
import { useExploreTab } from '../components/Nav'
import { PlayGlyph } from './Home'

/* A category from the More dropdown: a spotlight carousel up top like Home's (each slide plays
   a stretch of its video, with title and description), then curated rows of episodes (New
   Episodes, Must Watch and more), never one row per show. */
export default function Explore() {
  const params = useParams<{ category: string }>()
  const cat = category(params?.category ?? '')
  const explore = useExploreTab()
  const saved = useSaved()
  const { toast } = useMenu()
  const viewing = useViewing()
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [slide, setSlide] = useState(0)
  const n = cat?.spotlight.length ?? 1
  const go = (d: number) => setSlide((i) => (i + d + n) % n)
  const spot = cat?.spotlight[slide % n]

  // Each slide plays its stretch, then hands over; if video can't start, rotate on a timer.
  useEffect(() => {
    if (!spot) return
    const t = window.setTimeout(() => go(1), (spot.end - spot.start + 6) * 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, cat?.id])
  useEffect(() => setSlide(0), [cat?.id])

  // Swipe, trackpad side-swipe and arrow keys, as on Home.
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

  if (!cat || !spot) notFound()
  // Continue Watching, as on Home: shows in this category you've started, latest first.
  const mine = new Set(cat.shows.map(showId))
  const continueRow = Object.entries(viewing.progress)
    .filter(([id]) => mine.has(id) && !removed.has(id))
    .sort((a, b) => b[1].at - a[1].at)
    .map(([id, p]) => {
      const t = exploreTitle(id)!
      const ms = accessLeft(viewing, t)
      return { t, ep: p.ep, progress: p.d ? p.t / p.d : 0, accessHours: ms === null ? 0 : isFinite(ms) ? ms / 36e5 : 24 }
    })
  const found = findClip(spot.id)
  const clip = found?.clip ?? { id: spot.id, title: '', channel: '' }
  const play = found ? watchHref(found.ep) : '/'

  return (
    <div className="page page--home">
      <section className="hero hero--carousel" aria-roledescription="carousel" aria-label={`Featured: ${clip.title}`} tabIndex={0} {...swipe}>
        <HeroVideo key={`${cat.id}-${spot.id}`} videoId={spot.id} still={clipThumb(spot.id)} start={spot.start} end={spot.end} onEnded={() => go(1)} />
        <div className="hero__scrim" />
        <SegmentedControl
          className="hero__tabs"
          label="Browse"
          value="explore"
          options={[{ value: 'shows', label: 'Shows', href: '/' }, { value: 'series', label: 'Series', href: '/?tab=series' }, explore]}
        />
        <div className="hero__content" key={spot.id}>
          <h1 className="hero__title">{clip.title}</h1>
          <p className="hero__blurb">{spot.blurb}</p>
          <div className="hero__actions">
            <ButtonLink href={play} icon={<PlayGlyph />}>
              Watch Now
            </ButtonLink>
            <Button variant="secondary" onClick={() => toast(savedToast(saved.toggle(spot.id)))} aria-pressed={saved.has(spot.id)}>
              {saved.has(spot.id) ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                <img src={icons.plus} alt="" width={20} height={20} />
              )}
              {saved.has(spot.id) ? 'Saved for later' : 'Watch later'}
            </Button>
          </div>
        </div>
        <Link href={play} className="hero__play" aria-label={`Play ${clip.title}`}>
          <img src={icons.play} alt="" width={20} height={20} />
        </Link>
        <div className="hero__dots" role="tablist" aria-label="Featured">
          {cat.spotlight.map((s, i) => (
            <button key={s.id} role="tab" aria-selected={i === slide % n} aria-label={findClip(s.id)?.clip.title ?? s.id} className={i === slide % n ? 'is-on' : ''} onClick={() => setSlide(i)}>
              {i === slide % n && <span key={`${cat.id}-${slide}`} style={{ animationDuration: `${s.end - s.start + 6}s` }} />}
            </button>
          ))}
        </div>
      </section>

      <div className="shelves">
        <Shelf title="Continue Watching">
          {continueRow.map((c) => (
            <ContinueCard
              key={c.t.id}
              t={c.t}
              accessHours={c.accessHours}
              progress={c.progress}
              ep={c.ep}
              onRemove={() => {
                clearProgress(c.t.id)
                setRemoved((r) => new Set(r).add(c.t.id))
                toast(`Removed ${c.t.name} from Continue Watching`)
              }}
            />
          ))}
        </Shelf>
        {rowsFor(cat).map((row) => (
          <Shelf key={row.id} title={row.title} to={`/explore/${cat.id}/${row.id}`}>
            {row.items.map((e) => (
              <EpisodeCard key={e.clip.id} ep={e} />
            ))}
          </Shelf>
        ))}
      </div>
    </div>
  )
}

/* An episode: its own YouTube thumbnail, the episode name, then studio, season and episode. */
export function EpisodeCard({ ep }: { ep: Episode }) {
  const { clip } = ep
  const { open, toast } = useMenu()
  // The standard card menu: Watch later (or Saved for later) and Share.
  const menu = (anchor: HTMLElement | { x: number; y: number }) =>
    open(anchor, {
      label: `${clip.title} options`,
      header: <span className="dd__title">{clip.title}</span>,
      items: [
        isSavedNow(clip.id)
          ? { id: 'later', label: 'Saved for later', icon: 'check', onSelect: () => toast(savedToast(toggleSaved(clip.id))) }
          : { id: 'later', label: 'Watch later', icon: 'bookmark', onSelect: () => toast(savedToast(toggleSaved(clip.id))) },
        {
          id: 'share',
          label: 'Share',
          icon: 'share',
          onSelect: () => {
            navigator.clipboard?.writeText(`${location.origin}${watchHref(ep)}`).catch(() => {})
            toast('Link copied')
          },
        },
      ],
    })
  return (
    <Link
      href={watchHref(ep)}
      className="card epcard"
      aria-label={`${clip.title}, ${clip.channel}, season ${ep.season} episode ${ep.episode}`}
      onContextMenu={(e) => {
        e.preventDefault()
        menu({ x: e.clientX, y: e.clientY })
      }}
    >
      <div className="epcard__art">
        <img
          src={clipThumb(clip.id)}
          alt=""
          loading="lazy"
          onLoad={(e) => {
            // YouTube serves a 120px placeholder when there's no HD art.
            const img = e.currentTarget
            if (img.naturalWidth <= 120 && !img.src.includes('mqdefault')) img.src = clipThumbFallback(clip.id)
          }}
        />
        {/* Same play circle as Continue Watching. */}
        <span className="cw__play" aria-hidden>
          <PlayGlyph size={26} />
        </span>
        <button
          className="card__more"
          aria-label={`More options for ${clip.title}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            menu(e.currentTarget)
          }}
        >
          <img src={icons.more} alt="" width={24} height={24} />
        </button>
      </div>
      <strong className="epcard__title">{clip.title}</strong>
      <span className="epcard__meta">
        {ep.single ? clip.channel : `${clip.channel} · S${ep.season} · E${ep.episode}`}
      </span>
    </Link>
  )
}
