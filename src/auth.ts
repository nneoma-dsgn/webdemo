/* Prototype auth: session and profile kept in browser storage. Swap for the real API later. */
const KEY = 'circo-session'

export type Provider = 'google' | 'apple' | 'device'
export type Session = { provider: Provider; username?: string; gender?: string; interests?: string[]; onboarded: boolean }

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(s: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage blocked: session lasts for this page load only */
  }
}

export function updateSession(patch: Partial<Session>) {
  const s = getSession()
  if (s) saveSession({ ...s, ...patch })
}

export function signOut() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/* Username rules from the Create Username screens. */
export const USERNAME_MIN = 3
export const usernameHasBadChars = (v: string) => /[^A-Za-z0-9]/.test(v)
const TAKEN = ['abel', 'admin', 'circo', 'theweeknd', 'support']
export const usernameTaken = (v: string) => TAKEN.includes(v.toLowerCase())
