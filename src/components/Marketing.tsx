'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ButtonLink } from './ui'

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
    a: 'Continue with Google or Apple and tell us what you like. It takes under a minute and there is no password to remember.',
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
            <ButtonLink href="/signup">Sign Up to watch</ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* The footer from Circo's website (circleandclique.org): logo and line, four link columns
   (folding sections on phones), then the legal line and socials. Links point at the site. */
const SITE = 'https://dev-home.circleandclique.org' // swap for the production address at launch

const FOOTER: { h: string; links: [string, string][] }[] = [
  {
    h: 'Products',
    links: [
      ['Studio', '/products/studio'],
      ['Monetization', '/products/monetization'],
      ['Reach', '/products/reach'],
      ['Video Sense', '/products/video-sense'],
      ['Right ID', '/products/right-id'],
    ],
  },
  {
    h: 'Solutions',
    links: [
      ['Film premieres', '/solutions/film-premieres'],
      ['Streaming businesses', '/solutions/streaming-channel'],
      ['Media businesses', '/solutions/media-business'],
      ['Content libraries', '/solutions/content-catalogue'],
      ['Physical and live events', '/solutions/live-events'],
      ['Pricing', '/pricing'],
    ],
  },
  {
    h: 'Watch',
    links: [
      ['Explore titles', '/explore'],
      ['Open Circo', 'https://app.circo.live'],
      ['Get the app', 'https://circo.onelink.me/gP9j/16kig3qf'],
    ],
  },
  {
    h: 'Resources',
    links: [
      ['Partners', '/partners'],
      ['Circo Accelerate', '/accelerate'],
      ['Estimate your earnings', '/publish/estimate'],
      ['FAQ', '/faq'],
      ['Book a Free Demo', '/demo'],
      ['Contact', '/contact'],
      ['Legal centre', '/legal'],
    ],
  },
]

const SOCIALS = [
  { label: 'Circo on X', href: 'https://x.com/circo_live', d: 'M17.75 3h3.07l-6.71 7.67L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.18-8.2L2 3h6.34l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z' },
  { label: 'Circo on Instagram', href: 'https://www.instagram.com/circo.live_' },
  { label: 'Circo on LinkedIn', href: 'https://www.linkedin.com/company/circo-africa/', d: 'M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96ZM3 9.75h3.96V21H3V9.75Zm6.44 0h3.8v1.54h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V21h-3.96v-5.04c0-1.2-.02-2.75-1.68-2.75-1.68 0-1.94 1.31-1.94 2.66V21H9.44V9.75Z' },
  { label: 'Circo on GitHub', href: 'https://github.com/Circo-Africa', d: 'M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.36 6.84 9.72.5.09.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9l-.01 2.81c0 .27.18.59.69.49A10.22 10.22 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z' },
]

const siteLink = (p: string) => (p.startsWith('http') ? { href: p, target: '_blank', rel: 'noopener noreferrer' } : { href: SITE + p })

function FooterLinks({ links }: { links: [string, string][] }) {
  return (
    <ul>
      {links.map(([label, p]) => (
        <li key={label}>
          <a {...siteLink(p)}>{label}</a>
        </li>
      ))}
    </ul>
  )
}

function Socials({ className }: { className: string }) {
  return (
    <ul className={className}>
      {SOCIALS.map((s) => (
        <li key={s.href}>
          <a href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden>
              {s.d ? (
                <path fill="currentColor" d={s.d} />
              ) : (
                <g fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
                </g>
              )}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <a href={SITE} aria-label="Circo home">
            <img src="/assets/logo-circo.png" alt="Circo" width={92} height={35} />
          </a>
          <p>The publishing, rights and commerce platform for professional video.</p>
        </div>
        {/* Phones: socials up top, then each column folds away. */}
        <Socials className="footer__social footer__social--top" />
        <nav className="footer__fold" aria-label="Footer">
          {FOOTER.map((c) => (
            <details key={c.h}>
              <summary>
                {c.h}
                <svg viewBox="0 0 16 16" aria-hidden>
                  <path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </summary>
              <FooterLinks links={c.links} />
            </details>
          ))}
        </nav>
        <nav className="footer__cols" aria-label="Footer">
          {FOOTER.map((c) => (
            <div key={c.h} className="footer__col">
              <h3>{c.h}</h3>
              <FooterLinks links={c.links} />
            </div>
          ))}
        </nav>
      </div>
      <div className="footer__bottom">
        <p>
          <span>© {new Date().getFullYear()} Circle and Clique Limited · 3229 Greenpoint Ave, New York, NY 11101</span>
          <a href={`${SITE}/legal`}>Cookie settings</a>
        </p>
        <Socials className="footer__social footer__social--bottom" />
      </div>
    </footer>
  )
}
