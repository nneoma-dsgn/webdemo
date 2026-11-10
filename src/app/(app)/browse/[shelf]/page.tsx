import { Suspense } from 'react'
import Browse from '@/views/Browse'
import { GridSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Browse />
    </Suspense>
  )
}
