'use client'

import { useCallback, useSyncExternalStore } from 'react'

/* A small list of title ids kept in this browser and shared live across every page.
   Used for reminders and Saved for later. */
export function createListStore(key: string) {
  const listeners = new Set<() => void>()
  let ids: string[] = []
  let loaded = false
  const EMPTY: string[] = []

  const load = () => {
    if (loaded) return
    loaded = true
    try {
      ids = JSON.parse(localStorage.getItem(key) ?? '[]')
    } catch {
      ids = []
    }
  }

  const has = (id: string) => {
    load()
    return ids.includes(id)
  }

  // Returns true when the id was just added.
  const toggle = (id: string) => {
    load()
    const on = !ids.includes(id)
    ids = on ? [...ids, id] : ids.filter((x) => x !== id)
    try {
      localStorage.setItem(key, JSON.stringify(ids))
    } catch {}
    listeners.forEach((l) => l())
    return on
  }

  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }

  const snapshot = () => {
    load()
    return ids
  }

  function useList() {
    const list = useSyncExternalStore(subscribe, snapshot, () => EMPTY)
    const hasId = useCallback((id: string) => list.includes(id), [list])
    return { has: hasId, toggle }
  }

  return { has, toggle, useList }
}
