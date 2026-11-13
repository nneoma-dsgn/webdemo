'use client'

import { notFound, useParams, useSearchParams } from 'next/navigation'
import { feeds, titles } from '../data/catalog'
import { ComingCard, PosterCard } from '../components/Cards'
import { BackButton } from '../components/Nav'
import { useMenu } from '../components/Menu'
import { useReminders } from '../data/reminders'

/* "See all" behind each Home shelf chevron: exactly that shelf's titles, from the tab you were
   on (?tab=series for Series; Shows otherwise). */
export default function Browse() {
  const params = useParams<{ shelf: string }>()
  const tab = useSearchParams().get('tab') === 'series' ? 'series' : 'shows'
  const feed = feeds[tab]
  const shelf = params?.shelf ?? ''
  const { toast } = useMenu()
  const reminders = useReminders()
  const s =
    shelf === 'must-see'
      ? { title: 'Must See', items: feed.mustSee }
      : shelf === feed.middle.id
        ? { title: feed.middle.title, items: feed.middle.items }
        : shelf === 'coming-to-circo'
          ? { title: 'Coming to Circo', items: feed.coming.map((c) => c.id) }
          : shelf === 'all'
            ? { title: 'All', items: feed.all }
            : null
  if (!s) notFound()

  return (
    <div className="page page--padded">
      <div className="subhead">
        <BackButton />
        <h1 className="subhead__title">{s.title}</h1>
      </div>
      {shelf === 'coming-to-circo' ? (
        // The same coming-soon cards as the Home shelf: date and Remind me under each poster.
        <div className="grid grid--coming">
          {feed.coming.map((c) => (
            <ComingCard
              key={c.id}
              t={titles[c.id]}
              when={c.when}
              label={c.label}
              grid
              reminded={reminders.has(c.id)}
              onRemind={() => {
                if (reminders.toggle(c.id)) toast(`We'll remind you when ${titles[c.id].name} lands`)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid">
          {s.items.map((id) => (
            <PosterCard key={id} t={titles[id]} grid />
          ))}
        </div>
      )}
    </div>
  )
}
