'use client'

/* Paystack hand-off for loading the balance. The prototype only simulates it: a short wait, then
   success. To integrate, replace the body of payWithPaystack:
     1. Backend: POST /transaction/initialize (amount in kobo, email, reference) and return the
        access code; never put the secret key in the browser.
     2. Browser: open Paystack Inline (PaystackPop) with that access code; map onSuccess,
        onCancel and onError to the results below.
     3. Backend: verify the transaction (and the charge.success webhook) before crediting the
        balance; the balance shown here should come from the server afterwards.
   Prototype: ?pay=declined makes the payment fail, ?pay=timeout makes it hang. */

export type PaystackResult = { status: 'success'; reference: string } | { status: 'failed'; message: string } | { status: 'cancelled' }

const newReference = () => `CIRCO-${Date.now().toString(36).toUpperCase()}`

export function payWithPaystack({ amount, email, signal }: { amount: number; email?: string; signal?: AbortSignal }): Promise<PaystackResult> {
  void amount
  void email
  const flag = new URLSearchParams(location.search).get('pay')
  return new Promise((resolve) => {
    if (flag === 'timeout') return signal?.addEventListener('abort', () => resolve({ status: 'cancelled' }))
    const t = window.setTimeout(
      () => resolve(flag === 'declined' ? { status: 'failed', message: 'Your bank didn’t approve this payment, so nothing was charged.' } : { status: 'success', reference: newReference() }),
      2400,
    )
    signal?.addEventListener('abort', () => {
      window.clearTimeout(t)
      resolve({ status: 'cancelled' })
    })
  })
}
