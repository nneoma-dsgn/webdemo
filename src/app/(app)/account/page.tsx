import { Suspense } from 'react'
import Account from '@/views/Account'
import { GridSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Account />
    </Suspense>
  )
}
