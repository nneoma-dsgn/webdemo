'use client'

/* Dev only: React's performance tracks sometimes hand the browser a timestamp from before the
   page loaded (clock drift with the dev server), which throws and shows as a Next.js "Issue".
   Skip just those measurements. Runs when this module loads, before the app renders; it does
   nothing in production. */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && !(window as { __perfGuard?: boolean }).__perfGuard) {
  ;(window as { __perfGuard?: boolean }).__perfGuard = true
  const measure = performance.measure.bind(performance)
  performance.measure = ((...args: Parameters<Performance['measure']>) => {
    try {
      return measure(...args)
    } catch (e) {
      if (e instanceof Error && /negative time stamp/.test(e.message)) return undefined as unknown as PerformanceMeasure
      throw e
    }
  }) as Performance['measure']
}

export function DevPerfGuard() {
  return null
}
