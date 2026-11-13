'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { useMenu } from './Menu'
import { Button, Text } from './ui'

/* Phones: Cast opens a scanner for the QR code any other screen shows under Link device: a TV,
   a computer, a tablet. It reads the code, connects to that screen, then closes. Two things can
   go wrong, each with Try again: the code can't be read (scan failed), or it's read but the
   screen doesn't link (connect failed).
   Prototype: no camera (that needs https and the real pairing service). About one try in four
   ends in each failure; ?cast=noscan, ?cast=fail and ?cast=ok force the outcome. */
const DEMO_SCREENS = ['Samsung Smart TV', 'MacBook Pro · Chrome', 'iPad · Circo app']
const FIND_MS = 2800
const CONNECT_MS = 1200

type Stage = 'scanning' | 'connecting' | 'scan-failed' | 'connect-failed'
type Outcome = 'ok' | 'noscan' | 'fail'

const pick = () => DEMO_SCREENS[Math.floor(Math.random() * DEMO_SCREENS.length)]
function outcome(): Outcome {
  const forced = new URLSearchParams(window.location.search).get('cast')
  if (forced === 'ok' || forced === 'noscan' || forced === 'fail') return forced
  const r = Math.random()
  return r < 0.25 ? 'noscan' : r < 0.5 ? 'fail' : 'ok'
}

const COPY: Record<Stage, (screen: string) => { title: string; hint: string }> = {
  scanning: () => ({ title: 'Scan the QR code on your screen', hint: 'Open Circo on your TV, computer or tablet, choose Link device, then point your camera at the QR code.' }),
  connecting: (screen) => ({ title: `${screen} found`, hint: 'Connecting…' }),
  'scan-failed': () => ({ title: 'Couldn’t scan the QR code', hint: 'Point your camera straight at the QR code and keep it inside the frame.' }),
  'connect-failed': (screen) => ({ title: `Couldn’t connect to ${screen}`, hint: 'Choose Link device again on the other screen and scan the new QR code.' }),
}

export function CastScanner({ onClose }: { onClose: () => void }) {
  const { toast } = useMenu()
  const [stage, setStage] = useState<Stage>('scanning')
  const [screen, setScreen] = useState(pick)
  const [attempt, setAttempt] = useState(0)
  // Each try decides how it'll end when it starts.
  const [result, setResult] = useState<Outcome>(outcome)

  useEffect(() => {
    if (stage !== 'scanning') return
    const find = window.setTimeout(() => setStage(result === 'noscan' ? 'scan-failed' : 'connecting'), FIND_MS)
    return () => window.clearTimeout(find)
  }, [stage, attempt, result])

  useEffect(() => {
    if (stage !== 'connecting') return
    const done = window.setTimeout(() => {
      if (result === 'ok') {
        toast(`Connected to ${screen}`)
        onClose()
      } else setStage('connect-failed')
    }, CONNECT_MS)
    return () => window.clearTimeout(done)
  }, [stage, result, screen, onClose, toast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const retry = () => {
    setScreen(pick())
    setResult(outcome())
    setAttempt((a) => a + 1)
    setStage('scanning')
  }

  const failed = stage === 'scan-failed' || stage === 'connect-failed'
  const { title, hint } = COPY[stage](screen)

  // Rendered on the page body, so no parent's stacking (the top bar, the player) can sit over it.
  return createPortal(
    <div className="scanner" role="dialog" aria-modal="true" aria-label="Scan to cast">
      <button className="scanner__close" onClick={onClose} aria-label="Close">
        <Icon name="close" size={22} weight={2} />
      </button>
      <div className={`scanner__frame scanner__frame--${failed ? 'failed' : stage}`} aria-hidden>
        <span className="scanner__corner scanner__corner--tl" />
        <span className="scanner__corner scanner__corner--tr" />
        <span className="scanner__corner scanner__corner--bl" />
        <span className="scanner__corner scanner__corner--br" />
        {stage === 'scanning' && <span className="scanner__line" />}
        {stage === 'connecting' && <Icon name="check" size={56} weight={2.4} className="scanner__mark" />}
        {failed && <Icon name="alert" size={56} weight={2} className="scanner__mark" />}
      </div>
      <div className="scanner__text" role="status">
        <Text variant="h3" as="h2">
          {title}
        </Text>
        <Text variant="body-sm" tone="secondary" className="scanner__hint">
          {hint}
        </Text>
      </div>
      {failed && (
        <div className="scanner__actions">
          <Button block onClick={retry}>
            Try again
          </Button>
          <Button variant="secondary" block onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>,
    document.body,
  )
}
