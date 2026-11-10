'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { category, clipThumb, clipThumbFallback, findClip, rowsFor, type Episode } from '../data/explore'
import { Shelf } from '../components/Shelf'
import { icons } from '../data/catalog'
import { HeroVideo } from '../components/HeroVideo'
import { ButtonLink, SegmentedControl } from '../components/ui'
import { useExploreTab } from '../components/Nav'
import { PlayGlyph } from './Home'

/* A category from the More dropdown: a spotlight carousel up top like Home's (each slide plays
   a stretch of its video, with title and description), then themed rows of episodes (new, from
   Africa, around the world), never one row per show. Free to watch: no passes or access options. */
export default function Explore() {
  const params = useParams<{ category: string }>()
  const cat = category(params?.category ?? '')
  const explore = useExploreTab()
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
  const clip = findClip(spot.id)?.clip ?? { id: spot.id, title: '', channel: '' }

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
            <ButtonLink href={`/play/${spot.id}`} icon={<PlayGlyph />}>
              Watch Now
            </ButtonLink>
          </div>
        </div>
        <Link href={`/play/${spot.id}`} className="hero__play" aria-label={`Play ${clip.title}`}>
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

/* An episode: its own YouTube thumbnail, then season and episode with the episode name beside it. */
export function EpisodeCard({ ep }: { ep: Episode }) {
  const { clip } = ep
  return (
    <Link href={`/play/${clip.id}`} className="card epcard" aria-label={`${ep.show}, season ${ep.season} episode ${ep.episode}: ${clip.title}`}>
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
        <span className="epcard__play" aria-hidden>
          <PlayGlyph />
        </span>
      </div>
      <p className="epcard__title">
        <span className="epcard__num">
          S{ep.season} · E{ep.episode}
        </span>{' '}
        {clip.title}
      </p>
    </Link>
  )
}
