'use client'

import { useState } from 'react'
import { browseGrid, icons, searchResults, titles } from '../data/catalog'
import { PosterCard, StudioRow } from '../components/Cards'
import { useMenu } from '../components/Menu'

type Filter = 'all' | 'media' | 'studios'

export default function Search() {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const { open } = useMenu()
  const hasQuery = q.trim().length > 0

  return (
    <div className="page page--padded">
      <h1 className="page-title">Search</h1>
      <div className="searchbar">
        <label className="searchbar__field">
          <img src={icons.searchSm} alt="" width={16} height={16} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for shows, series or studios" aria-label="Search" />
        </label>
        {hasQuery && (
          <button className="searchbar__cancel" onClick={() => setQ('')}>
            Cancel
          </button>
        )}
      </div>

      {hasQuery ? (
        <>
          <div className="segmented" role="tablist">
            {(['all', 'media', 'studios'] as Filter[]).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="results">
            {filter !== 'studios' &&
              searchResults.map((r) => (
                <div className="result" key={r.id}>
                  <img className="result__thumb" src={r.thumb} alt="" />
                  <div className="result__text">
                    <span className="result__title">{r.title}</span>
                    <span className="result__meta">
                      {r.show} • {r.studio}
                    </span>
                  </div>
                  <button className="icon-btn" aria-label={`More options for ${r.title}`} onClick={(e) => open(e.currentTarget, r.title)}>
                    <img src={icons.more} alt="" width={24} height={24} />
                  </button>
                </div>
              ))}
            {filter !== 'media' && (filter === 'studios' ? ['wb', 'velvet', 'wb', 'velvet'] : ['wb', 'velvet']).map((s, i) => <StudioRow key={i} id={s} />)}
          </div>
        </>
      ) : (
        <>
          <h2 className="section-label">Browse everything</h2>
          <div className="grid">
            {browseGrid.map((id, i) => (
              <PosterCard key={i} t={titles[id]} grid />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
