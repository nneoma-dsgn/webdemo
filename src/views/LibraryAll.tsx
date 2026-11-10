'use client'

import { useParams } from 'next/navigation'
import { studios } from '../data/catalog'
import { ButtonLink, EmptyState } from '../components/ui'
import { StudioTile } from '../components/Cards'
import { BackButton } from '../components/Nav'
import { PosterTile, leftLabel, useLibrary } from './Library'

/* "See all" behind each Library row (Figma WALLET): the full grid of purchases or saved
   titles, or every studio you've joined. Empty sections get the Library empty state. */

const SECTIONS = {
  purchases: 'Purchases',
  saved: 'Saved for later',
  studios: 'Studios',
} as const

type Section = keyof typeof SECTIONS

export default function LibraryAll() {
  const params = useParams<{ section: string }>()
  const section: Section = params?.section && params.section in SECTIONS ? (params.section as Section) : 'purchases'
  const { now, purchases, savedTitles, joined } = useLibrary()

  const count = section === 'purchases' ? purchases.length : section === 'saved' ? savedTitles.length : joined.length

  return (
    <div className="page page--padded">
      <div className="subhead">
        <BackButton />
        <h1 className="subhead__title">{SECTIONS[section]}</h1>
      </div>

      {count === 0 ? (
        <EmptyState
          icon={<img src="/assets/icon-purchases-empty.svg" alt="" />}
          action={
            <ButtonLink href="/?tab=series" size="lg">
              Explore Series
            </ButtonLink>
          }
        >
          {section === 'saved' ? (
            <>
              Nothing saved yet.
              <br />
              Save titles to watch later and they’ll appear here.
            </>
          ) : section === 'studios' ? (
            <>
              You haven’t joined any studios yet.
              <br />
              Studios you subscribe to will appear here.
            </>
          ) : (
            <>
              You haven’t made any purchases yet.
              <br />
              Unlock Media or Studios and they’ll appear here.
            </>
          )}
        </EmptyState>
      ) : section === 'studios' ? (
        <div className="sstudios__row">
          {joined.map(([id, sub]) => (
            <StudioTile key={id} s={studios[id]} detail={`${leftLabel(sub.until - now)} left`} tone="warning" />
          ))}
        </div>
      ) : (
        <div className="grid">
          {section === 'purchases'
            ? purchases.map((p) => <PosterTile key={p.t.id} t={p.t} tag={leftLabel(p.ms)} />)
            : savedTitles.map((t) => <PosterTile key={t.id} t={t} />)}
        </div>
      )}
    </div>
  )
}
