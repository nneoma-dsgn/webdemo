'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, ButtonLink, EmptyState, Surface, Text } from '../components/ui'
import { icons, naira, studios, titles, upcoming, type Title } from '../data/catalog'
import { accessLeft, useViewing } from '../data/viewing'
import { useSaved } from '../data/saved'
import { Shelf } from '../components/Shelf'
import { StudioTile } from '../components/Cards'
import { LoadBalance } from '../components/LoadBalance'
import { allEpisodes } from '../data/explore'
import { EpisodeCard } from './Explore'

/* Library (Figma "WALLET"): your balance up top, then what you've paid for, what you've saved,
   and the studios you've joined. Downloads are app-only, so the web leaves that row out. */

/* "3 days", "18 hrs", "Not started": time left on whatever unlocks a title. */
export function leftLabel(ms: number) {
  if (!isFinite(ms)) return 'Not started'
  const h = ms / 36e5
  if (h < 1) return `${Math.max(1, Math.round(ms / 6e4))} min`
  if (h < 48) return `${Math.floor(h)} hrs`
  return `${Math.floor(h / 24)} days`
}

export function PosterTile({ t, tag }: { t: Title; tag?: string }) {
  return (
    <Link href={`/watch/${t.id}`} className="card poster lib-poster">
      <div className="poster__art">
        <img src={t.poster} alt={t.name} loading="lazy" />
        {tag && <span className="lib-tag">{tag}</span>}
      </div>
    </Link>
  )
}

/* What the Library lists, shared by the page and its "See all" pages. */
export function useLibrary() {
  const viewing = useViewing()
  const saved = useSaved()
  const now = Date.now()

  // Purchases: titles you bought a pass for (studios you joined have their own row below).
  const purchases = Object.keys(viewing.passes)
    .map((id) => titles[id])
    .filter((t): t is Title => !!t && !upcoming(t.id))
    .map((t) => ({ t, ms: accessLeft(viewing, t, now) }))
    .filter((p): p is { t: Title; ms: number } => p.ms !== null && p.ms > 0)
    .sort((a, b) => a.ms - b.ms)
  const savedTitles = Object.values(titles).filter((t) => saved.has(t.id))
  const savedEpisodes = allEpisodes().filter((e) => saved.has(e.clip.id))
  const joined = Object.entries(viewing.subs).filter(([id, s]) => s.until > now && studios[id])
  return { viewing, now, purchases, savedTitles, savedEpisodes, joined }
}

export default function Library() {
  const { viewing, now, purchases, savedTitles, savedEpisodes, joined } = useLibrary()

  const [loading, setLoading] = useState(false)

  return (
    <div className="page lib">
      <BalanceHeader balance={viewing.balance} onLoad={() => setLoading(true)} />
      {loading && <LoadBalance onClose={() => setLoading(false)} />}

      {purchases.length === 0 && joined.length === 0 ? (
        <EmptyState
          icon={<img src="/assets/icon-purchases-empty.svg" alt="" />}
          action={
            <ButtonLink href="/?tab=series" size="lg">
              Explore Series
            </ButtonLink>
          }
        >
          You haven’t made any purchases yet.
          <br />
          Unlock Media or Studios and they’ll appear here.
        </EmptyState>
      ) : null}

      <div className="shelves lib-shelves">
        <Shelf title="Purchases" to="/library/purchases">
          {purchases.map((p) => (
            <PosterTile key={p.t.id} t={p.t} tag={leftLabel(p.ms)} />
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
                <StudioTile key={id} s={studios[id]} detail={sub.cancelled ? `Ends in ${leftLabel(sub.until - now)}` : `${leftLabel(sub.until - now)} left`} tone="warning" />
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
