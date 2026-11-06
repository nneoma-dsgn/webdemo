'use client'

import Link from 'next/link'
import { icons, studios, titles, type Title } from '../data/catalog'
import { useMenu } from './Menu'
import { usePreview } from './Preview'

/* Cards navigate to their destination when given one; without one they're a focusable tile.
   Posters default to the player, so a tap opens the title without waiting for the preview. */
function Tile({ to, children, ...rest }: { to?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  if (to)
    return (
      <Link href={to} {...rest}>
        {children}
      </Link>
    )
  return (
    <div tabIndex={0} {...rest}>
      {children}
    </div>
  )
}

function MoreButton({ name }: { name: string }) {
  const { open } = useMenu()
  return (
    <button
      className="card__more"
      aria-label={`More options for ${name}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        open(e.currentTarget, name)
      }}
    >
      <img src={icons.more} alt="" width={24} height={24} />
    </button>
  )
}

function useContextMenu(name: string) {
  const { open } = useMenu()
  return (e: React.MouseEvent) => {
    e.preventDefault()
    open({ x: e.clientX, y: e.clientY }, name)
  }
}

/* Portrait "Show card": 156 x 218 on mobile, scales with --poster-w on web. */
export function PosterCard({ t, grid, to, menu = true }: { t: Title; grid?: boolean; to?: string; menu?: boolean }) {
  const onContext = useContextMenu(t.name)
  // Rails inside a PreviewProvider (signed-in pages) open the hover preview; grids don't.
  const ctx = usePreview()
  const preview = grid ? null : ctx
  return (
    <Tile
      to={to ?? `/watch/${t.id}`}
      className={`card poster${grid ? ' poster--grid' : ''}`}
      onContextMenu={menu ? onContext : undefined}
      onMouseEnter={preview ? (e) => preview.hover(t.id, e.currentTarget) : undefined}
      onMouseLeave={preview?.leave}
      onClick={preview?.leave}
    >
      <div className="poster__art">
        <img src={t.poster} alt={t.name} loading="lazy" />
      </div>
      {/* Previewing posters carry their ⋯ in the preview card instead. */}
      {menu && !preview && <MoreButton name={t.name} />}
    </Tile>
  )
}

/* Time left on bought access, as the chip reads it: under a day in hours, then days,
   weeks and months. */
export function accessLeft(hours: number) {
  const n = (v: number, unit: string) => `${v} ${unit}${v === 1 ? '' : 's'} left`
  if (hours <= 0) return 'Access ended'
  if (hours < 1) return n(Math.max(1, Math.round(hours * 60)), 'min')
  if (hours < 24) return n(Math.floor(hours), 'hr')
  const days = Math.floor(hours / 24)
  if (days < 14) return n(days, 'day')
  if (days < 60) return n(Math.floor(days / 7), 'week')
  return n(Math.floor(days / 30), 'month')
}

/* Continue Watching card (Apple TV "Up Next" style): 16:9 art with the access chip; the episode,
   title and progress line sit on the art. The chip is the only "left" on the card. */
export function ContinueCard({ t, accessHours, progress, ep, onRemove }: { t: Title; accessHours: number; progress: number; ep?: string; onRemove?: () => void }) {
  const { open, toast } = useMenu()
  const pct = Math.round(progress * 100)
  const menu = (anchor: HTMLElement | { x: number; y: number }) =>
    open(anchor, {
      label: `${t.name} options`,
      header: <span className="dd__title">{t.name}</span>,
      items: [
        { id: 'remove', label: 'Remove', icon: 'close', onSelect: () => onRemove?.() },
        { id: 'share', label: 'Share', icon: 'share', onSelect: () => toast('Link copied') },
      ],
    })

  return (
    <Tile
      to={`/watch/${t.id}${ep ? `?ep=${encodeURIComponent(ep)}` : ''}`}
      className="card cw"
      onContextMenu={(e) => {
        e.preventDefault()
        menu({ x: e.clientX, y: e.clientY })
      }}
    >
      <div className="cw__media">
        <img className="cw__art" src={t.still} alt="" loading="lazy" />
        <div className="cw__shade" />
        <span className="cw__chip">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {accessLeft(accessHours)}
        </span>
        <button
          className="card__more cw__more"
          aria-label={`More options for ${t.name}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            menu(e.currentTarget)
          }}
        >
          <img src={icons.more} alt="" width={24} height={24} />
        </button>
        <span className="cw__play" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 20 20">
            <path d="M5.75 3.78C5.42 3.58 5 3.82 5 4.21v11.58c0 .39.42.63.75.43l9.77-5.79a.5.5 0 0 0 0-.86L5.75 3.78Z" fill="currentColor" />
          </svg>
        </span>
        {/* Apple TV style: episode and title sit on the art, above the progress line. */}
        <div className="cw__info">
          {ep && <span className="cw__ep">{ep}</span>}
          <strong className="cw__title">{t.name}</strong>
          <span className="cw__progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% watched`}>
            <span style={{ width: `${pct}%` }} />
          </span>
        </div>
      </div>
    </Tile>
  )
}

/* "Coming to Circo" card: poster with fade, release line and Remind me. */
export function ComingCard({ t, when, label, reminded, onRemind, to }: { t: Title; when: string; label?: string[]; reminded: boolean; onRemind: () => void; to?: string }) {
  return (
    <div className="coming">
      <Tile to={to ?? `/watch/${t.id}`} className="card poster">
        <div className="poster__art">
          <img src={t.poster} alt="" loading="lazy" />
          <div className="poster__fade" />
          {label && (
            <div className="poster__label">
              {label.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          )}
        </div>
      </Tile>
      <p className="coming__when">{when}</p>
      <button className={`btn-remind${reminded ? ' is-on' : ''}`} onClick={onRemind} aria-pressed={reminded}>
        {reminded ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <img src={icons.bellPlus} alt="" width={14} height={14} />
        )}
        {reminded ? 'Reminder set' : 'Remind me'}
      </button>
    </div>
  )
}


export function StudioRow({ id, note }: { id: string; note?: string }) {
  const s = studios[id]
  return (
    <div className="studio-row">
      <img className="studio-row__logo" src={s.logo} alt="" />
      <div className="studio-row__text">
        <span className="studio-row__name">{s.name}</span>
        {note && <span className="studio-row__note">{note}</span>}
      </div>
      <Link href={`/studio/${s.id}`} className="btn-white btn-white--sm">
        See More
      </Link>
    </div>
  )
}

export const byId = (id: string) => titles[id]
