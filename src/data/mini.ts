'use client'

import { useSyncExternalStore } from 'react'

/* The floating mini player (picture-in-picture inside Circo). One at a time, app-wide. */
export type Mini = { id: string; ep?: string; videoId: string; t: number; title: string; sub?: string }

let mini: Mini | null = null
const listeners = new Set<() => void>()

export function openMini(m: Mini) {
  mini = m
  listeners.forEach((l) => l())
}

export function closeMini() {
  mini = null
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export const useMini = () =>
  useSyncExternalStore(
    subscribe,
    () => mini,
    () => null,
  )
