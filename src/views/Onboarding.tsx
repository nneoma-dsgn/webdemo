'use client'

import { CONTENT_CATEGORIES } from '../data/categories'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, updateSession } from '../auth'
import { icons } from '../data/catalog'

type Step = 'gender' | 'interests'
const STEPS: Step[] = ['gender', 'interests']

/* Interests are Circo's categories (data/categories.ts): pick the kinds of thing you watch. */
const TOPICS = CONTENT_CATEGORIES.map((c) => c.label)
const MIN_PICKS = 3
const MAX_PICKS = 5

/* Onboarding after SSO sign up: Select Gender, then Select Interests.
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
  const full = picks.length >= MAX_PICKS
  const ready = picks.length >= MIN_PICKS

  const toggle = (label: string) => setPicks(picks.includes(label) ? picks.filter((p) => p !== label) : full ? picks : [...picks, label])

  return (
    <div className="onb__form onb__form--interests">
      <h1 className="onb__title">Select Interests</h1>
      <p className="onb__sub">What do you like? Select between 3-5</p>


      {/* Categories as pills: a picked pill turns solid white, so the selection reads at a glance. */}
      <div className="pills" role="group" aria-label="Categories">
        {TOPICS.map((label) => {
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

/* Lucide icons (the set used across the Circo designs), one per category. */
const TOPIC_ICONS: Record<string, string[]> = {
  Movie: ['M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z', 'm6.2 5.3 3.1 3.9', 'm12.4 3.4 3.1 4', 'M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z'],
  'Reality Show': ['m17 2-5 5-5-5', 'M4 7h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z'],
  'Micro Drama': ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M12 18h.01'],
  Documentary: ['m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.94a.5.5 0 0 0-.76-.42L16 10.5', 'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'],
  Masterclass: ['M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z', 'M22 10v6', 'M6 12.5V16a6 3 0 0 0 12 0v-3.5'],
  Podcast: ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3'],
  Music: ['M9 18V5l12-2v13', 'M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M18 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  'Education & Tutorial': ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  Religion: ['M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z'],
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

