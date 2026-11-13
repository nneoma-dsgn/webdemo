'use client'

import { Suspense, useEffect, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { AppBanner, MobileNav, TopNav } from './Nav'
import { PreviewProvider } from './Preview'

function ScrollReset() {
  const pathname = usePathname()
  const search = useSearchParams()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

/* Chrome for signed-in pages: top bar, hover previews, phone nav and app banner. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <PreviewProvider>
      <AppBanner />
      <Suspense>
        <ScrollReset />
        <TopNav />
      </Suspense>
      <main>{children}</main>
      <MobileNav />
    </PreviewProvider>
  )
}
