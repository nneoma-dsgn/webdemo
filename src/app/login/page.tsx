import { SignedOut } from '@/components/Guards'
import Auth from '@/views/Auth'

export default function Page() {
  return (
    <SignedOut>
      <Auth mode="login" />
    </SignedOut>
  )
}
