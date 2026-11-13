'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveSession, type Provider } from '../auth'
import { browseGrid, icons, titles } from '../data/catalog'


/* Web version of the "Worth Seeing" SSO screen. One screen serves Sign Up and Log In:
   new accounts continue to onboarding, returning accounts go straight to Home. */
export default function Auth({ mode }: { mode: 'signup' | 'login' }) {
  const router = useRouter()
  const [busy, setBusy] = useState<Provider | null>(null)
  const [phone, setPhone] = useState(false)
  const [chooser, setChooser] = useState(false)

  // `name` is what the provider shares about the account (Google's chooser gives it here).
  const go = (provider: Provider, name?: string, email?: string) => {
    // Google opens its account chooser first (mocked); the others go straight through.
    if (provider === 'google' && !chooser) return setChooser(true)
    setChooser(false)
    setBusy(provider)
    window.setTimeout(() => {
      if (mode === 'signup') {
        saveSession({ provider, name, email, onboarded: false })
        router.replace('/onboarding')
      } else {
        // Prototype: a returning account that already finished onboarding.
        saveSession({ provider, onboarded: true })
        router.replace('/')
      }
    }, provider === 'google' ? 500 : 1200)
  }

  return (
    <div className="login">
      <PosterWall />
      {chooser && <GoogleChooser onPick={(name, email) => go('google', name, email)} onClose={() => setChooser(false)} />}
      <div className="login__panel">
        <header className="login__head">
          <Link href="/welcome" aria-label="Back to Circo">
            <img className="login__logo" src="/assets/logo-circo.png" alt="Circo" width={92} height={35} />
          </Link>
        </header>

        <div className="login__body">
          {busy ? (
            <div className="busy" role="status" aria-label={`Signing in with ${busy === 'google' ? 'Google' : busy === 'apple' ? 'Apple' : 'your phone'}`}>
              <span className="spin-grad" aria-hidden />
            </div>
          ) : phone ? (
            <PhoneSignIn onBack={() => setPhone(false)} onScanned={() => go('device')} />
          ) : (
            <div className="auth auth--sso">
              <h1 className="auth__hero">Worth Seeing</h1>
              <p className="auth__sub auth__sub--center">{mode === 'signup' ? 'Create your Circo account in a few taps.' : 'Welcome back. Pick up where you left off.'}</p>
              <div className="auth__stack">
                <button className="btn-sso" onClick={() => go('google')}>
                  <img src="/assets/icon-google.svg" alt="" width={16} height={16} />
                  Continue with Google
                </button>
                <button className="btn-sso" onClick={() => go('apple')}>
                  <img src="/assets/icon-apple.svg" alt="" width={21} height={21} />
                  Continue with Apple
                </button>
                {/* Device linking for people already signed in on the phone app. */}
                <button className="btn-ghost btn-ghost--desktop" onClick={() => setPhone(true)}>
                  <img src={icons.cast} alt="" width={20} height={20} />
                  Link device
                </button>
              </div>
              <p className="auth__legal">
                By continuing, you agree to Circo’s <a href="#terms">Terms of Service</a> and confirm that you have read Circo’s <a href="#privacy">Privacy Policy</a>
              </p>
            </div>
          )}
        </div>

        <footer className="login__legal">
          <a href="#help">Help</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </footer>
      </div>
    </div>
  )
}

/* Prototype stand-in for Google's account chooser popup, so the flow can be clicked through.
   Accounts are placeholders; the real flow opens Google's own window. */
const ACCOUNTS = [
  { name: 'Abel Tesfaye', email: 'abel.tesfaye@gmail.com', initial: 'A', color: '#1a73e8' },
  { name: 'Jon Bellion', email: 'jon.bellion@gmail.com', initial: 'J', color: '#188038' },
]

