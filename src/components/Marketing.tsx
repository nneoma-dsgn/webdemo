'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'

/* Fades and lifts its content in the first time it scrolls into view (Apple TV-style). */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal${shown ? ' is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* Placeholder copy until the website FAQ is supplied. */
const FAQS = [
  {
    q: 'What is Circo?',
    a: 'Circo is a streaming home for Nollywood and the best of international TV and film. Watch shows and series from your favourite studios on your phone, laptop or TV.',
  },
  {
    q: 'How does paying work?',
    a: 'Load your Circo wallet in Naira and unlock what you want to watch: a single show, a full series or a whole studio. Access lasts 24 hours, 7 days, 1 month or 1 year from when you buy, and the time left always shows on the title.',
  },
  {
    q: 'Where can I watch?',
    a: 'On the web at circo.live, on the iOS and Android apps, and on your TV by casting from your phone. Your progress follows you across every screen.',
  },
  {
    q: 'Can I download to watch offline?',
    a: 'Yes. Download eligible titles in the mobile app and watch them anywhere, no data needed. Downloads stay available for as long as your access lasts.',
  },
  {
    q: 'How do I sign up?',
    a: 'Continue with Google or Apple, pick a username and tell us what you like. It takes under a minute and there is no password to remember.',
  },
  {
    q: 'I make films. Can I publish on Circo?',
    a: 'Yes. Creator and studio accounts can upload shows and series, set prices, and see how their titles are doing. Choose Become a creator in the footer to get started.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="faq" aria-labelledby="faq-title">
      <Reveal>
        <h2 id="faq-title" className="mk-title">
          Frequently asked questions
        </h2>
      </Reveal>
      <div className="faq__list">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <Reveal key={f.q} delay={i * 40}>
              <div className={`faq__item${isOpen ? ' is-open' : ''}`}>
                <button className="faq__q" aria-expanded={isOpen} aria-controls={`faq-a-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                  {f.q}
                  <span className="faq__icon" aria-hidden />
                </button>
                <div className="faq__a" id={`faq-a-${i}`} role="region">
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

/* Closing sign-up banner: pitch on the left, a tilted wall of drifting posters on the right. */
export function FinalCta({ posters }: { posters: string[] }) {
  const rows = [posters.filter((_, i) => i % 2 === 0), posters.filter((_, i) => i % 2 === 1)]
  return (
    <section className="cta-wrap">
      <Reveal>
        <div className="cta-banner">
          <div className="cta-banner__art" aria-hidden>
            <div className="cta-banner__tilt">
              {rows.map((row, r) => (
                <div key={r} className={`cta-banner__row${r ? ' cta-banner__row--rev' : ''}`}>
                  {[...row, ...row].map((src, i) => (
                    <img key={i} src={src} alt="" loading="lazy" />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="cta-banner__copy">
            <img src="/assets/logo-circo.png" alt="Circo" width={104} height={40} />
            <h2>Stories worth seeing.</h2>
            <Link href="/signup" className="btn-white">
              Sign Up to watch
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* Placeholder footer until the website version is supplied. */
const FOOTER = [
  { h: 'Circo', links: ['About us', 'Careers', 'Press', 'Contact'] },
  { h: 'Watch', links: ['Ways to watch', 'Devices', 'Downloads', 'Gift cards'] },
  { h: 'Creators', links: ['Become a creator', 'Studio tools', 'Affiliates', 'Brand partners'] },
  { h: 'Help', links: ['Help centre', 'Account', 'Wallet & payments', 'Report a problem'] },
]

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <img src="/assets/logo-circo.png" alt="Circo" width={92} height={35} />
          <p>Worth seeing. Nollywood and the world, in one place.</p>
        </div>
        <nav className="footer__cols" aria-label="Footer">
          {FOOTER.map((c) => (
            <div key={c.h} className="footer__col">
              <h3>{c.h}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l}>
                    <a href={`#${l.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Circo. All rights reserved.</span>
        <div className="footer__legal">
          <a href="#terms">Terms of Service</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#cookies">Cookie preferences</a>
        </div>
        <span className="footer__locale">English · Nigeria</span>
      </div>
    </footer>
  )
}
