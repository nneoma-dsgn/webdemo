'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { timeAgo, useNotifications } from '../data/notifications'
import { EmptyState, Text } from './ui'
import { isPhone } from './viewport'

/* The bell in the top bar: a red dot while there's anything new, cleared as soon as the
   notifications are opened. Desktop opens them in a dropdown; phones go to the Notifications
   page. Notifications you haven't opened stay bold; opening one marks it read. */
export function NotificationBell() {
  const n = useNotifications()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="notif" ref={wrap}>
      <button
        className={`capsule__btn${open ? ' active' : ''}`}
        aria-label={n.unseen ? `Notifications, ${n.unseen} new` : 'Notifications'}
        aria-expanded={open}
        onClick={() => {
          if (isPhone()) {
            router.push('/notifications')
            return
          }
          if (!open) n.markSeen()
          setOpen((o) => !o)
        }}
      >
        <BellIcon />
        {n.unseen > 0 && <span className="notif__dot" aria-hidden />}
      </button>

      {open && (
        <div className="dd notif__panel" role="dialog" aria-label="Notifications">
          <div className="notif__head">
            <Text variant="h3" as="h2">
              Notifications
            </Text>
          </div>
          <NotificationList onOpen={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

/* The notifications themselves, or an empty state: the desktop dropdown and the page. */
export function NotificationList({ onOpen }: { onOpen?: () => void }) {
  const n = useNotifications()
  return n.list.length ? (
    <div className="notif__list">
      {n.list.map((x) => (
        <Link
          key={x.id}
          href={x.href}
          className={`notif__item${n.isRead(x.id) ? '' : ' is-unread'}`}
          onClick={() => {
            n.markRead(x.id)
            onOpen?.()
          }}
        >
          <img src={x.art} alt="" />
          <span className="notif__text">
            <strong>{x.text}</strong>
            <span>
              {x.sub ? `${x.sub} · ` : ''}
              {timeAgo(x.at)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  ) : (
    <EmptyState className="notif__empty" icon={<BellIcon weight={1.5} />}>
      No notifications yet.
      <br />
      Tap Notify Me on anything coming soon.
    </EmptyState>
  )
}

function BellIcon({ weight = 2.2 }: { weight?: number }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
