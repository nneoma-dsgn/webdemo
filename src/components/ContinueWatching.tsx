'use client'

import { useState } from 'react'
import { titleFor } from '../data/catalog'
import { PASS_MS, accessLeft, clearProgress, useViewing } from '../data/viewing'
import { ContinueCard } from './Cards'
import { useMenu } from './Menu'
import { Shelf } from './Shelf'

/* Continue Watching: what you've actually been watching, latest first, each card with its time
   left. `include` narrows it to one feed (Home's Shows or Series, an Explore category); the
   Library shows everything. Removing a card clears its progress. Hidden until you've started
   something. */
export function ContinueWatching({ include = () => true }: { include?: (id: string) => boolean }) {
  const viewing = useViewing()
  const { toast } = useMenu()
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  const rows = Object.entries(viewing.progress)
    .filter(([id]) => include(id) && !removed.has(id) && titleFor(id))
    .sort((a, b) => b[1].at - a[1].at)
    .map(([id, p]) => {
      const t = titleFor(id)!
      const ms = accessLeft(viewing, t)
      // A pass not started yet runs its full length from first play.
      return { t, ep: p.ep, progress: p.d ? p.t / p.d : 0, accessMs: ms === null ? 0 : isFinite(ms) ? ms : PASS_MS }
    })

  return (
    <Shelf title="Continue Watching">
      {rows.map((c) => (
        <ContinueCard
          key={c.t.id}
          t={c.t}
          accessMs={c.accessMs}
          progress={c.progress}
          ep={c.ep}
          onRemove={() => {
            clearProgress(c.t.id)
            setRemoved((r) => new Set(r).add(c.t.id))
            toast(`Removed ${c.t.name} from Continue Watching`)
          }}
        />
      ))}
    </Shelf>
  )
}
