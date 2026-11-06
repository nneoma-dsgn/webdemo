/* The soft chord and chime that plays as the film unlocks. Synthesised with Web Audio, so there
   is no file to load. Browsers only allow sound after a tap, so primeSound() runs inside the pay
   click and playUnlock() can then sound later, once payment clears. */

let ctx: AudioContext | null = null

export function primeSound() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx ??= new AC()
    void ctx.resume()
  } catch {
    ctx = null
  }
}

export function playUnlock() {
  if (!ctx) return
  const ac = ctx
  const now = ac.currentTime + 0.05

  const master = ac.createGain()
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(0.22, now + 0.9)
  master.gain.setTargetAtTime(0, now + 3.4, 0.9)
  master.connect(ac.destination)

  // Warm the top end, and give the chimes a short tail.
  const warm = ac.createBiquadFilter()
  warm.type = 'lowpass'
  warm.frequency.value = 1800
  warm.connect(master)
  const echo = ac.createDelay()
  echo.delayTime.value = 0.28
  const feedback = ac.createGain()
  feedback.gain.value = 0.35
  echo.connect(feedback)
  feedback.connect(echo)
  echo.connect(warm)

  // Pad: an open D major 9 chord, each note a sine plus a slightly detuned triangle.
  ;[146.83, 220, 369.99, 554.37, 659.25].forEach((f, i) => {
    for (const type of ['sine', 'triangle'] as const) {
      const osc = ac.createOscillator()
      osc.type = type
      osc.frequency.value = f
      osc.detune.value = type === 'triangle' ? 6 : -4
      const g = ac.createGain()
      g.gain.value = (type === 'sine' ? 0.18 : 0.06) / (1 + i * 0.4)
      osc.connect(g)
      g.connect(warm)
      osc.start(now)
      osc.stop(now + 6.5)
    }
  })

  // Chimes: a slow rising A major arpeggio over the pad.
  ;[880, 1108.73, 1318.51, 1760].forEach((f, i) => {
    const t = now + 0.5 + i * 0.32
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f
    const g = ac.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.12, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4)
    osc.connect(g)
    g.connect(warm)
    g.connect(echo)
    osc.start(t)
    osc.stop(t + 2.6)
  })

  window.setTimeout(() => master.disconnect(), 8000)
}
