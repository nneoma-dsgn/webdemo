import type { Viewport } from 'next'
import { SignedOut } from '@/components/Guards'
import Auth from '@/views/Auth'

// Phones: Safari's bars take the sign-in screen's own background, not the app's black.
export const viewport: Viewport = {
  themeColor: [
    { media: '(max-width: 960px)', color: '#141414' },
    { media: '(min-width: 961px)', color: '#040404' },
  ],
}

export default function Page() {
  return (
    <SignedOut>
      <Auth mode="login" />
    </SignedOut>
  )
}
