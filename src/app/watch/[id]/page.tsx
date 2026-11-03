import { Suspense } from 'react'
import { RequireAuth } from '@/components/Guards'
import Player from '@/views/Player'

/* Full-screen player: sits outside the (app) shell so there is no top bar or nav. */
export default function Page() {
  return (
    <RequireAuth>
      <Suspense>
        <Player />
      </Suspense>
    </RequireAuth>
  )
}
