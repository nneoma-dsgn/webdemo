import type { ReactNode } from 'react'
import { RequireAuth } from '@/components/Guards'
import { Shell } from '@/components/Shell'
import { HomeSkeleton } from '@/components/Skeleton'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth fallback={<HomeSkeleton />}>
      <Shell>{children}</Shell>
    </RequireAuth>
  )
}
