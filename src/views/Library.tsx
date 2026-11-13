'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, ButtonLink, EmptyState, Surface, Text } from '../components/ui'
import { icons, naira, studios, titles, upcoming, type Title } from '../data/catalog'
import { accessLabel, accessLeft, timeLeft, useViewing } from '../data/viewing'
import { useSaved } from '../data/saved'
import { Shelf } from '../components/Shelf'
import { ContinueWatching } from '../components/ContinueWatching'
import { StudioTile } from '../components/Cards'
import { LoadBalance } from '../components/LoadBalance'
import { Icon } from '../components/Icon'
import { allEpisodes } from '../data/explore'
import { EpisodeCard } from './Explore'

/* Library (Figma "WALLET"), access first: your balance in a compact row, then Continue
   Watching, everything you can watch (My access, with what's left on it and who it's from),
   what you've saved, and the studios you've joined. Downloads are app-only, so the web leaves
   that row out. */

/* A poster from the Library. With `access`, its time left sits on the art ("3 days left",
   "Expired") and the studio it's from links underneath. An expired title opens on renewal. */
export function PosterTile({ t, access, grid }: { t: Title; access?: number; grid?: boolean }) {
  const poster = (
    <Link href={`/watch/${t.id}`} className={`card poster lib-poster${grid ? ' poster--grid' : ''}`}>
      <div className="poster__art">
        <img src={t.poster} alt={t.name} loading="lazy" />
        {access !== undefined && <span className={`lib-tag${access <= 0 ? ' lib-tag--expired' : ''}`}>{accessLabel(access)}</span>}
      </div>
    </Link>
  )
  const studio = studios[t.studioId]
  if (access === undefined || !studio) return poster
  return (
    <div className={`lib-tile${grid ? ' lib-tile--grid' : ''}`}>
      {poster}
      <Link href={`/studio/${studio.id}`} className="lib-tile__studio">
        {studio.name}
      </Link>
    </div>
  )
}

/* Nothing yet: the Library and its My access page. */
export const LIBRARY_EMPTY = (
  <>
    Nothing to watch here yet.
    <br />
    Unlock a title or join a Studio and it’ll appear here.
  </>
)

/* What the Library lists, shared by the page and its "See all" pages. */
export function useLibrary() {
  const viewing = useViewing()
  const saved = useSaved()
  const now = Date.now()

  // My access: titles you have a pass for (studios you joined have their own row below).
  // Soonest to end first, then passes not started yet, then expired ones (kept, to renew).
  const group = (ms: number) => (ms <= 0 ? 2 : isFinite(ms) ? 0 : 1)
  const access = Object.keys(viewing.passes)
    .map((id) => titles[id])
    .filter((t): t is Title => !!t && !upcoming(t.id))
    .map((t) => ({ t, ms: accessLeft(viewing, t, now) }))
    .filter((p): p is { t: Title; ms: number } => p.ms !== null)
    .sort((a, b) => group(a.ms) - group(b.ms) || a.ms - b.ms)
  const savedTitles = Object.values(titles).filter((t) => saved.has(t.id))
  const savedEpisodes = allEpisodes().filter((e) => saved.has(e.clip.id))
  const joined = Object.entries(viewing.subs).filter(([id, s]) => s.until > now && studios[id])
  return { viewing, now, access, savedTitles, savedEpisodes, joined }
}

export default function Library() {
  const { viewing, now, access, savedTitles, savedEpisodes, joined } = useLibrary()

  const [loading, setLoading] = useState(false)

  return (
    <div className="page lib">
      <BalanceHeader balance={viewing.balance} onLoad={() => setLoading(true)} />
      {loading && <LoadBalance onClose={() => setLoading(false)} />}

      {access.length === 0 && joined.length === 0 ? (
        <EmptyState
          icon={<Icon name="library" />}
          action={
            <ButtonLink href="/" size="lg">
              Find something to watch
            </ButtonLink>
          }
        >
          {LIBRARY_EMPTY}
        </EmptyState>
      ) : null}

      <div className="shelves lib-shelves">
        <ContinueWatching />

        <Shelf title="My access" to="/library/access">
          {access.map((p) => (
            <PosterTile key={p.t.id} t={p.t} access={p.ms} />
          ))}
        </Shelf>

        <Shelf title="Saved for later" to="/library/saved">
          {savedTitles.map((t) => (
            <PosterTile key={t.id} t={t} />
          ))}
        </Shelf>

        <Shelf title="Saved Episodes" to="/library/saved">
          {savedEpisodes.map((e) => (
            <EpisodeCard key={e.clip.id} ep={e} />
          ))}
        </Shelf>

        {joined.length > 0 && (
          <section className="lib-studios">
            <Link href="/library/studios" className="shelf__head lib-studios__head">
              <h2 className="shelf__title">Studios</h2>
              <img className="shelf__chevron" src={icons.chevronRight} alt="" width={20} height={20} />
            </Link>
            <div className="sstudios__row">
              {joined.map(([id, sub]) => (
                <StudioTile key={id} s={studios[id]} detail={`${sub.cancelled ? 'Ends' : 'Renews'} in ${timeLeft(sub.until - now)}`} tone="warning" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Amount({ value, size }: { value: number; size: 'lg' | 'md' }) {
  const [whole, cents] = value.toFixed(2).split('.')
  return (
    <strong className={`lib-amt lib-amt--${size}`}>
      {naira(Number(whole))}
      <span>.{cents}</span>
    </strong>
  )
}

/* The balance card: what's in your wallet, and Load Balance to add more through Paystack. */
function BalanceHeader({ balance, onLoad }: { balance: number; onLoad: () => void }) {
  return (
    <Surface level={1} pad="none" className="lib-a">
      <div>
        <Text variant="body-sm" tone="muted">
          Your balance
        </Text>
        <Amount value={balance} size="lg" />
      </div>
      <div className="lib-a__acts">
        <Button onClick={onLoad}>Load Balance</Button>
      </div>
    </Surface>
  )
}
