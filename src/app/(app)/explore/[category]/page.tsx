import { Suspense } from 'react'
import Explore from '@/views/Explore'
import { HomeSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Explore />
    </Suspense>
  )
}
