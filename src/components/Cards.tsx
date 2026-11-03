import { Link } from 'react-router-dom'
import { icons, studios, titles, type Title } from '../data/catalog'
import { useMenu } from './Menu'
import { usePreview } from './Preview'

/* Cards only navigate when given a destination (e.g. the signed-out page sends to sign up).
   There is no title page, so by default a card is just a focusable tile. */
function Tile({ to, children, ...rest }: { to?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  if (to)
    return (
      <Link to={to} {...rest}>
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
      to={to}
      className={`card poster${grid ? ' poster--grid' : ''}`}
      onContextMenu={menu ? onContext : undefined}
      onMouseEnter={preview ? (e) => preview.hover(t.id, e.currentTarget) : undefined}
      onMouseLeave={preview?.leave}
    >
      <div className="poster__art">
        <img src={t.poster} alt={t.name} loading="lazy" />
      </div>
      {menu && <MoreButton name={t.name} />}
    </Tile>
  )
}

/* "CW card": 280 x 179 landscape with availability tag, meta and progress. */
export function ContinueCard({ t, tag, left, progress }: { t: Title; tag: string; left: string; progress: number }) {
  const onContext = useContextMenu(t.name)
  return (
    <Tile className="card landscape" onContextMenu={onContext}>
      <img src={t.still} alt="" loading="lazy" />
      <div className="landscape__fade" />
      <span className="chip">{tag}</span>
      <span className="landscape__play" aria-hidden>
        <img src={icons.play} alt="" width={20} height={20} />
      </span>
      <div className="landscape__meta">
        <strong>{t.name}</strong> · {left}
      </div>
      <div className="progress" aria-label={`${Math.round(progress * 100)}% watched`}>
        <div className="progress__fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <MoreButton name={t.name} />
    </Tile>
  )
}

/* "Coming to Circo" card: poster with fade, release line and Remind me. */
export function ComingCard({ t, when, label, reminded, onRemind, to }: { t: Title; when: string; label?: string[]; reminded: boolean; onRemind: () => void; to?: string }) {
  return (
    <div className="coming">
      <Tile to={to} className="card poster">
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
      <button className={`btn-outline${reminded ? ' is-on' : ''}`} onClick={onRemind} aria-pressed={reminded}>
        <img src={icons.bellPlus} alt="" width={14} height={14} />
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
      <Link to={`/studio/${s.id}`} className="btn-white btn-white--sm">
        See More
      </Link>
    </div>
  )
}

export const byId = (id: string) => titles[id]
