/* Prototype auth: session and profile kept in browser storage. Swap for the real API later. */
const KEY = 'circo-session'

export type Provider = 'google' | 'apple' | 'device'
export type Session = { provider: Provider; name?: string; email?: string; whatsapp?: string; dob?: string; username?: string; gender?: string; interests?: string[]; onboarded: boolean }

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
const TAKEN = ['abel', 'admin', 'circo', 'theweeknd', 'support', 'jonbellion']
export const usernameTaken = (v: string) => TAKEN.includes(v.toLowerCase())

/* The username comes from the name the sign-in provider gives us ("Abel Tesfaye" -> "abeltesfaye"),
   with digits added if it's taken. No name (Apple can hide it, phone sign-in has none): "viewer1234". */
export function usernameFromName(name?: string) {
  const base = (name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20)
  const root = base.length >= USERNAME_MIN ? base : 'viewer'
  if (root !== 'viewer' && !usernameTaken(root)) return root
  return `${root}${Math.floor(1000 + Math.random() * 9000)}`
}

