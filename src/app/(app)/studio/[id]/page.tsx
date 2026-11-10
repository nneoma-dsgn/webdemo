import { Suspense } from 'react'
import Studio from '@/views/Studio'
import { StudioSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<StudioSkeleton />}>
      <Studio />
    </Suspense>
  )
}
