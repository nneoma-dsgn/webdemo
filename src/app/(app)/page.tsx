import { Suspense } from 'react'
import Home from '@/views/Home'
import { HomeSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  )
}
