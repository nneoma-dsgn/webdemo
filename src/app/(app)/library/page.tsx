import { Suspense } from 'react'
import Library from '@/views/Library'
import { HomeSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Library />
    </Suspense>
  )
}
