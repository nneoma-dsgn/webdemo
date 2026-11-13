'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSession, signOut, updateSession, type Session } from '../auth'
import { studios, titles } from '../data/catalog'
import { useBlocked, useMuted } from '../data/moderation'
import { Button, Disclosure, EmptyState, List, ListRow, SegmentedControl, SelectField, Tag, Text } from '../components/ui'
import { useMenu } from '../components/Menu'
import { Icon } from '../components/Icon'

/* Account: one place for your profile and money, what you see, the legal bits, help, and
   signing out. Desktop: sections on the left, the chosen one on the right. Phones: the list,
   then the section. */

/* Devices: everywhere you're signed in, most recent first. Prototype: the other devices are
   samples and signing one out lasts until reload; the real list comes from the session
   service. */
type DeviceKind = 'phone' | 'computer' | 'tv'
type Device = { id: string; kind: DeviceKind; name: string; place?: string; at: number }

const HOUR = 36e5
const OTHER_DEVICES: Device[] = [
  { id: 'iphone', kind: 'phone', name: 'Apple iPhone · Circo app', place: 'Lagos, Nigeria', at: Date.now() - 2 * HOUR },
  { id: 'tv', kind: 'tv', name: 'Samsung Smart TV · Circo app', place: 'Lagos, Nigeria', at: Date.now() - 26 * HOUR },
  { id: 'windows', kind: 'computer', name: 'Windows PC · Chrome', place: 'Abuja, Nigeria', at: Date.now() - 3 * 24 * HOUR },
  { id: 'android', kind: 'phone', name: 'Samsung Galaxy · Circo app', place: 'Port Harcourt, Nigeria', at: Date.now() - 9 * 24 * HOUR },
]

// "iPhone · Safari", "Mac · Chrome": the device you're on, as the browser describes itself.
function thisDevice(): Device {
  const ua = navigator.userAgent
  const [kind, os]: [DeviceKind, string] = /iPhone/.test(ua)
    ? ['phone', 'Apple iPhone']
    : /iPad/.test(ua)
      ? ['phone', 'Apple iPad']
      : /Android/.test(ua)
        ? ['phone', 'Android phone']
        : /Macintosh/.test(ua)
          ? ['computer', 'Mac']
          : /Windows/.test(ua)
            ? ['computer', 'Windows PC']
            : ['computer', 'Computer']
  const browser = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /FxiOS|Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Web browser'
  return { id: 'this', kind, name: `${os} · ${browser}`, at: Date.now() }
}

