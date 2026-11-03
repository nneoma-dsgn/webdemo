import type { ReactNode } from 'react'
import { RequireAuth } from '@/components/Guards'
import { Shell } from '@/components/Shell'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <Shell>{children}</Shell>
    </RequireAuth>
  )
}
