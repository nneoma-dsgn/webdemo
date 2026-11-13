'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, updateSession } from '../auth'
import { icons } from '../data/catalog'

type Step = 'gender' | 'interests'
// No username step: it's made from the name the sign-in provider gives us.
const STEPS: Step[] = ['gender', 'interests']

/* Topics from the Select Interests screens, plus a few streaming-specific ones for the web. */
const TOPICS = [
  'Entertainment & Gossip',
  'Communities',
  'Food & Cooking',
  'Business & Money',
  'Politics',
  'Movie & Drama',
  'Music',
  'Comedy',
  'Documentaries',
  'Sports',
  'Kids & Family',
  'Tech & Gaming',
]
const MIN_PICKS = 3
const MAX_PICKS = 5

/* Onboarding after SSO sign up: Select Gender, Select Interests (the username comes from SSO).
   Netflix-style chrome: a step counter on every step. Back on step 1 returns to the SSO
   choice, dropping the half-created session so that screen is reachable again. */
export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('gender')
  const [gender, setGender] = useState<string | null>(null)
  const [picks, setPicks] = useState<string[]>([])
  const i = STEPS.indexOf(step)

  const back = () => {
    if (i > 0) return setStep(STEPS[i - 1])
    signOut()
    router.replace('/signup')
  }

  const finish = (interests: string[]) => {
    updateSession({ gender: gender ?? undefined, interests, onboarded: true })
    router.replace('/')
  }

  return (
    <div className={`onb onb--${step}`}>
      <header className="onb__bar">
        <img className="login__logo" src="/assets/logo-circo.png" alt="Circo" width={92} height={35} />
      </header>

      <main className="onb__main">
        <div className="onb__col" key={step}>
          <div className="onb__top">
            <button className="onb__back" onClick={back} aria-label="Back">
              <img src={icons.chevronLeft} alt="" width={24} height={24} />
            </button>
            <span className="onb__count" aria-label={`Step ${i + 1} of ${STEPS.length}`}>
              <span className="onb__count-full">
                Step {i + 1} of {STEPS.length}
              </span>
              <span className="onb__count-short">
                {i + 1}/{STEPS.length}
              </span>
            </span>
            {step === 'interests' && (
              <button className="onb__skip" onClick={() => finish([])}>
                Skip
              </button>
            )}
          </div>

          {step === 'gender' && (
            <GenderStep
              value={gender}
              onPick={(g) => {
                setGender(g)
                window.setTimeout(() => setStep('interests'), 220)
              }}
            />
          )}
          {step === 'interests' && <InterestsStep picks={picks} setPicks={setPicks} onDone={() => finish(picks)} />}
        </div>
      </main>
    </div>
  )
}

const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'none', label: 'Prefer not to say' },
]

function GenderStep({ value, onPick }: { value: string | null; onPick: (g: string) => void }) {
  return (
    <div className="onb__form">
      <h1 className="onb__title">Select Gender</h1>
      <p className="onb__sub">Select the gender that best describes you.</p>
      <div className="genders" role="radiogroup" aria-label="Gender">
        {GENDERS.map((g) => (
          <button key={g.id} role="radio" aria-checked={value === g.id} className={`gender${value === g.id ? ' is-on' : ''}`} onClick={() => onPick(g.id)}>
            <span className="gender__icon">
              <GenderIcon id={g.id} />
            </span>
            <span className="gender__label">{g.label}</span>
            <span className="gender__radio" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  )
}

function InterestsStep({ picks, setPicks, onDone }: { picks: string[]; setPicks: (p: string[]) => void; onDone: () => void }) {
  const [q, setQ] = useState('')
  const full = picks.length >= MAX_PICKS
  const ready = picks.length >= MIN_PICKS

  const shown = useMemo(() => TOPICS.filter((t) => t.toLowerCase().includes(q.trim().toLowerCase())), [q])
  const toggle = (label: string) => setPicks(picks.includes(label) ? picks.filter((p) => p !== label) : full ? picks : [...picks, label])

  return (
    <div className="onb__form onb__form--interests">
      <h1 className="onb__title">Select Interests</h1>
      <p className="onb__sub">What do you like? Select between 3-5</p>

      <label className="pill-search">
        <img src={icons.searchSm} alt="" width={16} height={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search interests" />
        {q && (
          <button type="button" className="pill-search__clear" onClick={() => setQ('')} aria-label="Clear search">
            ×
          </button>
        )}
      </label>

      {/* Topics as pills: a picked pill turns solid white, so the selection reads at a glance. */}
      <div className="pills" role="group" aria-label="Topics">
        {shown.map((label) => {
          const on = picks.includes(label)
          return (
            <button key={label} className={`pick${on ? ' is-on' : ''}`} onClick={() => toggle(label)} disabled={!on && full} aria-pressed={on}>
              <TopicIcon topic={label} />
              <span>{label}</span>
              <span className="pick__mark" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  {on ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 5v14M5 12h14" />}
                </svg>
              </span>
            </button>
          )
        })}
        {!shown.length && <p className="topics__empty">No topics match “{q}”.</p>}
      </div>

      <div className="onb__dock">
        <div className="onb__dock-inner">
          <p className="onb__status">
            <strong>
              {picks.length} of {MAX_PICKS}
            </strong>{' '}
            selected
            <span>{ready ? (full ? ' · You’re all set' : ' · You can continue') : ` · Select at least ${MIN_PICKS}`}</span>
          </p>
          <button className="btn-next" disabled={!ready} onClick={onDone}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}

/* Lucide icons (the set used across the Circo designs), one per topic. */
const TOPIC_ICONS: Record<string, string[]> = {
  'Entertainment & Gossip': ['m17 2-5 5-5-5', 'M4 7h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z'],
  Communities: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  'Food & Cooking': ['M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2', 'M7 2v20', 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'],
  'Business & Money': ['M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', 'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'],
  Politics: ['M3 22h18', 'M6 18v-7', 'M10 18v-7', 'M14 18v-7', 'M18 18v-7', 'm12 2 8 5H4z'],
  'Movie & Drama': ['M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z', 'm6.2 5.3 3.1 3.9', 'm12.4 3.4 3.1 4', 'M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'],
  Music: ['M9 18V5l12-2v13', 'M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M18 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  Comedy: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M8 14s1.5 2 4 2 4-2 4-2', 'M9 9h.01', 'M15 9h.01'],
  Documentaries: ['m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.94a.5.5 0 0 0-.76-.42L16 10.5', 'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'],
  Sports: ['M6 9H4.5a2.5 2.5 0 0 1 0-5H6', 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18', 'M4 22h16', 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22', 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22', 'M18 2H6v7a6 6 0 0 0 12 0V2Z'],
  'Kids & Family': ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  'Tech & Gaming': ['M6 11h4', 'M8 9v4', 'M15 12h.01', 'M18 10h.01', 'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z'],
}

function TopicIcon({ topic }: { topic: string }) {
  const paths = TOPIC_ICONS[topic]
  if (!paths) return null
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

/* Lucide mars / venus / user, drawn in currentColor so they flip with the card. */
function GenderIcon({ id }: { id: string }) {
  const d =
    id === 'male'
      ? ['M16 3h5v5', 'm21 3-6.75 6.75', 'M10 7a7 7 0 1 0 0 14 7 7 0 0 0 0-14z']
      : id === 'female'
        ? ['M12 15v7', 'M9 19h6', 'M12 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14z']
        : ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z']
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d.map((x) => (
        <path key={x} d={x} />
      ))}
    </svg>
  )
}

