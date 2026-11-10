'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { plans, type Title } from './catalog'

/* What this browser has watched and paid for, kept in localStorage and shared live across
   pages: resume points, 24-hour passes and studio subscriptions. */

export type Progress = { ep?: string; t: number; d: number; at: number }
type Pass = { startedAt: number | null } // the 24 hours start on first play
type Sub = { plan: string; until: number }
export type Quality = 'auto' | '480' | '720' | '1080'
type State = { progress: Record<string, Progress>; passes: Record<string, Pass>; subs: Record<string, Sub>; balance: number; quality: Quality; audioLang: string | null; subLang: string | null }

const KEY = 'circo:viewing'
export const PASS_MS = 24 * 3600 * 1000
const PLAN_MS: Record<string, number> = { week: 7 * 864e5, month: 30 * 864e5, year: 365 * 864e5 }

// Starting balance until accounts are real.
// audioLang null = the title's original; subLang null = subtitles off.
const EMPTY: State = { progress: {}, passes: {}, subs: {}, balance: 20000, quality: 'auto', audioLang: null, subLang: null }
let state: State = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    state = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    state = EMPTY
  }
}

function set(fn: (s: State) => State) {
  load()
  state = fn(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const snapshot = () => {
  load()
  return state
}

export function useViewing() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY)
}

/* Re-render every `ms` so countdowns move. */
export function useClock(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(t)
  }, [ms])
  return now
}

/* --- Resume --- */

export const getProgress = (id: string) => snapshot().progress[id]

export function saveProgress(id: string, p: Omit<Progress, 'at'>) {
  set((s) => ({ ...s, progress: { ...s.progress, [id]: { ...p, at: Date.now() } } }))
}

export function clearProgress(id: string) {
  set((s) => {
    const progress = { ...s.progress }
    delete progress[id]
    return { ...s, progress }
  })
}

/* --- Access --- */

export function buyPass(id: string) {
  set((s) => ({ ...s, passes: { ...s.passes, [id]: { startedAt: null } } }))
}

/* Add another 24 hours on top of whatever is left. */
export function extendPass(id: string) {
  set((s) => {
    const p = s.passes[id]
    if (!p?.startedAt) return s
    const end = Math.max(Date.now(), p.startedAt + PASS_MS)
    return { ...s, passes: { ...s.passes, [id]: { startedAt: end } } }
  })
}

export function startPass(id: string) {
  set((s) => (s.passes[id] && s.passes[id].startedAt === null ? { ...s, passes: { ...s.passes, [id]: { startedAt: Date.now() } } } : s))
}

/* Prototype only: pretend the pass started so it has `ms` left. */
export function fakePassLeft(id: string, ms: number) {
  set((s) => ({ ...s, passes: { ...s.passes, [id]: { startedAt: Date.now() - PASS_MS + ms } } }))
}

export function joinStudio(studioId: string, plan: string) {
  set((s) => ({ ...s, subs: { ...s.subs, [studioId]: { plan, until: Date.now() + (PLAN_MS[plan] ?? PLAN_MS.month) } } }))
}

/* Time left on whatever unlocks this title, in ms. null: no access. Infinity: pass bought but
   not started yet (the clock starts on play). */
export function accessLeft(s: State, t: Title, now = Date.now()): number | null {
  if (t.access === 'free') return Infinity
  const sub = s.subs[t.studioId]
  if (sub && sub.until > now) return sub.until - now
  const pass = s.passes[t.id]
  if (!pass) return null
  if (pass.startedAt === null) return Infinity
  const left = pass.startedAt + PASS_MS - now
  return left > 0 ? left : 0
}

export const planLabel = (id: string) => plans.find((p) => p.id === id)?.label ?? 'Subscription'

/* --- Balance --- */

export const getBalance = () => snapshot().balance

export function topUp(amount: number) {
  set((s) => ({ ...s, balance: s.balance + amount }))
}

export function spend(amount: number) {
  set((s) => ({ ...s, balance: Math.max(0, s.balance - amount) }))
}

/* --- Playback quality (480p is Data saver) --- */

export function setQuality(q: Quality) {
  set((s) => ({ ...s, quality: q }))
}

/* --- Language preferences, applied to any title that offers them --- */

export function setAudioLang(l: string | null) {
  set((s) => ({ ...s, audioLang: l }))
}

export function setSubLang(l: string | null) {
  set((s) => ({ ...s, subLang: l }))
}

