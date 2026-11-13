'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { comingSoon, featured, mustSee, nollywood, titles } from '../data/catalog'
import { ComingCard, PosterCard } from '../components/Cards'
import { Shelf } from '../components/Shelf'
import { HeroVideo } from '../components/HeroVideo'
import { Theater } from '../components/Theater'
import { Faq, FinalCta, Footer, Reveal } from '../components/Marketing'
import { Button } from '../components/ui'
import { AppBanner } from '../components/Nav'

/* Web version of the signed-out "Circo · Discover" screen (SSO SIGN UP - USER).
   The hero carries the Sign Up / Log In actions, so the header is just the logo. */
export default function Welcome() {
  const router = useRouter()
  const navigate = (to: string) => router.push(to)
  const [solid, setSolid] = useState(false)
  const hero = titles.tribe

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24)
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <div className="page page--home page--welcome">
      <AppBanner />
      <header className={`topnav${solid ? ' topnav--solid' : ''}`}>
        <Link href="/welcome" className="wordmark" aria-label="Circo">
          <img src="/assets/logo-circo.png" alt="Circo" width={92} height={35} />
        </Link>
      </header>

      <section className="hero" aria-label={`Featured: ${hero.name}`}>
        {/* Preview trailer: A Tribe Called Judah official trailer on YouTube.
            15s to 104s skips the production logo and the "in cinemas" end card. */}
        <HeroVideo videoId="pEUZVfeCU94" still={hero.still} start={15} end={104} />
        <div className="hero__scrim" />
        <div className="hero__content">
          <h1 className="hero__title">{hero.name}</h1>
          <p className="hero__blurb">{hero.blurb}</p>
          <div className="hero__actions hero__actions--welcome">
            <Button onClick={() => navigate('/signup')}>Sign Up to watch</Button>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Log In
            </Button>
          </div>
        </div>
      </section>

      <div className="shelves">
        <Reveal>
          <Shelf title={mustSee.title}>
            {mustSee.items.map((id) => (
              <PosterCard key={id} t={titles[id]} to="/signup" menu={false} />
            ))}
          </Shelf>
        </Reveal>

        <Theater items={featured} cta={{ label: 'Watch Now', onClick: () => navigate('/signup') }} />

        <Reveal>
          <Shelf title={nollywood.title}>
            {nollywood.items.map((id) => (
              <PosterCard key={id} t={titles[id]} to="/signup" menu={false} />
            ))}
          </Shelf>
        </Reveal>
        <Reveal>
          <Shelf title="Coming to Circo">
            {comingSoon.map((c) => (
              <ComingCard key={c.id} t={titles[c.id]} when={c.when} label={c.label} reminded={false} onRemind={() => navigate('/signup')} to="/signup" />
            ))}
          </Shelf>
        </Reveal>
      </div>

      <Faq />
      <FinalCta posters={[...nollywood.items, ...mustSee.items].filter((v, i, a) => a.indexOf(v) === i).map((id) => titles[id].poster)} />
      <Footer />
    </div>
  )
}
