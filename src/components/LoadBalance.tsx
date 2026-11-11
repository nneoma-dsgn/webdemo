'use client'

import { useRef, useState } from 'react'
import { getSession } from '../auth'
import { naira } from '../data/catalog'
import { payWithPaystack } from '../data/payments'
import { topUp } from '../data/viewing'
import { useMenu } from './Menu'
import { Button, Dialog, TextField, Text } from './ui'

/* Load Balance: type how much to add, then pay through Paystack. The balance goes up once
   Paystack confirms; failures and cancels leave it untouched and keep the amount. */
const MIN = 500
const MAX = 1_000_000

export function LoadBalance({ onClose }: { onClose: () => void }) {
  const { toast } = useMenu()
  const [raw, setRaw] = useState('')
  const [touched, setTouched] = useState(false)
  const [stage, setStage] = useState<'amount' | 'paying' | 'failed'>('amount')
  const [failure, setFailure] = useState('')
  const abort = useRef<AbortController | null>(null)

  const amount = Number(raw || 0)
  const error = !raw ? null : amount < MIN ? `The minimum is ${naira(MIN)}.` : amount > MAX ? `The most you can load at once is ${naira(MAX)}.` : null
  const valid = !!raw && !error
  const paying = stage === 'paying'

  const pay = async () => {
    if (!valid) return setTouched(true)
    setStage('paying')
    abort.current = new AbortController()
    const r = await payWithPaystack({ amount, email: getSession()?.email, signal: abort.current.signal })
    if (r.status === 'success') {
      topUp(amount)
      toast(`${naira(amount)} added to your balance`)
      onClose()
    } else if (r.status === 'failed') {
      setFailure(r.message)
      setStage('failed')
    } else setStage('amount')
  }

  return (
    <Dialog
      title="Load Balance"
      // Closing mid-payment stops waiting on Paystack; nothing is added unless it confirmed.
      onClose={() => {
        abort.current?.abort()
        onClose()
      }}
      className="loadbal"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          pay()
        }}
      >
        <TextField
          label="Amount"
          inputMode="numeric"
          autoComplete="off"
          placeholder="₦0"
          value={raw ? naira(amount) : ''}
          onChange={(e) => {
            setRaw(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 7))
            if (stage === 'failed') setStage('amount')
          }}
          onBlur={() => setTouched(true)}
          disabled={paying}
          error={touched || amount > MAX ? error : null}
          hint="Load once and unlock anything in one tap."
        />

        {stage === 'failed' && (
          <div className="loadbal__fail" role="alert">
            <Text variant="body-sm" as="strong">
              Payment didn’t go through
            </Text>
            <Text variant="body-sm" tone="muted" as="p">
              {failure}
            </Text>
          </div>
        )}

        <Button type="submit" size="lg" block className="loadbal__cta" disabled={paying || (touched && !valid)} aria-busy={paying}>
          {paying ? (
            <>
              <span className="vp-access__spin" aria-hidden />
              Waiting for Paystack
            </>
          ) : stage === 'failed' ? (
            'Try Again'
          ) : valid ? (
            `Load ${naira(amount)}`
          ) : (
            'Continue'
          )}
        </Button>
        <Text variant="caption" tone="muted" as="p" className="loadbal__fine">
          You’ll pay securely with Paystack. Your balance updates as soon as the payment goes through.
        </Text>
      </form>
    </Dialog>
  )
}
