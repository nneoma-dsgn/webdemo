import { Suspense } from 'react'
import StudioAll from '@/views/StudioAll'
import { GridSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <StudioAll />
    </Suspense>
  )
}
