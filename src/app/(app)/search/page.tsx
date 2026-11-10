import { Suspense } from 'react'
import Search from '@/views/Search'
import { GridSkeleton } from '@/components/Skeleton'

export default function Page() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Search />
    </Suspense>
  )
}
