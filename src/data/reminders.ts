'use client'

import { createListStore } from './listStore'

/* Coming-soon reminders, shared by every page (home, studio, player). */
const store = createListStore('circo:reminders')
export const useReminders = store.useList
