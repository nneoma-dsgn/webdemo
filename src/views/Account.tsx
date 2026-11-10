'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { USERNAME_MIN, getSession, signOut, updateSession, usernameHasBadChars, usernameTaken, type Session } from '../auth'
import { icons, studios, titles } from '../data/catalog'
import { useBlocked, useMuted } from '../data/moderation'
import { Button, EmptyState, SegmentedControl, SelectField, TextField } from '../components/ui'
import { useMenu } from '../components/Menu'

/* Account: one place for your profile and money, what you see, the legal bits, help, and
   signing out. Desktop: sections on the left, the chosen one on the right. Phones: the list,
   then the section. */

type Section = 'account' | 'safety' | 'resources' | 'support'
const SECTIONS: { id: Section; title: string; sub: string; icon: ReactNode }[] = [
  { id: 'account', title: 'Your Account', sub: 'View and update your account information', icon: <Icon d={['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z']} /> },
  { id: 'safety', title: 'Safety', sub: 'Manage what you see', icon: <Icon d={['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4']} /> },
  { id: 'resources', title: 'Resources', sub: 'View our terms, privacy policy, and legal documents', icon: <Icon d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6']} /> },
  { id: 'support', title: 'Get Support', sub: 'Get answers to your questions or report an issue', icon: <Icon d={['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01']} /> },
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
              <Icon d={['M9 6l6 6-6 6']} className="acct__chev" />
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
              <Icon d={['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9']} />
            </span>
            <span className="acct__text">
              <strong>Log Out</strong>
            </span>
          </button>
        </nav>

        <section className="acct__panel">
          <button className="acct__back" onClick={() => go(null)}>
            <Icon d={['M15 18l-6-6 6-6']} />
            Account
          </button>
          {shown === 'account' && <YourAccount />}
          {shown === 'safety' && <SafetyPanel />}
          {shown === 'resources' && <Resources />}
          {shown === 'support' && <Support />}
        </section>
      </div>
    </div>
  )
}

const GENDERS = ['Male', 'Female', 'Prefer not to say']

/* Your Account: the details we hold, each editable in place. Username and email come from
   sign-in; WhatsApp, gender and date of birth are yours to add. */
