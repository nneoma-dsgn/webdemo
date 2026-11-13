'use client'

import { useEffect } from 'react'
import { BackButton } from '../components/Nav'
import { NotificationList } from '../components/Notifications'
import { useNotifications } from '../data/notifications'

/* Notifications as a page (phones open it from the bell): the same list as the desktop
   dropdown, under the usual back-and-title header. Opening it clears the bell's dot. */
export default function NotificationsPage() {
  const { markSeen } = useNotifications()
  // Once, on arrival.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => markSeen(), [])

  return (
    <div className="page page--padded notif-page">
      <div className="subhead">
        <BackButton />
        <h1 className="subhead__title">Notifications</h1>
      </div>
      <NotificationList />
    </div>
  )
}
