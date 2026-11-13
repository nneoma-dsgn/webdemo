'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ALWAYS, HICCUPS, naira, roll, plans, titles, type Studio, type Title } from '../data/catalog'
import { spend, topUp, useViewing } from '../data/viewing'
import { primeSound } from './unlockSound'
import { Button } from './ui'

/* Shown when a trailer ends. Public studios sell a 24-hour pass for the title; private studios
   sell a subscription to the whole studio. Choose, pay (balance or online), then the player
   runs a short reveal and plays. */

type Stage = 'choose' | 'paying' | 'slow' | 'failed'
type Method = 'wallet' | 'card'
type Failure = 'declined' | 'timeout'

/* What the viewer paid, shown as a receipt once the title opens. */
export type Receipt = { item: string; title: string; amount: number; paidWith: string; topUp?: number; balance?: number; ref: string }

// The card on file that tops up the balance (prototype).
const CARD = 'Visa •••• 4821'
const newRef = () => `CIR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

// Annual against twelve months of Monthly.
const monthly = plans.find((p) => p.id === 'month')!.price
const annualSave = Math.round((1 - plans.find((p) => p.id === 'year')!.price / (monthly * 12)) * 100)

/* onPlay gets the plan id for a studio subscription (null for a 24-hour pass) and the receipt.
   Prototype: ?pay=declined or ?pay=timeout makes the first card charge fail that way. */
export function Access({ t, studio, expired, onPlay }: { t: Title; studio?: Studio; expired?: boolean; onPlay: (plan: string | null, receipt: Receipt) => void }) {
  const isPass = t.access === 'public'
  const [planId, setPlanId] = useState('month')
  const plan = plans.find((p) => p.id === planId)!
  const price = isPass ? t.passPrice : plan.price
  const { balance } = useViewing()
  const short = Math.max(0, price - balance)
  // Top up at least the shortfall, rounded up, with a couple of rounder amounts on offer.
  // Short on balance: load exactly the difference, then it unlocks in the same step.
  const topUpAmt = short
  const [method, setMethod] = useState<Method>(balance >= price ? 'wallet' : 'card')
  const [stage, setStage] = useState<Stage>('choose')
  const [failure, setFailure] = useState<Failure | null>(null)
  const timers = useRef<number[]>([])
  const attempts = useRef(0)
  const payFlag = useSearchParams().get('pay')
  // A URL flag, or now and then a natural failure: mostly declined, sometimes a timeout.
  const [simulate] = useState(() => payFlag ?? ALWAYS[t.id]?.pay ?? (roll(HICCUPS.payFail) ? (roll(0.7) ? 'declined' : 'timeout') : null))

  const clear = () => {
    timers.current.forEach((x) => window.clearTimeout(x))
    timers.current = []
  }
  useEffect(() => clear, [])

  // Card is charged for Pay Online, and for a balance top-up.
  const chargesCard = method === 'card' || short > 0

  const complete = () => {
    const item = isPass ? '24-Hour Access Pass' : `${plan.label} · ${studio?.name ?? 'Studio'}`
    if (method === 'wallet') {
      if (short) topUp(topUpAmt)
      spend(price)
      onPlay(isPass ? null : planId, {
        item,
        title: t.name,
        amount: price,
        paidWith: short ? `Balance, topped up from ${CARD}` : 'Balance',
        topUp: short ? topUpAmt : undefined,
        balance: balance + (short ? topUpAmt : 0) - price,
        ref: newRef(),
      })
    } else onPlay(isPass ? null : planId, { item, title: t.name, amount: price, paidWith: CARD, ref: newRef() })
  }

  const pay = () => {
    primeSound()
    clear()
    setFailure(null)
    setStage('paying')
    const fail = chargesCard && attempts.current === 0 && (simulate === 'declined' || simulate === 'timeout') ? simulate : null
    attempts.current++
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
    if (fail === 'declined')
      at(1800, () => {
        setStage('failed')
        setFailure('declined')
      })
    else if (fail === 'timeout') {
      at(4000, () => setStage('slow'))
      at(10000, () => {
        setStage('failed')
        setFailure('timeout')
      })
    } else at(1400, complete)
  }

  const cancel = () => {
    clear()
    setStage('failed')
    setFailure('timeout')
  }

  const switchMethod = () => {
    setMethod(method === 'wallet' ? 'card' : 'wallet')
    setStage('choose')
    setFailure(null)
  }

  const busy = stage === 'paying' || stage === 'slow'

  const catalog = studio ? Object.values(titles).filter((x) => x.studioId === studio.id) : []
  const studioName = studio?.name ?? 'the Studio'

  return (
    <div className="vp-access__inner">
      <span className={`vp-access__eyebrow${expired ? '' : ' vp-access__eyebrow--desktop'}`}>{expired ? 'Your pass has ended' : isPass ? 'Your video pass' : 'Choose your access'}</span>
      <h2 className="vp-access__title">{expired ? 'Keep Watching' : isPass ? 'Continue Watching' : `Join ${studioName}`}</h2>
      {!isPass && catalog.length > 0 && (
        <p className="vp-access__catalog">
          <span className="vp-access__posters" aria-hidden>
            {catalog.slice(0, 3).map((x) => (
              <img key={x.id} src={x.poster} alt="" />
            ))}
          </span>
          Unlock all <strong>{catalog.length} titles</strong>
        </p>
      )}

      {isPass ? (
        <>
          <div className="vp-access__tickets">
            <Ticket label="24-Hour Access Pass" price={naira(t.passPrice)} per="one-time" selected />
          </div>
        </>
      ) : (
        <>
          <div className="vp-access__tickets vp-access__tickets--plans" role="radiogroup" aria-label="Plans">
            {plans.map((p) => (
              <Ticket
                key={p.id}
                label={p.label}
                price={naira(p.price)}
                per={`/ ${p.per}`}
                badge={p.id === 'year' ? `Best value · Save ${annualSave}%` : undefined}
                selected={p.id === planId}
                onSelect={() => setPlanId(p.id)}
              />
            ))}
          </div>
        </>
      )}

      <div className="vp-access__methods" role="radiogroup" aria-label="Pay with">
        <button role="radio" aria-checked={method === 'wallet'} className={method === 'wallet' ? 'is-on' : ''} disabled={busy} onClick={() => setMethod('wallet')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
          <span>
            <strong>Balance</strong>
            <small className={short ? 'is-short' : ''}>{short ? `${naira(balance)} · Load ${naira(short)}` : `${naira(balance)} available`}</small>
          </span>
        </button>
        <button role="radio" aria-checked={method === 'card'} className={method === 'card' ? 'is-on' : ''} disabled={busy} onClick={() => setMethod('card')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
          <span>
            <strong>Pay Online</strong>
            <small>Card, bank transfer</small>
          </span>
        </button>
      </div>

      {stage === 'failed' && failure && (
        <div className="vp-payfail" role="alert">
          <span className="vp-payfail__icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <div>
            <strong>{failure === 'declined' ? 'Your card was declined' : 'We couldn’t confirm your payment'}</strong>
            <p>
              {failure === 'declined'
                ? 'Your bank didn’t approve this payment, so nothing was charged. Check with your bank, or pay another way.'
                : 'Your bank didn’t respond in time. If money left your account, it comes back within 24 hours. Nothing was unlocked.'}
            </p>
            <Button variant="link" className="vp-payfail__alt" onClick={switchMethod}>
              {method === 'wallet' ? 'Pay online instead' : short ? 'Top up balance instead' : 'Pay from balance instead'}
            </Button>
          </div>
        </div>
      )}

      <Button size="lg" block className="vp-access__cta" onClick={pay} disabled={busy} aria-busy={busy}>
        {busy ? (
          <>
            <span className="vp-access__spin" aria-hidden />
            {stage === 'slow' ? 'Still working' : 'Processing'}
          </>
        ) : stage === 'failed' ? (
          `Try again · ${naira(method === 'wallet' && short ? topUpAmt : price)}`
        ) : method === 'wallet' && short ? (
          `Access for ${naira(price)}`
        ) : isPass ? (
          `Access for ${naira(price)}`
        ) : (
          `Access for ${naira(price)}`
        )}
      </Button>
      {stage === 'slow' ? (
        <p className="vp-access__fine">
          This is taking longer than usual with your bank.{' '}
          <button className="vp-access__link" onClick={cancel}>
            Cancel
          </button>
        </p>
      ) : (
        <p className="vp-access__fine">{isPass ? 'Your 24 hours start when you press play.' : `Cancel anytime. Renews at ${naira(price)} / ${plan.per}.`}</p>
      )}

    </div>
  )
}

/* Ticket-shaped option: label left, price right, notched at the perforation. */
function Ticket({ label, price, per, badge, selected, onSelect }: { label: string; price: string; per: string; badge?: string; selected?: boolean; onSelect?: () => void }) {
  const body = (
    <>
      <i className="ticket__notch ticket__notch--top" aria-hidden />
      <i className="ticket__notch ticket__notch--bottom" aria-hidden />
      {badge && <span className="ticket__badge">{badge}</span>}
      <span className="ticket__label">
        {onSelect && <span className="ticket__radio" aria-hidden />}
        {label}
      </span>
      <span className="ticket__price">
        <strong>{price}</strong>
        <span>{per}</span>
      </span>
    </>
  )
  const cls = `ticket${selected ? ' is-selected' : ''}`
  return onSelect ? (
    <button role="radio" aria-checked={!!selected} className={`${cls} ticket--action`} onClick={onSelect}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

