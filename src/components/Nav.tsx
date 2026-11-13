'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { signOut } from '../auth'
import { icons } from '../data/catalog'
import { categories, category } from '../data/explore'
import { useMenu } from './Menu'
import { ButtonLink, SegmentedControl } from './ui'
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
    // Phones keep only cast and notifications, and only over a hero (Home and Explore), as in the
    // mobile design; the rest of the top bar moves to the bottom pill and the hero's own tabs.
    <header className={`topnav${solid ? ' topnav--solid' : ''}${home || pathname.startsWith('/explore/') ? ' topnav--hero' : ''}`}>
      <Link href="/" className="wordmark" aria-label="Circo home">
        <img src="/assets/logo-circo.png" alt="Circo" width={92} height={35} />
      </Link>
      {/* On the search page the search icon becomes a bar in the middle of the top bar. */}
      {pathname === '/search' ? <NavSearch /> : <SegNav active={home ? tab : pathname.startsWith('/explore/') ? 'explore' : null} />}
      <div className="topnav__right">
        <div className="capsule">
          {pathname !== '/search' && (
            <Link href="/search" className="capsule__btn capsule__btn--search" aria-label="Search">
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

/* Phones: how the page is scrolling, for chrome that steps aside on the way down. `down` is
   true while scrolling down past the first 56px (small jitters ignored) and false again as
   soon as you scroll up; `atTop` is true within the first 24px. */
function usePageScroll() {
  const [state, setState] = useState({ down: false, atTop: true })
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const atTop = y < 24
      if (Math.abs(y - last) < 6) {
        setState((s) => (s.atTop === atTop ? s : { ...s, atTop }))
        return
      }
      setState({ down: y > last && y > 56, atTop })
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return state
}

/* Phones: the floating "Navigation pill" from the mobile design. It shrinks while the page
   scrolls down and comes back to full size as soon as you scroll up. */
export function MobileNav() {
  const pathname = usePathname()
  const { down: compact } = usePageScroll()

  return (
    <nav className={`mobilenav${compact ? ' mobilenav--compact' : ''}`} aria-label="Primary">
      <div className="mobilenav__pill">
        <Link href="/" className={`mobilenav__item${pathname === '/' ? ' active' : ''}`} aria-label="Home">
          <NavIcon name="house" active={pathname === '/'} />
        </Link>
        <Link href="/library" className={`mobilenav__item${pathname === '/library' ? ' active' : ''}`} aria-label="Library">
          <NavIcon name="library" active={pathname === '/library'} />
        </Link>
        <Link href="/search" className={`mobilenav__item${pathname === '/search' ? ' active' : ''}`} aria-label="Search">
          <NavIcon name="search" active={pathname === '/search'} />
        </Link>
        {/* Phones: the profile lives here and goes straight to Account (Library is the plus, and
            Log Out is in Account); the top keeps cast and notifications. */}
        <Link href="/account" className={`mobilenav__item${pathname.startsWith('/account') ? ' active' : ''}`} aria-label="Account">
          <img className="mobilenav__avatar" src={icons.avatar} alt="" width={30} height={30} />
        </Link>
      </div>
    </nav>
  )
}

/* Phones: a "Get the app" bar at the top of signed-in pages and the welcome page (downloads
   and offline viewing are app-only). Clear over a hero at the top of the page; it slides away
   as the page scrolls down and comes back as soon as you scroll up. */
// TODO: point at the App Store / Play Store listings once they're live.
const APP_URL = '#'

export function AppBanner() {
  const { down: hidden, atTop: top } = usePageScroll()

  return (
    <div className={`appbanner${hidden ? ' appbanner--hidden' : ''}${top ? ' appbanner--top' : ''}`}>
      <img src="/assets/logo-circo.png" alt="Circo" width={66} height={25} />
      <ButtonLink href={APP_URL} variant="accent" size="sm" className="appbanner__cta">
        Get the app
      </ButtonLink>
    </div>
  )
}

/* Bottom pill icons (the mobile design's house, add-circle and search), drawn inline so the
   current page's icon can be white and heavier and the rest grey. */
const NAV_PATHS = {
  house: ['M17.5 24.4991V15.1657C17.5 14.8563 17.3771 14.5596 17.1583 14.3408C16.9395 14.122 16.6428 13.9991 16.3333 13.9991H11.6667C11.3572 13.9991 11.0605 14.122 10.8417 14.3408C10.6229 14.5596 10.5 14.8563 10.5 15.1657V24.4991M3.5 11.6663C3.49992 11.3269 3.57389 10.9915 3.71675 10.6836C3.85962 10.3757 4.06793 10.1027 4.32717 9.88363L12.4938 2.88363C12.915 2.52769 13.4486 2.3324 14 2.3324C14.5514 2.3324 15.085 2.52769 15.5062 2.88363L23.6728 9.88363C23.9321 10.1027 24.1404 10.3757 24.2832 10.6836C24.4261 10.9915 24.5001 11.3269 24.5 11.6663V22.1663C24.5 22.7851 24.2542 23.3786 23.8166 23.8162C23.379 24.2538 22.7855 24.4996 22.1667 24.4996H5.83333C5.21449 24.4996 4.621 24.2538 4.18342 23.8162C3.74583 23.3786 3.5 22.7851 3.5 22.1663V11.6663Z'],
  library: ['M9.33333 14H14M14 14H18.6667M14 14V9.33333M14 14V18.6667', 'M14 25.6667C20.4433 25.6667 25.6667 20.4433 25.6667 14C25.6667 7.55668 20.4433 2.33333 14 2.33333C7.55668 2.33333 2.33333 7.55668 2.33333 14C2.33333 20.4433 7.55668 25.6667 14 25.6667Z'],
  search: ['M24.5002 24.5002L19.4369 19.4369M22.1667 12.8333C22.1667 17.988 17.988 22.1667 12.8333 22.1667C7.67868 22.1667 3.5 17.988 3.5 12.8333C3.5 7.67868 7.67868 3.5 12.8333 3.5C17.988 3.5 22.1667 7.67868 22.1667 12.8333Z'],
}

function NavIcon({ name, active }: { name: keyof typeof NAV_PATHS; active: boolean }) {
  return (
    <svg className="mobilenav__icon" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth={active ? 2.6 : 2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {NAV_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/* Search and cast drawn at the same size, weight and colour (Lucide paths). */
function CapsuleIcon({ name }: { name: 'search' | 'cast' }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
        <span className="seg__more-full">{current?.label ?? 'More'}</span>
        <span className="seg__more-short">More</span>
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
  const { open } = useMenu()

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
