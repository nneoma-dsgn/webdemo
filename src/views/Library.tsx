'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSession } from '../auth'
import { Button, ButtonLink, EmptyState, Surface, Text } from '../components/ui'
import { icons, naira, studios, titles, upcoming, type Title } from '../data/catalog'
import { accessLeft, topUp, useViewing } from '../data/viewing'
import { useSaved } from '../data/saved'
import { Shelf } from '../components/Shelf'
import { StudioTile } from '../components/Cards'
import { useMenu } from '../components/Menu'
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
  const { toast } = useMenu()

  // Three balance header looks to compare: ?look=a (card), b (title + pill), c (wallet + stats).
  const look = (useSearchParams().get('look') ?? 'a') as 'a' | 'b' | 'c'

  return (
    <div className="page lib">
      <BalanceHeader
        look={look}
        balance={viewing.balance}
        passes={purchases.length}
        studiosJoined={joined.length}
        savedCount={savedTitles.length}
        load={(amount) => {
          topUp(amount)
          toast(`${naira(amount)} added to your balance`)
        }}
      />

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
                <StudioTile key={id} s={studios[id]} detail={`${leftLabel(sub.until - now)} left`} tone="warning" />
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

function BalanceHeader({ look, balance, passes, studiosJoined, savedCount, load }: { look: 'a' | 'b' | 'c'; balance: number; passes: number; studiosJoined: number; savedCount: number; load: (n: number) => void }) {
  // A: one card, balance on the left, quick amounts and Load on the right.
  if (look === 'a')
    return (
      <Surface level={1} pad="none" className="lib-a">
        <div>
          <Text variant="body-sm" tone="muted">
            Your balance
          </Text>
          <Amount value={balance} size="lg" />
          {balance >= 1500 && (
            <Text variant="caption" tone="muted">
              Enough for about {Math.floor(balance / 3000) || 1} pass{Math.floor(balance / 3000) === 1 ? '' : 'es'}
            </Text>
          )}
        </div>
        <div className="lib-a__acts">
          <Button onClick={() => load(10000)}>Load Balance</Button>
        </div>
      </Surface>
    )

  // B: the page title, with a compact balance pill on the right.
  if (look === 'b')
    return (
      <header className="lib-b">
        <Text variant="h1">Library</Text>
        <div className="lib-b__pill">
          <Text variant="caption" tone="muted" as="span">
            Balance
          </Text>
          <Amount value={balance} size="md" />
          <Button size="sm" onClick={() => load(10000)}>
            Load
          </Button>
        </div>
      </header>
    )

  // C: a branded wallet card with a few stats beside it.
  const name = getSession()?.name
  return (
    <div className="lib-c">
      <div className="lib-c__wallet">
        <Text variant="label">Circo balance</Text>
        <Amount value={balance} size="lg" />
        <div className="lib-c__foot">
          <Text variant="body-sm" as="span">
            {name ?? 'Your wallet'}
          </Text>
          <Button size="sm" onClick={() => load(10000)}>
            Load Balance
          </Button>
        </div>
      </div>
      <div className="lib-c__stats">
        {[
          ['Active passes', passes],
          ['Studios joined', studiosJoined],
          ['Saved for later', savedCount],
          ['Quick load', naira(5000)],
        ].map(([label, v], i) =>
          i === 3 ? (
            <button key={label as string} className="ui-surface ui-surface--1 lib-c__stat lib-c__stat--action" onClick={() => load(5000)}>
              <Text variant="body-sm" tone="muted" as="span">
                {label}
              </Text>
              <Text variant="h1" as="span">
                + {v}
              </Text>
            </button>
          ) : (
            <Surface key={label as string} level={1} pad="none" className="lib-c__stat">
              <Text variant="body-sm" tone="muted" as="span">
                {label}
              </Text>
              <Text variant="h1" as="span">
                {v}
              </Text>
            </Surface>
          ),
        )}
      </div>
    </div>
  )
}

