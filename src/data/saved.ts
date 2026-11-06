'use client'

import { createListStore } from './listStore'
import { titles } from './catalog'

/* Saved for later, shared by every page: card menus, hover preview, home hero, player. */
const store = createListStore('circo:saved')
export const useSaved = store.useList
export const isSaved = store.has
export const toggleSaved = store.toggle

/* Menus are opened by title name; find the id it belongs to (falls back to the name itself). */
export const idForName = (name: string) => Object.values(titles).find((t) => t.name === name)?.id ?? name

export const savedToast = (added: boolean) => (added ? 'Added to Saved for later' : 'Removed from Saved for later')
