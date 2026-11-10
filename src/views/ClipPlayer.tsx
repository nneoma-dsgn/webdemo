'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { clipThumb, findClip } from '../data/explore'
import { icons } from '../data/catalog'
import { EpisodeCard } from './Explore'

/* Explore videos play in YouTube's own player (they're the publisher's uploads), full width,
   with what's next from the same row underneath. */
export default function ClipPlayer() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id ?? ''
  const found = findClip(id)
  // Up next: the rest of this show, then the category's other new episodes.
  const next = found ? [...found.show.items.filter((c) => c.id !== id).map((c) => findClip(c.id)!.ep)] : []

  return (
    <div className="clipplayer">
      <header className="clipplayer__bar">
        <button className="back" aria-label="Back" onClick={() => (history.length > 1 ? history.back() : router.push(found ? `/explore/${found.cat.id}` : '/'))}>
          <img src={icons.chevronLeft} alt="" width={24} height={24} />
        </button>
        {found && (
          <div className="clipplayer__head">
            <strong>{found.clip.title}</strong>
            <span>
              {found.show.name} · S{found.ep.season} · E{found.ep.episode}
            </span>
          </div>
        )}
      </header>
      <div className="clipplayer__frame" style={{ backgroundImage: `url(${clipThumb(id)})` }}>
        <iframe
          key={id}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={found?.clip.title ?? 'Video'}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      {next.length > 0 && found && (
        <section className="clipplayer__next">
          <h2 className="shelf__title">
            More from <Link href={`/explore/${found.cat.id}`}>{found.show.name}</Link>
          </h2>
          <div className="clipplayer__grid">
            {next.map((ep) => (
              <EpisodeCard key={ep.clip.id} ep={ep} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