// "Active now", "2 hours ago", "Yesterday", "3 days ago".
function lastActive(at: number) {
  const h = (Date.now() - at) / HOUR
  if (h < 0.1) return 'Active now'
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`
  if (h < 24) return `${Math.floor(h)} hour${Math.floor(h) === 1 ? '' : 's'} ago`
  if (h < 48) return 'Yesterday'
  return `${Math.floor(h / 24)} days ago`
}

type Section = 'account' | 'safety' | 'devices' | 'resources' | 'support'
const SECTIONS: { id: Section; title: string; sub: string; icon: ReactNode }[] = [
  { id: 'account', title: 'Your Account', sub: 'View and update your account information', icon: <Icon name="user" size={22} /> },
  { id: 'safety', title: 'Safety', sub: 'Manage what you see', icon: <Icon name="shield" size={22} /> },
  { id: 'devices', title: 'Devices', sub: 'See and manage where you’re logged in', icon: <Icon name="computer" size={22} /> },
  { id: 'resources', title: 'Resources', sub: 'View our terms, privacy policy, and legal documents', icon: <Icon name="file" size={22} /> },
  { id: 'support', title: 'Get Support', sub: 'Get answers to your questions or report an issue', icon: <Icon name="help" size={22} /> },
]

export default function Account() {
  const router = useRouter()
  const params = useSearchParams()
  const section = (SECTIONS.find((s) => s.id === params.get('s'))?.id ?? null) as Section | null
  const go = (s: Section | null) => {
    const q = new URLSearchParams()
    if (s) q.set('s', s)
    router.replace(`/account${q.size ? `?${q}` : ''}`, { scroll: false })
  }
  // Desktop always shows a section; phones show the list until one is picked.
  const shown: Section = section ?? 'account'

  return (
    <div className="page page--padded acct">
      <div className={`acct__layout${section ? ' has-section' : ''}`}>
        <nav className="acct__nav" aria-label="Account sections">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`acct__item${shown === s.id ? ' is-on' : ''}`} onClick={() => go(s.id)} aria-current={shown === s.id ? 'page' : undefined}>
              <span className="acct__icon">{s.icon}</span>
              <span className="acct__text">
                <strong>{s.title}</strong>
                <span>{s.sub}</span>
              </span>
              <Icon name="chevron-right" size={22} className="acct__chev" />
            </button>
          ))}
          <button
            className="acct__item acct__item--out"
            onClick={() => {
              signOut()
              router.replace('/welcome')
            }}
          >
            <span className="acct__icon">
              <Icon name="logout" size={22} />
            </span>
            <span className="acct__text">
              <strong>Log Out</strong>
            </span>
          </button>
        </nav>

        <section className="acct__panel">
          <button className="acct__back" onClick={() => go(null)}>
            <Icon name="chevron-left" size={22} />
            Account
          </button>
          {shown === 'account' && <YourAccount />}
          {shown === 'safety' && <SafetyPanel />}
          {shown === 'devices' && <Devices />}
          {shown === 'resources' && <Resources />}
          {shown === 'support' && <Support />}
        </section>
      </div>
    </div>
  )
}

const GENDERS = ['Male', 'Female', 'Prefer not to say']

/* Your Account: the details we hold. Email comes from sign-in; gender is yours to set. */
function YourAccount() {
  const { toast } = useMenu()
  const [session, setSession] = useState<Session | null>(null)
  const [editing, setEditing] = useState(false)
  useEffect(() => setSession(getSession()), [])

  const save = (patch: Partial<Session>) => {
    updateSession(patch)
    setSession(getSession())
    toast('Saved')
  }
  const gender = session?.gender ? GENDERS.find((g) => g.toLowerCase().startsWith(session.gender!.toLowerCase().slice(0, 4))) ?? session.gender : ''

  return (
    <>
      <h2 className="acct__h">Your Account</h2>
      <List>
        <ListRow label="Email Address" title={session?.email || 'Not set'} empty={!session?.email} />

        {editing ? (
          <ListRow label="Gender">
            <span className="acct-field__edit">
              <SelectField
                className="acct-field__input"
                autoOpen
                placeholder="Select your gender"
                value={gender}
                options={GENDERS.map((g) => ({ value: g, label: g }))}
                onChange={(v) => {
                  save({ gender: v || undefined })
                  setEditing(false)
                }}
              />
              <div className="acct-field__actions">
                <Button variant="link" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </span>
          </ListRow>
        ) : (
          <ListRow label="Gender" title={gender || 'Not set'} empty={!gender} action={{ label: 'Edit', onClick: () => setEditing(true) }} />
        )}
      </List>
    </>
  )
}

/* Safety: the studios you've muted or blocked, in two tabs, each one easy to undo. */
function SafetyPanel() {
  const { toast } = useMenu()
  const [tab, setTab] = useState<'muted' | 'blocked'>('muted')
  const muted = useMuted()
  const blocked = useBlocked()
  const list = tab === 'muted' ? muted : blocked
  const ids = Object.keys(studios).filter((id) => list.has(id))

  return (
    <>
      {/* Title and switcher stay pinned while the list scrolls. */}
      <div className="acct__sticky">
        <div className="acct__sticky-in">
          <h2 className="acct__h">Safety</h2>
          <SegmentedControl
            className="acct__seg"
            label="Muted or blocked"
            value={tab}
            onChange={(v) => setTab(v as 'muted' | 'blocked')}
            options={[
              { value: 'muted', label: 'Muted' },
              { value: 'blocked', label: 'Blocked' },
            ]}
          />
        </div>
      </div>

      {ids.length ? (
        <List>
          {ids.map((id) => {
            const n = Object.values(titles).filter((t) => t.studioId === id).length
            return (
              <ListRow
                key={id}
                leading={<img src={studios[id].logo} alt="" />}
                title={studios[id].name}
                sub={`${n} title${n === 1 ? '' : 's'}`}
                action={{
                  label: tab === 'muted' ? 'Unmute' : 'Unblock',
                  onClick: () => {
                    list.toggle(id)
                    toast(`${studios[id].name} ${tab === 'muted' ? 'unmuted' : 'unblocked'}`)
                  },
                }}
              />
            )
          })}
        </List>
      ) : (
        <EmptyState
          icon={
            tab === 'muted' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M22 9l-6 6" />
                <path d="M16 9l6 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M4.93 4.93l14.14 14.14" />
              </svg>
            )
          }
        >
          {tab === 'muted' ? (
            <>
              You haven’t muted any studios.
              <br />
              You’ll see less from studios you mute.
            </>
          ) : (
            <>
              You haven’t blocked any studios.
              <br />
              You won’t see anything from studios you block.
            </>
          )}
        </EmptyState>
      )}
    </>
  )
}

/* Devices (after Netflix's Manage Access and Devices): a Disclosure card per device with when it
   was last used. The one you're on is marked and doesn't open (Log Out signs it out); open any
   other for where and exactly when, and Log out. */
function Devices() {
  const { toast } = useMenu()
  const [current, setCurrent] = useState<Device | null>(null)
  const [others, setOthers] = useState(OTHER_DEVICES)
  const [open, setOpen] = useState<string | null>(null)
  useEffect(() => setCurrent(thisDevice()), [])

  const signOutOf = (d: Device) => {
    setOthers((list) => list.filter((x) => x.id !== d.id))
    setOpen(null)
    toast(`Logged out of ${d.name}`)
  }

  return (
    <>
      <h2 className="acct__h">Devices</h2>
      <Text variant="body-sm" tone="muted" className="devices__intro">
        These devices have been logged in to your account recently. Log out of any you don’t recognise.
      </Text>
      <div className="devices">
        {current && <Disclosure leading={<Icon name={current.kind} size={22} />} title={current.name} sub={lastActive(current.at)} trailing={<Tag tone="light">This device</Tag>} />}
        {others.map((d) => (
          <Disclosure key={d.id} leading={<Icon name={d.kind} size={22} />} title={d.name} sub={lastActive(d.at)} open={open === d.id} onToggle={() => setOpen(open === d.id ? null : d.id)}>
            <Text variant="body-sm" tone="muted" className="devices__where">
              <span>{d.place}</span>
              <span>{new Date(d.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </Text>
            <Button variant="secondary" size="sm" onClick={() => signOutOf(d)}>
              Log out
            </Button>
          </Disclosure>
        ))}
      </div>
      {others.length > 1 && (
        <Button
          variant="secondary"
          size="sm"
          className="devices__all"
          onClick={() => {
            setOthers([])
            setOpen(null)
            toast('Logged out of all other devices')
          }}
        >
          Log out of all other devices
        </Button>
      )}
    </>
  )
}

function Resources() {
  const { toast } = useMenu()
  const docs = ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Community Guidelines', 'Refund Policy', 'Licences']
  return (
    <>
      <h2 className="acct__h">Resources</h2>
      <List>
        {docs.map((d) => (
          <ListRow key={d} title={d} onClick={() => toast(`${d} is coming soon`)} />
        ))}
      </List>
    </>
  )
}

function Support() {
  const { toast } = useMenu()
  const items = [
    { t: 'Help centre', s: 'Answers to common questions about passes, balance and playback' },
    { t: 'Report a problem', s: 'Something not working? Tell us what happened' },
    { t: 'Payment issue', s: 'A charge you don’t recognise, or a payment that didn’t go through' },
    { t: 'Contact us', s: 'support@circo.live' },
  ]
  return (
    <>
      <h2 className="acct__h">Get Support</h2>
      <List>
        {items.map((i) => (
          <ListRow key={i.t} title={i.t} sub={i.s} onClick={() => toast(`${i.t} is coming soon`)} />
        ))}
      </List>
    </>
  )
}
