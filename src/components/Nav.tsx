'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { signOut } from '../auth'
import { icons } from '../data/catalog'
import { categories, category } from '../data/explore'
import { useMenu } from './Menu'
import { SegmentedControl } from './ui'
import { NotificationBell } from './Notifications'

/* Desktop and tablet: Netflix/Apple TV style top bar that is transparent over the
   hero and turns solid once the page scrolls. */
export function TopNav() {
  const [solid, setSolid] = useState(false)
  const pathname = usePathname()
  const params = useSearchParams()
  const tab = params.get('tab') ?? 'shows'
  const { toast } = useMenu()

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [pathname])

  const home = pathname === '/'

  return (
    <header className={`topnav${solid ? ' topnav--solid' : ''}`}>
      <Link href="/" className="wordmark" aria-label="Circo home">
        <img src="/assets/logo-circo.png" alt="Circo" width={92} height={35} />
      </Link>
      {/* On the search page the search icon becomes a bar in the middle of the top bar. */}
      {pathname === '/search' ? <NavSearch /> : <SegNav active={home ? tab : pathname.startsWith('/explore/') ? 'explore' : null} />}
      <div className="topnav__right">
        <div className="capsule">
          {pathname !== '/search' && (
            <Link href="/search" className="capsule__btn" aria-label="Search">
              <CapsuleIcon name="search" />
            </Link>
          )}
          <button className="capsule__btn" aria-label="Cast to device" onClick={() => toast('Looking for devices nearby')}>
            <CapsuleIcon name="cast" />
          </button>
          <NotificationBell />
          <span className="capsule__sep" aria-hidden />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}

/* Phones: the floating "Navigation pill" from the mobile design. */
export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="mobilenav" aria-label="Primary">
      <div className="mobilenav__pill">
        <Link href="/" className={`mobilenav__item${pathname === '/' ? ' active' : ''}`} aria-label="Home">
          <img src={icons.house} alt="" width={28} height={28} />
        </Link>
        <Link href="/library" className={`mobilenav__item${pathname === '/library' ? ' active' : ''}`} aria-label="Library">
          <img src={icons.library} alt="" width={28} height={28} />
        </Link>
        <Link href="/search" className={`mobilenav__item${pathname === '/search' ? ' active' : ''}`} aria-label="Search">
          <img src={icons.search} alt="" width={28} height={28} />
        </Link>
      </div>
    </nav>
  )
}

/* Search and cast drawn at the same size, weight and colour (Lucide paths). */
function CapsuleIcon({ name }: { name: 'search' | 'cast' }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === 'search' ? (
        <>
          <circle cx="10.5" cy="10.5" r="7.5" />
          <path d="m21 21-5.2-5.2" />
        </>
      ) : (
        <>
          <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
          <path d="M2 12a9 9 0 0 1 8 8" />
          <path d="M2 16a5 5 0 0 1 4 4" />
          <path d="M2 20h.01" />
        </>
      )}
    </svg>
  )
}

/* Segmented tab switcher: one frosted capsule, with a highlight that glides to the active tab. */
function SegNav({ active }: { active: string | null }) {
  const explore = useExploreTab()
  return (
    <SegmentedControl
      label="Primary"
      value={active}
      options={[
        { value: 'shows', label: 'Shows', href: '/' },
        { value: 'series', label: 'Series', href: '/?tab=series' },
        explore,
      ]}
    />
  )
}

/* Third tab: a dropdown of everything beyond Shows and Series (masterclasses, podcasts and
   more). It reads "More" until you pick one, then that category's name. */
export function useExploreTab() {
  const router = useRouter()
  const pathname = usePathname()
  const { open } = useMenu()
  const current = pathname.startsWith('/explore/') ? category(pathname.split('/')[2]) : undefined
  return {
    value: 'explore',
    label: (
      <span className="seg__more">
        {current?.label ?? 'More'}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    ),
    onSelect: (el: HTMLElement) =>
      open(el, {
        label: 'More to watch',
        align: 'start',
        items: categories.map((c) => ({
          id: c.id,
          label: c.label,
          icon: current?.id === c.id ? ('check' as const) : undefined,
          onSelect: () => router.push(`/explore/${c.id}`),
        })),
      }),
  }
}

