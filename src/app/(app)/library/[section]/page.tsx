import { Suspense } from 'react'
import LibraryAll from '@/views/LibraryAll'
import { GridSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <LibraryAll />
    </Suspense>
  )
}
