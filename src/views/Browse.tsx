'use client'

import { notFound, useParams } from 'next/navigation'
import { browseGrid, shelves, titles } from '../data/catalog'
import { PosterCard } from '../components/Cards'
import { BackButton } from '../components/Nav'

/* "See all" grid behind each shelf chevron (Must See, Coming to Circo, All). */
export default function Browse() {
  const params = useParams<{ shelf: string }>()
  const shelf = params?.shelf ?? 'all'
  const s = shelves[shelf]
  if (!s) notFound()
  const items = [...s.items, ...browseGrid].slice(0, 18)

  return (
    <div className="page page--padded">
      <div className="subhead">
        <BackButton />
        <h1 className="subhead__title">{s.title}</h1>
      </div>
      <div className="grid">
        {items.map((id, i) => (
          <PosterCard key={i} t={titles[id]} grid />
        ))}
      </div>
    </div>
  )
}
