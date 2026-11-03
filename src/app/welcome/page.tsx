import { SignedOut } from '@/components/Guards'
import Welcome from '@/views/Welcome'

export default function Page() {
  return (
    <SignedOut>
      <Welcome />
    </SignedOut>
  )
}
