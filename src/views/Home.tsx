'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { feeds, icons, titles } from '../data/catalog'
import { ComingCard, ContinueCard, PosterCard } from '../components/Cards'
import { Shelf } from '../components/Shelf'
import { useMenu } from '../components/Menu'
import { HeroVideo } from '../components/HeroVideo'

export default function Home() {
  const params = useSearchParams()
  const tab = params.get('tab') === 'series' ? 'series' : 'shows'
  const { toast } = useMenu()
  const [reminders, setReminders] = useState<Set<string>>(new Set())
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  // Shows and Series are separate feeds, each with its own hero trailer and shelves.
  const feed = feeds[tab]
  const hero = titles[feed.hero.id]

  const remind = (id: string) =>
    setReminders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        next.add(id)
        toast(`We'll remind you when ${titles[id].name} lands`)
      }
      return next
    })

  return (
    <div className="page page--home">
      <section className="hero" aria-label={`Featured: ${hero.name}`}>
        <HeroVideo key={tab} videoId={feed.hero.videoId} still={hero.still} start={feed.hero.start} end={feed.hero.end} />
        <div className="hero__scrim" />
        <div className="hero__tabs" role="tablist" aria-label="Browse">
          <Link href="/" role="tab" aria-selected={tab === 'shows'} className={`pill${tab === 'shows' ? ' pill--on' : ''}`}>
            Shows
          </Link>
          <Link href="/?tab=series" role="tab" aria-selected={tab === 'series'} className={`pill${tab === 'series' ? ' pill--on' : ''}`}>
            Series
          </Link>
        </div>
        <div className="hero__content">
          <h1 className="hero__title">{hero.name}</h1>
          <p className="hero__blurb">{hero.blurb}</p>
          <div className="hero__actions">
            <button className="btn-white">
              <PlayGlyph />
              Watch Now
            </button>
            <button className="btn-dark" onClick={() => toast('Added to Saved for later')}>
              <img src={icons.plus} alt="" width={20} height={20} />
              Watch later
            </button>
          </div>
        </div>
        <button className="hero__play" aria-label={`Play ${hero.name}`}>
          <img src={icons.play} alt="" width={20} height={20} />
        </button>
      </section>

      <div className="shelves">
        <Shelf title="Must See" to="/browse/must-see">
          {feed.mustSee.map((id) => (
            <PosterCard key={id} t={titles[id]} />
          ))}
        </Shelf>

        <Shelf title="Continue Watching">
          {feed.continueWatching
            .filter((c) => !removed.has(c.id))
            .map((c) => (
              <ContinueCard
                key={c.id}
                t={titles[c.id]}
                accessHours={c.accessHours}
                left={c.left}
                progress={c.progress}
                ep={c.ep}
                onRemove={() => {
                  setRemoved((r) => new Set(r).add(c.id))
                  toast(`Removed ${titles[c.id].name} from Continue Watching`)
                }}
              />
            ))}
        </Shelf>

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
