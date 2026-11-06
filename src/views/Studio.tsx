'use client'

import { useParams } from 'next/navigation'
import { all, comingSoon, mustSee, studios, titles } from '../data/catalog'
import { ComingCard, PosterCard } from '../components/Cards'
import { Shelf } from '../components/Shelf'
import { BackButton } from '../components/Nav'
import { useReminders } from '../data/reminders'

/* Web version of the mobile "PROFILE" (studio page). */
export default function Studio() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? 'velvet'
  const s = studios[id] ?? studios.velvet
  const reminders = useReminders()

  return (
    <div className="page page--studio">
      <section className="backdrop backdrop--center">
        <img className="backdrop__art" src={s.backdrop} alt="" />
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
          {mustSee.items.map((x) => (
            <PosterCard key={x} t={titles[x]} />
          ))}
        </Shelf>
        <Shelf title="Series" to="/browse/all">
          {all.items.map((x) => (
            <PosterCard key={x} t={titles[x]} />
          ))}
        </Shelf>
        <Shelf title="Coming to Circo" to="/browse/coming-to-circo">
          {comingSoon.map((c) => (
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