function YourAccount() {
  const { toast } = useMenu()
  const [session, setSession] = useState<Session | null>(null)
  const [editing, setEditing] = useState<null | 'username' | 'gender'>(null)
  const [draft, setDraft] = useState('')
  useEffect(() => setSession(getSession()), [])

  const save = (patch: Partial<Session>, msg?: string) => {
    updateSession(patch)
    setSession(getSession())
    if (msg) toast(msg)
  }
  const edit = (field: 'username') => {
    setDraft(session?.username ?? '')
    setEditing(field)
  }
  /* Username availability: checked a moment after typing stops (spinner on the right), then a
     red line and message if it's taken. Your current username always counts as available. */
  const [checking, setChecking] = useState(false)
  const [taken, setTaken] = useState(false)
  useEffect(() => {
    if (editing !== 'username') return
    const v = draft.trim()
    setTaken(false)
    if (v.length < USERNAME_MIN || usernameHasBadChars(v) || v.toLowerCase() === session?.username?.toLowerCase()) {
      setChecking(false)
      return
    }
    setChecking(true)
    const t = window.setTimeout(() => {
      setTaken(usernameTaken(v))
      setChecking(false)
    }, 700)
    return () => window.clearTimeout(t)
  }, [draft, editing, session?.username])
  const v = draft.trim()
  const usernameError = usernameHasBadChars(v)
    ? 'Your username can only contain letters and numbers.'
    : v.length > 0 && v.length < USERNAME_MIN
      ? `At least ${USERNAME_MIN} characters.`
      : taken
        ? 'This username has been taken.'
        : null

  const commit = () => {
    if (!editing || checking || usernameError || !v) return
    save({ username: v }, 'Saved')
    setEditing(null)
  }
  const gender = session?.gender ? GENDERS.find((g) => g.toLowerCase().startsWith(session.gender!.toLowerCase().slice(0, 4))) ?? session.gender : ''

  const editBtn = (onClick: () => void) => (
    <Button variant="secondary" size="sm" onClick={onClick}>
      Edit
    </Button>
  )
  // Read-only details (from sign-in) are plain text.
  const plain = (label: string, value: string | undefined) => (
    <div className="acct-field">
      <span className="acct-field__label">{label}</span>
      <span className={`acct-field__value${value ? '' : ' is-empty'}`}>{value || 'Not set'}</span>
    </div>
  )

  return (
    <>
      <h2 className="acct__h">Your Account</h2>
      <div className="acct-fields">
        {/* Username: editable. */}
        <div className="acct-field">
          <span className="acct-field__label">Username</span>
          {editing === 'username' ? (
            <form
              className="acct-field__edit"
              onSubmit={(e) => {
                e.preventDefault()
                commit()
              }}
            >
              <TextField
                className="acct-field__input"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
                placeholder="Username"
                aria-label="Username"
                spellCheck={false}
                maxLength={30}
                error={usernameError}
                status={checking ? 'checking' : v && v.toLowerCase() !== session?.username?.toLowerCase() && !usernameError ? 'success' : undefined}
              />
              <div className="acct-field__actions">
                <Button type="submit" size="sm" disabled={checking || !!usernameError || !v}>
                  Save
                </Button>
                <Button variant="link" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <span className="acct-field__value">
              <span>{session?.username ?? 'Not set'}</span>
              {editBtn(() => edit('username'))}
            </span>
          )}
        </div>

        {plain('Email Address', session?.email)}

        {/* Gender: editable. */}
        <div className="acct-field">
          <span className="acct-field__label">Gender</span>
          {editing === 'gender' ? (
            <span className="acct-field__edit">
              <SelectField
                className="acct-field__input"
                autoOpen
                placeholder="Select your gender"
                value={gender}
                options={GENDERS.map((g) => ({ value: g, label: g }))}
                onChange={(v) => {
                  save({ gender: v || undefined }, 'Saved')
                  setEditing(null)
                }}
              />
              <div className="acct-field__actions">
                <Button variant="link" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </span>
          ) : (
            <span className="acct-field__value">
              <span className={gender ? '' : 'is-empty'}>{gender || 'Not set'}</span>
              {editBtn(() => setEditing('gender'))}
            </span>
          )}
        </div>

        {plain('Date of birth', session?.dob ? prettyDate(session.dob) : undefined)}
      </div>
    </>
  )
}

/* "2001-08-18" -> "18th August, 2001", as in the design. */
function prettyDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  const n = d.getDate()
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return `${n}${suffix} ${d.toLocaleDateString('en-GB', { month: 'long' })}, ${d.getFullYear()}`
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
        <div className="acct__list acct__list--plain">
          {ids.map((id) => (
            <div key={id} className="acct__row">
              <img src={studios[id].logo} alt="" className="acct__logo" />
              <div>
                <strong>{studios[id].name}</strong>
                <span>{(() => { const n = Object.values(titles).filter((t) => t.studioId === id).length; return `${n} title${n === 1 ? '' : 's'}` })()}</span>
              </div>
              <button
                className="btn-dark btn-dark--sm"
                onClick={() => {
                  list.toggle(id)
                  toast(`${studios[id].name} ${tab === 'muted' ? 'unmuted' : 'unblocked'}`)
                }}
              >
                {tab === 'muted' ? 'Unmute' : 'Unblock'}
              </button>
            </div>
          ))}
        </div>
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

function Resources() {
  const { toast } = useMenu()
  const docs = ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Community Guidelines', 'Refund Policy', 'Licences']
  return (
    <>
      <h2 className="acct__h">Resources</h2>
      <div className="acct__list">
        {docs.map((d) => (
          <button key={d} className="acct__row acct__row--link" onClick={() => toast(`${d} is coming soon`)}>
            <strong>{d}</strong>
            <Icon d={['M9 6l6 6-6 6']} className="acct__chev" />
          </button>
        ))}
      </div>
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
      <div className="acct__list">
        {items.map((i) => (
          <button key={i.t} className="acct__row acct__row--link" onClick={() => toast(`${i.t} is coming soon`)}>
            <div>
              <strong>{i.t}</strong>
              <span>{i.s}</span>
            </div>
            <Icon d={['M9 6l6 6-6 6']} className="acct__chev" />
          </button>
        ))}
      </div>
    </>
  )
}

function Icon({ d, className }: { d: string[]; className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d.map((x) => (
        <path key={x} d={x} />
      ))}
    </svg>
  )
}
