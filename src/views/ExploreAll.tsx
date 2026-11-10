'use client'

import { notFound, useParams } from 'next/navigation'
import { category, rowsFor } from '../data/explore'
import { BackButton } from '../components/Nav'
import { EpisodeCard } from './Explore'

/* "See all" behind an Explore row's chevron: every episode in that row as a grid. */
export default function ExploreAll() {
  const params = useParams<{ category: string; row: string }>()
  const cat = category(params?.category ?? '')
  const row = cat && rowsFor(cat).find((r) => r.id === params?.row)
  if (!cat || !row) notFound()

  return (
    <div className="page page--padded">
      <div className="subhead">
        <BackButton />
        <h1 className="subhead__title">
          {cat.label}: {row.title}
        </h1>
      </div>
      <div className="episodes__grid">
        {row.items.map((e) => (
          <EpisodeCard key={e.clip.id} ep={e} />
        ))}
      </div>
    </div>
  )
}
