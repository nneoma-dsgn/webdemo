'use client'

import { useState } from 'react'
import { notFound, useParams } from 'next/navigation'
import { STUDIO_PLACEHOLDER, naira, plans, studios, titles, upcoming } from '../data/catalog'
import { Button, ButtonLink, Dialog, EmptyState, List, ListRow, Surface, Text } from '../components/ui'
import { JoinStudio } from '../components/JoinStudio'
import Link from 'next/link'
import { BackButton } from '../components/Nav'
import { useMenu } from '../components/Menu'
import { Icon } from '../components/Icon'
import { cancelSub, planLabel, resumeSub, type Sub } from '../data/viewing'
import { LIBRARY_EMPTY, PosterTile, useLibrary } from './Library'
import { EpisodeCard } from './Explore'

/* "See all" behind each Library row (Figma WALLET): the full grid of what you have access to or
   have saved, or the studios you subscribe to (where you can cancel). Empty sections get the
   Library empty state. */

const SECTIONS = {
  access: 'My access',
  saved: 'Saved for later',
  studios: 'Studios',
} as const

type Section = keyof typeof SECTIONS

export default function LibraryAll() {
  const params = useParams<{ section: string }>()
  if (!params?.section || !(params.section in SECTIONS)) notFound()
  const section = params.section as Section
  const { access, savedTitles, savedEpisodes, joined } = useLibrary()

  const count = section === 'access' ? access.length : section === 'saved' ? savedTitles.length + savedEpisodes.length : joined.length

  return (
    <div className="page page--padded">
      <div className="subhead">
        <BackButton />
        <h1 className="subhead__title">{SECTIONS[section]}</h1>
      </div>

      {section === 'studios' ? (
        <StudiosPage joined={joined} />
      ) : count === 0 ? (
        <EmptyState
          icon={<Icon name={section === 'saved' ? 'bookmark' : 'library'} />}
          action={
            <ButtonLink href="/" size="lg">
              Find something to watch
            </ButtonLink>
          }
        >
          {section === 'saved' ? (
            <>
              Nothing saved yet.
              <br />
              Save titles to watch later and they’ll appear here.
            </>
          ) : (
            LIBRARY_EMPTY
          )}
        </EmptyState>
      ) : section === 'access' ? (
        <div className="grid">
          {access.map((p) => (
            <PosterTile key={p.t.id} t={p.t} access={p.ms} grid />
          ))}
        </div>
      ) : (
        <>
          {savedTitles.length > 0 && (
            <div className="grid">
              {savedTitles.map((t) => (
                <PosterTile key={t.id} t={t} />
              ))}
            </div>
          )}
          {savedEpisodes.length > 0 && (
            <div className="episodes__grid lib-saved-eps">
              {savedEpisodes.map((e) => (
                <EpisodeCard key={e.clip.id} ep={e} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* Your studio subscriptions: plan, price and renewal date, with Cancel. Cancelling keeps access
   until the end of the billing cycle and stops the renewal; Resume turns renewal back on. */
const longDate = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/* Studios: your subscriptions on a panel, then studios you could join, each with Access. */
function StudiosPage({ joined }: { joined: [string, Sub][] }) {
  const [joining, setJoining] = useState<string | null>(null)
  const mine = new Set(joined.map(([id]) => id))
  // Subscription studios (private) you haven't joined, biggest catalogue first.
  const recommended = Object.values(studios)
    .filter((s) => !mine.has(s.id) && Object.values(titles).some((t) => t.studioId === s.id && t.access === 'private'))
    .map((s) => {
      const ids = Object.values(titles).filter((t) => t.studioId === s.id && !upcoming(t.id)).map((t) => t.id)
      return { s, ids, n: ids.length }
    })
    // Only studios with something out to watch.
    .filter(({ n }) => n > 0)
    .sort((a, b) => b.n - a.n)
  const from = Math.min(...plans.map((p) => p.price))

  return (
    <>
      <section className="libst">
        <Text variant="h3" as="h2" className="libst__h">
          Your Subscriptions
        </Text>
        {joined.length ? (
          <Surface level={1} pad="none" className="libst__panel">
            <Subscriptions joined={joined} />
          </Surface>
        ) : (
          <Text variant="body" tone="muted" as="p" className="libst__none">
            You haven’t joined any studios yet. Join one to watch everything it makes.
          </Text>
        )}
      </section>

      {recommended.length > 0 && (
        <section className="libst">
          <Text variant="h3" as="h2" className="libst__h">
            You Might Also Like
          </Text>
          <div className="libst__grid">
            {recommended.map(({ s, ids }) => (
              <Surface key={s.id} level={1} pad="none" className="libst__card">
                {/* The studio's artwork with its name on it, then what it makes. */}
                {/* The studio's trailer: first frame at rest, plays muted on hover. */}
                <Link
                  href={`/studio/${s.id}`}
                  className="libst__art"
                  onMouseEnter={(e) => e.currentTarget.querySelector('video')?.play().catch(() => {})}
                  onMouseLeave={(e) => e.currentTarget.querySelector('video')?.pause()}
                >
                  <video src={s.trailer ?? STUDIO_PLACEHOLDER} muted loop playsInline preload="metadata" aria-hidden />
                  <span className="libst__who">
                    <img src={s.logo} alt="" />
                    <strong>{s.name}</strong>
                  </span>
                </Link>
                <div className="libst__posters">
                  {ids.slice(0, 4).map((id) => (
                    <Link key={id} href={`/watch/${id}`} className="libst__poster" aria-label={titles[id].name}>
                      <img src={titles[id].poster} alt="" loading="lazy" />
                    </Link>
                  ))}
                </div>
                <Button block onClick={() => setJoining(s.id)}>
                  Access for {naira(from)}
                </Button>
              </Surface>
            ))}
          </div>
        </section>
      )}

      {joining && <JoinStudio studioId={joining} onClose={() => setJoining(null)} />}
    </>
  )
}

function Subscriptions({ joined }: { joined: [string, Sub][] }) {
  const { toast } = useMenu()
  const [confirm, setConfirm] = useState<string | null>(null)
  const sub = confirm ? joined.find(([id]) => id === confirm)?.[1] : undefined
  return (
    <>
      <List>
        {joined.map(([id, s]) => {
          const plan = plans.find((p) => p.id === s.plan)
          return (
            <ListRow
              key={id}
              leading={<img src={studios[id].logo} alt="" />}
              title={studios[id].name}
              sub={
                s.cancelled
                  ? `Cancelled · Access until ${longDate(s.until)}`
                  : `${planLabel(s.plan)} · ${plan ? `${naira(plan.price)} / ${plan.per}` : ''} · Renews ${longDate(s.until)}`
              }
              action={
                s.cancelled
                  ? {
                      label: 'Resume',
                      onClick: () => {
                        resumeSub(id)
                        toast(`${studios[id].name} will renew on ${longDate(s.until)}`)
                      },
                    }
                  : { label: 'Cancel', onClick: () => setConfirm(id) }
              }
            />
          )
        })}
      </List>
      {confirm && sub && (
        <Dialog title="Cancel subscription?" onClose={() => setConfirm(null)}>
          <Text variant="body" tone="muted" as="p" className="subcancel__text">
            You’ll keep access to everything from {studios[confirm].name} until {longDate(sub.until)}. After that, it won’t renew and you won’t be charged again.
          </Text>
          <div className="subcancel__acts">
            <Button size="lg" block onClick={() => setConfirm(null)}>
              Keep Subscription
            </Button>
            <Button
              size="lg"
              block
              variant="secondary"
              onClick={() => {
                cancelSub(confirm)
                toast(`Cancelled. You have access until ${longDate(sub.until)}`)
                setConfirm(null)
              }}
            >
              Cancel Subscription
            </Button>
          </div>
        </Dialog>
      )}
    </>
  )
}
