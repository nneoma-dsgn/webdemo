'use client'

import { STUDIO_PLACEHOLDER, studios, titles } from '../data/catalog'
import { joinStudio } from '../data/viewing'
import { Access } from './Access'
import { useMenu } from './Menu'

/* Join a studio from outside the player: the same access screen the player shows after a
   teaser (plans, payment, failures), over the studio's own trailer playing blurred and muted
   (the film-set placeholder until it uploads one), with ✕ to back out. */
export function JoinStudio({ studioId, onClose }: { studioId: string; onClose: () => void }) {
  const { toast } = useMenu()
  const studio = studios[studioId]
  // Access works from a title; any of the studio's titles shows its plans and catalogue.
  const lead = Object.values(titles).find((t) => t.studioId === studioId)
  if (!studio || !lead) return null
  return (
    <div className="vp-access vp-access--page" role="dialog" aria-label={`Join ${studio.name}`}>
      <video className="vp-access__bg" src={studio.trailer ?? STUDIO_PLACEHOLDER} autoPlay muted loop playsInline aria-hidden />
      <Access
        t={{ ...lead, access: 'private' }}
        studio={studio}
        onPlay={(plan) => {
          joinStudio(studioId, plan ?? 'month')
          toast(`You’ve joined ${studio.name}`)
          onClose()
        }}
      />
      <div className="vp-access__top">
        <button className="vp-access__close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
