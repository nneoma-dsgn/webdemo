'use client'

import { createListStore } from './listStore'

/* Studios you've muted (see less of) or blocked (see none of), from the player's ⋯ menu.
   Managed in Account → Safety. */
const muted = createListStore('circo:muted-studios')
const blocked = createListStore('circo:blocked-studios')

export const useMuted = muted.useList
export const useBlocked = blocked.useList
export const isMuted = muted.has
export const isBlocked = blocked.has
export const toggleMuted = muted.toggle
export const toggleBlocked = blocked.toggle
