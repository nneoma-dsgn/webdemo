'use client'

import { notFound, useParams, useSearchParams } from 'next/navigation'
import { feeds, titles } from '../data/catalog'
import { PosterCard } from '../components/Cards'
import { BackButton } from '../components/Nav'

/* "See all" behind each Home shelf chevron: exactly that shelf's titles, from the tab you were
   on (?tab=series for Series; Shows otherwise). */
export default function Browse() {
  const params = useParams<{ shelf: string }>()
  const tab = useSearchParams().get('tab') === 'series' ? 'series' : 'shows'
  const feed = feeds[tab]
  const shelf = params?.shelf ?? ''
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
      <div className="grid">
        {s.items.map((id) => (
          <PosterCard key={id} t={titles[id]} grid />
        ))}
      </div>
    </div>
  )
}
