import { Suspense } from 'react'
import ExploreAll from '@/views/ExploreAll'
import { GridSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <ExploreAll />
    </Suspense>
  )
}
