'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getSession, type Session } from '@/auth'

/* Prototype auth lives in localStorage, so routing decisions happen on the client after mount.
   Swap for real auth (cookie session + middleware) to make these server-side. */
function useSession() {
  const [state, setState] = useState<{ ready: boolean; session: Session | null }>({ ready: false, session: null })
  const pathname = usePathname()
  useEffect(() => {
    setState({ ready: true, session: getSession() })
  }, [pathname])
  return state
}

/* Signed-in pages: signed-out visitors go to the landing page; half-finished sign-ups resume onboarding. */
export function RequireAuth({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const router = useRouter()
  const { ready, session } = useSession()
  const target = !ready ? null : !session ? '/welcome' : !session.onboarded ? '/onboarding' : null
  useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])
  if (!ready || target) return <>{fallback}</>
  return <>{children}</>
}

/* Signed-out pages bounce signed-in visitors to where they belong. */
export function SignedOut({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { ready, session } = useSession()
  const target = !ready ? null : session ? (session.onboarded ? '/' : '/onboarding') : null
  useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])
  if (!ready || target) return null
  return <>{children}</>
}

/* Onboarding only makes sense mid sign-up. */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { ready, session } = useSession()
  const target = !ready ? null : !session ? '/signup' : session.onboarded ? '/' : null
  useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])
  if (!ready || target) return null
  return <>{children}</>
}
