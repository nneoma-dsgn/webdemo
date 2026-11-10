'use client'

import { useParams } from 'next/navigation'
import { STUDIO_PLACEHOLDER, studios, titles, upcoming } from '../data/catalog'
import { ComingCard, PosterCard } from '../components/Cards'
import { Shelf } from '../components/Shelf'
import { BackButton } from '../components/Nav'
import { useReminders } from '../data/reminders'

/* Web version of the mobile "PROFILE" (studio page). */
export default function Studio() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? 'harmattan'
  const s = studios[id] ?? studios.harmattan
  const reminders = useReminders()
  // Only this studio's titles.
  const mine = Object.values(titles).filter((t) => t.studioId === s.id).map((t) => t.id)

  return (
    <div className="page page--studio">
      {/* The studio's own reel, or the placeholder film set until it uploads one. */}
      <section className="backdrop backdrop--center">
        <video className="backdrop__art" src={s.teaser ?? STUDIO_PLACEHOLDER} autoPlay muted loop playsInline aria-hidden />
        <div className="backdrop__scrim" />
        <div className="page-back">
          <BackButton />
        </div>
        <div className="backdrop__content">
          <h1 className="title-hd">{s.name}</h1>
          <p className="title-blurb">{s.about}</p>
        </div>
      </section>
      <div className="shelves">
        <Shelf title="Shows" to="/browse/all">
          {mine.filter((x) => titles[x].kind === 'show' && !upcoming(x)).map((x) => (
            <PosterCard key={x} t={titles[x]} />
          ))}
        </Shelf>
        <Shelf title="Series" to="/browse/all">
          {mine.filter((x) => titles[x].kind === 'series' && !upcoming(x)).map((x) => (
            <PosterCard key={x} t={titles[x]} />
          ))}
        </Shelf>
        <Shelf title="Coming to Circo" to="/browse/coming-to-circo">
          {mine.map((x) => upcoming(x)).filter((c): c is NonNullable<typeof c> => !!c).map((c) => (
            <ComingCard
              key={c.id}
              t={titles[c.id]}
              when={c.when}
              label={c.label}
              reminded={reminders.has(c.id)}
              onRemind={() => reminders.toggle(c.id)}
            />
          ))}
        </Shelf>
      </div>
    </div>
  )
}
