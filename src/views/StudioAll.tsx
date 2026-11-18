'use client'

import { notFound, useParams } from 'next/navigation'
import { studios, titles, upcoming } from '../data/catalog'
import { ComingCard, PosterCard } from '../components/Cards'
import { BackButton } from '../components/Nav'
import { useMenu } from '../components/Menu'
import { useReminders } from '../data/reminders'
import { episodesByStudio } from '../data/explore'
import { EpisodeCard } from './Explore'

/* "See all" behind a studio page shelf's chevron: every title in that shelf as a grid. */
const STUDIO_SHELVES = { episodes: 'Episodes', shows: 'Shows', series: 'Series', coming: 'Coming to this Studio' } as const
type StudioShelf = keyof typeof STUDIO_SHELVES

export default function StudioAll() {
  const params = useParams<{ id: string; shelf: string }>()
  const s = studios[params?.id ?? '']
  const shelf = params?.shelf as StudioShelf
  if (!s || !(shelf in STUDIO_SHELVES)) notFound()
  const { toast } = useMenu()
  const reminders = useReminders()
  const mine = Object.values(titles).filter((t) => t.studioId === s.id).map((t) => t.id)
  const released = (kind: 'show' | 'series') => mine.filter((x) => titles[x].kind === kind && !upcoming(x))

  return (
    <div className="page page--padded">
      <div className="subhead">
        <BackButton />
        <h1 className="subhead__title">
          {s.name}: {STUDIO_SHELVES[shelf]}
        </h1>
      </div>
      {shelf === 'episodes' ? (
        <div className="episodes__grid">
          {episodesByStudio(s.id).map((e) => (
            <EpisodeCard key={e.clip.id} ep={e} />
          ))}
        </div>
      ) : shelf === 'coming' ? (
        <div className="grid grid--coming">
          {mine.map((x) => upcoming(x)).filter((c): c is NonNullable<typeof c> => !!c).map((c) => (
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
          {released(shelf === 'shows' ? 'show' : 'series').map((id) => (
            <PosterCard key={id} t={titles[id]} grid />
          ))}
        </div>
      )}
    </div>
  )
}
