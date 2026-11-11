'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { browseGrid, icons, studios, titles } from '../data/catalog'
import { StudioTile } from '../components/Cards'
import { EpisodeCard } from './Explore'
import { didYouMean, isUpcoming, norm, search, type Hit } from '../data/search'
import { Button } from '../components/ui'


/* Recent searches, kept in this browser (newest first, a handful). */
const RECENT_KEY = 'circo:recent-searches'
function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {}
}

export default function Search() {
  const router = useRouter()
  const params = useSearchParams()
  // The query lives in the URL; the top bar's search field writes it (the page's own field is for phones).
  const q = params.get('q') ?? ''
  const setQ = (v: string) => router.replace(v.trim() ? `/search?q=${encodeURIComponent(v)}` : '/search', { scroll: false })
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => setRecent(readRecent()), [])

  // Remember a search once it has settled for a moment.
  useEffect(() => {
    if (!q.trim()) return
    const t = window.setTimeout(() => remember(q), 1500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const hits = useMemo(() => search(q), [q])
  const hasQuery = q.trim().length > 0
  const suggestion = hasQuery && hits.length === 0 ? didYouMean(q) : null

  const remember = (term: string) => {
    const t = term.trim()
    if (!t) return
    const next = [t, ...recent.filter((r) => norm(r) !== norm(t))].slice(0, 8)
    setRecent(next)
    writeRecent(next)
  }

  return (
    <div className="page page--padded">
      <h1 className="page-title search-mobile-only">Search</h1>
      <form
        className="searchbar search-mobile-only"
        onSubmit={(e) => {
          e.preventDefault()
          remember(q)
        }}
      >
        <label className="searchbar__field">
          <img src={icons.searchSm} alt="" width={16} height={16} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setQ('')}
            placeholder="Search for shows, series or studios"
            aria-label="Search"
          />
        </label>
        {hasQuery && (
          <button type="button" className="searchbar__cancel" onClick={() => setQ('')}>
            Cancel
          </button>
        )}
      </form>

      {hasQuery ? (
        <>
          {hits.length > 0 ? (
            <>
              {/* Sections instead of filter tabs: each shows only when it has results. */}
              {/* One grid of shows and series, best match first; studios follow. */}
              {hits.some((h) => h.kind === 'title' || h.kind === 'episode') && (
                <section className="ssection">
                  <div className="sgrid">
                    {hits.map((h, i) => (h.kind === 'title' || h.kind === 'episode' ? <Thumb key={`${h.kind}-${i}`} hit={h} q={q} onOpen={() => remember(q)} /> : null))}
                  </div>
                </section>
              )}
              {/* Explore episodes (podcasts, masterclasses and the rest) in their own wide cards. */}
              {hits.some((h) => h.kind === 'clip') && (
                <section className="ssection">
                  <div className="episodes__grid">
                    {hits.map((h) => (h.kind === 'clip' ? <EpisodeCard key={h.ep.clip.id} ep={h.ep} /> : null))}
                  </div>
                </section>
              )}
              {hits.some((h) => h.kind === 'studio') && (
                <section className="ssection">
                  <div className="sstudios__row">
                    {hits.map((h) =>
                      h.kind === 'studio' ? (
                        <StudioTile key={h.s.id} s={h.s} detail={`${h.count} ${h.unit}${h.count === 1 ? '' : 's'}`} onClick={() => remember(q)} />
                      ) : null,
                    )}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="search-empty">
              <strong>No results for “{q.trim()}”</strong>
              {suggestion ? (
                <span>
                  Did you mean{' '}
                  <Button variant="link" className="search-link" onClick={() => setQ(suggestion.name)}>
                    {suggestion.name}
                  </Button>
                  ?
                </span>
              ) : (
                <span>Try a title, a studio or a genre.</span>
              )}
            </div>
          )}
        </>
      ) : (
        <>

          <div className="sgrid">
            {browseGrid.map((id) => (
              <Thumb key={id} hit={{ kind: 'title', t: titles[id], score: 0 }} q="" onOpen={() => {}} />
            ))}
          </div>

        </>
      )}
    </div>
  )
}

/* A title or episode as a landscape thumbnail with its name underneath. */
function Thumb({ hit, q, onOpen }: { hit: Extract<Hit, { kind: 'title' | 'episode' }>; q: string; onOpen: () => void }) {
  const t = hit.t
  const soon = isUpcoming(t.id)
  const href = hit.kind === 'episode' ? `/watch/${t.id}?ep=${encodeURIComponent(`S1 · E${hit.n}`)}` : `/watch/${t.id}`
  return (
    <Link className="sthumb" href={href} onClick={onOpen}>
      <span className="sthumb__art">
        <img src={t.poster} alt="" loading="lazy" />
        {soon && <em className="sthumb__soon">{soon.when}</em>}
      </span>
    </Link>
  )
}

/* Bold the part of the name that matches (accents ignored). */
function Mark({ text, q }: { text: string; q: string }) {
  const nq = norm(q)
  if (!nq) return <>{text}</>
  // Map each character of the original to its folded form to find the match position.
  const folded = [...text].map((c) => norm(c) || ' ')
  const flat = folded.join('')
  const at = flat.indexOf(nq)
  if (at < 0) return <>{text}</>
  let pos = 0
  let start = -1
  let end = -1
  folded.forEach((f, i) => {
    if (start < 0 && pos >= at) start = i
    pos += f.length
    if (end < 0 && pos >= at + nq.length) end = i + 1
  })
  const chars = [...text]
  return (
    <>
      {chars.slice(0, start).join('')}
      <b>{chars.slice(start, end).join('')}</b>
      {chars.slice(end).join('')}
    </>
  )
}