function AccountMenu() {
  const router = useRouter()
  const { open, toast } = useMenu()

  const show = (el: HTMLElement) => {
    open(el, {
      label: 'Account',
      items: [
        { id: 'account', label: 'Account', icon: 'user', onSelect: () => router.push('/account') },
        { id: 'library', label: 'Library', icon: 'library', onSelect: () => router.push('/library') },
        { kind: 'separator', id: 's1' },
        {
          id: 'signout',
          label: 'Sign Out',
          icon: 'logout',
          danger: true,
          onSelect: () => {
            signOut()
            router.replace('/welcome')
          },
        },
      ],
    })
  }

  return (
    <div className="account">
      <button className="avatar" aria-label="Account" aria-haspopup="menu" onClick={(e) => show(e.currentTarget)}>
        <img src={icons.avatar} alt="" />
      </button>
    </div>
  )
}

export function BackButton({ label = 'Back' }: { label?: string }) {
  return (
    <button className="back" onClick={() => history.back()} aria-label={label}>
      <img src={icons.chevronLeft} alt="" width={24} height={24} />
    </button>
  )
}

const NAVSEARCH_MS = 520
// Apple-like: quick start, long soft settle.
const NAVSEARCH_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'

/* The search field in the top bar. It grows out of where the search icon sat (just left of the
   capsule) into a centred bar; Cancel folds it back there and leaves. The query lives in the URL
   (?q=), which the search page reads. */
function NavSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const typed = useRef(false)
  const field = useRef<HTMLLabelElement>(null)
  const input = useRef<HTMLInputElement>(null)

  // Follow outside changes to ?q= (a recent search or genre chip tapped on the page).
  const urlQ = params.get('q') ?? ''
  useEffect(() => {
    if (!typed.current) setQ(urlQ)
    typed.current = false
  }, [urlQ])

  const update = (v: string) => {
    typed.current = true
    setQ(v)
    router.replace(v.trim() ? `/search?q=${encodeURIComponent(v)}` : '/search', { scroll: false })
  }

  /* From the icon's spot to the centre. The bar is always full size; only a clip (a 48px
     circle at its right end, where the icon sat) and its position animate, so it stays smooth. */
  const fromIcon = () => {
    const el = field.current
    const capsule = document.querySelector('.topnav .capsule')
    if (!el || !capsule) return null
    const bar = el.getBoundingClientRect()
    const iconRight = capsule.getBoundingClientRect().left + 4
    const dx = iconRight - bar.right
    return [
      { transform: `translateX(-50%) translateX(${dx}px)`, clipPath: `inset(0 0 0 ${bar.width - 48}px round 24px)` },
      { transform: 'translateX(-50%)', clipPath: 'inset(0 0 0 0 round 24px)' },
    ]
  }

  useLayoutEffect(() => {
    const frames = fromIcon()
    input.current?.focus({ preventScroll: true })
    if (!frames) return
    field.current?.animate(frames, { duration: NAVSEARCH_MS, easing: NAVSEARCH_EASE })
  }, [])

  const cancel = () => {
    const frames = fromIcon()
    field.current?.classList.add('is-closing')
    const done = () => {
      if (window.history.length > 1) router.back()
      else router.push('/')
    }
    if (!frames) return done()
    const anim = field.current?.animate([...frames].reverse(), { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' })
    if (anim) anim.onfinish = done
    else done()
  }

  return (
    <form className="navsearch" role="search" onSubmit={(e) => e.preventDefault()}>
      <label ref={field} className="navsearch__field">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={input}
          value={q}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && (q ? update('') : cancel())}
          placeholder="Search for shows, series or studios"
          aria-label="Search"
        />
        <button type="button" className="navsearch__cancel" onClick={cancel}>
          Cancel
        </button>
      </label>
    </form>
  )
}
