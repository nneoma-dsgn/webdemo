'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getSession, signOut } from '../auth'
import { icons } from '../data/catalog'
import { useMenu } from './Menu'

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
      <SegNav active={home ? tab : null} />
      <div className="topnav__right">
        <div className="capsule">
          <Link href="/search" className={`capsule__btn${pathname === '/search' ? ' active' : ''}`} aria-label="Search">
            <CapsuleIcon name="search" />
          </Link>
          <button className="capsule__btn" aria-label="Cast to device" onClick={() => toast('Looking for devices nearby')}>
            <CapsuleIcon name="cast" />
          </button>
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
        {/* Library: kept in the pill, unlinked for now. */}
        <button type="button" className="mobilenav__item" aria-label="Library">
          <img src={icons.library} alt="" width={28} height={28} />
        </button>
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
  const wrap = useRef<HTMLElement>(null)
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector<HTMLElement>('.seg__tab.is-active')
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null)
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [active])

  return (
    <nav className="seg" ref={wrap} aria-label="Primary">
      <span className="seg__pill" aria-hidden style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.w, opacity: 1 } : { opacity: 0 }} />
      <Link href="/" className={`seg__tab${active === 'shows' ? ' is-active' : ''}`}>
        Shows
      </Link>
      <Link href="/?tab=series" className={`seg__tab${active === 'series' ? ' is-active' : ''}`}>
        Series
      </Link>
    </nav>
  )
}

function AccountMenu() {
  const router = useRouter()
  const { open, toast } = useMenu()

  const show = (el: HTMLElement) => {
    const name = getSession()?.username ?? 'you'
    open(el, {
      label: 'Account',
      header: (
        <div className="dd__user">
          <img src={icons.avatar} alt="" />
          <strong>{name}</strong>
        </div>
      ),
      items: [
        // Library, Wallet and Help aren't built yet; they confirm instead of navigating.
        { id: 'library', label: 'Library', icon: 'library', onSelect: () => toast('Library is coming soon') },
        { id: 'wallet', label: 'Wallet', icon: 'wallet', onSelect: () => toast('Wallet is coming soon') },
        { id: 'help', label: 'Get Help', icon: 'help', onSelect: () => toast('Help centre is coming soon') },
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