function GoogleChooser({ onPick, onClose }: { onPick: (name: string, email?: string) => void; onClose: () => void }) {
  return (
    <div className="gpop" role="dialog" aria-label="Sign in with Google" onClick={onClose}>
      <div className="gpop__window" onClick={(e) => e.stopPropagation()}>
        <div className="gpop__chrome">
          <span className="gpop__dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="gpop__url">accounts.google.com</span>
        </div>
        <div className="gpop__body">
          <div className="gpop__brand">
            <img src="/assets/icon-google.svg" alt="" width={18} height={18} />
            Sign in with Google
          </div>
          <h2 className="gpop__title">Choose an account</h2>
          <p className="gpop__sub">
            to continue to <strong>Circo</strong>
          </p>
          <ul className="gpop__list">
            {ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button className="gpop__acct" onClick={() => onPick(a.name, a.email)}>
                  <span className="gpop__avatar" style={{ background: a.color }}>
                    {a.initial}
                  </span>
                  <span className="gpop__who">
                    <span>{a.name}</span>
                    <span>{a.email}</span>
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button className="gpop__acct" onClick={() => onPick('')}>
                <span className="gpop__avatar gpop__avatar--add" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                </span>
                <span className="gpop__who">
                  <span>Use another account</span>
                </span>
              </button>
            </li>
          </ul>
          <p className="gpop__legal">To continue, Google will share your name, email address and profile picture with Circo. Before using this app, you can review Circo’s privacy policy and terms of service.</p>
        </div>
        <div className="gpop__foot">
          <span>English (United Kingdom)</span>
          <span>
            <a href="#help">Help</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </span>
        </div>
      </div>
    </div>
  )
}

/* Slowly drifting wall of posters behind the panel, columns moving in opposite directions. */
function PosterWall() {
  const ids = [...browseGrid, ...Object.keys(titles)].filter((v, i, a) => a.indexOf(v) === i)
  const cols = Array.from({ length: 7 }, (_, c) => ids.filter((_, i) => i % 7 === c))
  return (
    <div className="wall" aria-hidden>
      <div className="wall__tilt">
        {cols.map((col, c) => (
          <div key={c} className={`wall__col${c % 2 ? ' wall__col--down' : ''}`} style={{ animationDuration: `${60 + c * 7}s` }}>
            {[...col, ...col, ...col, ...col].map((id, i) => (
              <img key={i} src={titles[id].poster} alt="" loading="lazy" />
            ))}
          </div>
        ))}
      </div>
      <div className="wall__shade" />
    </div>
  )
}

/* TV-style device sign-in (Apple TV / Netflix): scan with the phone app that is already signed in. */
function PhoneSignIn({ onBack, onScanned }: { onBack: () => void; onScanned: () => void }) {
  const code = 'KX4-92P'
  return (
    <div className="auth auth--center">
      <button className="back auth__back" onClick={onBack} aria-label="Back">
        <img src={icons.chevronLeft} alt="" width={24} height={24} />
      </button>
      <h1 className="auth__title auth__title--lg">Sign in with your phone</h1>
      <p className="auth__sub auth__sub--center">Open the Circo app on your phone and scan this code from Profile, then Linked devices.</p>
      {/* Prototype: clicking the code simulates a successful scan. */}
      <button className="qr" onClick={onScanned} title="Prototype: click to simulate a scan" aria-label="QR code">
        <FakeQr seed={code} />
      </button>
      <p className="qr__wait">
        <span className="pulse" aria-hidden />
        Waiting for your phone
      </p>
    </div>
  )
}

/* Decorative stand-in for a real QR code until the device-link API exists. */
function FakeQr({ seed, size = 200 }: { seed: string; size?: number }) {
  const n = 25
  const cells = useMemo(() => {
    let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
    const out: boolean[] = []
    for (let i = 0; i < n * n; i++) {
      h = (h * 1103515245 + 12345) >>> 0
      out.push(((h >>> 16) & 1) === 1)
    }
    return out
  }, [seed])
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      if (inBox(ox, oy)) {
        const dx = x - ox, dy = y - oy
        const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
        return ring || core ? 1 : 0
      }
    }
    return -1
  }
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" aria-hidden>
      <rect width={n} height={n} fill="#fff" />
      {cells.map((on, i) => {
        const x = i % n, y = Math.floor(i / n)
        const f = finder(x, y)
        const fill = f === -1 ? on : f === 1
        return fill ? <rect key={i} x={x} y={y} width="1" height="1" fill="#040404" /> : null
      })}
    </svg>
  )
}

