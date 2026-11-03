import { RequireOnboarding } from '@/components/Guards'
import Onboarding from '@/views/Onboarding'

export default function Page() {
  return (
    <RequireOnboarding>
      <Onboarding />
    </RequireOnboarding>
  )
}
