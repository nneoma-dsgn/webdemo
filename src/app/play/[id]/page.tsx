import { Suspense } from 'react'
import { RequireAuth } from '@/components/Guards'
import ClipPlayer from '@/views/ClipPlayer'

/* Full-screen player for Explore videos: outside the (app) shell, like /watch. */
export default function Page() {
  return (
    <RequireAuth>
      <Suspense>
        <ClipPlayer />
      </Suspense>
    </RequireAuth>
  )
}
