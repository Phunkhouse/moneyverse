import type { Metadata } from 'next'
import { cs } from '@/ui/messages.ts'
import { AuthPanel } from '../_components/AuthPanel.tsx'
import { SignIn } from './SignIn.tsx'

export const metadata: Metadata = { title: cs.auth.signInTitle }

export default function SignInPage() {
  return (
    <AuthPanel
      title={cs.auth.signInTitle}
      lead={cs.auth.signInLead}
      foot={cs.auth.inviteOnly}
    >
      <SignIn />
    </AuthPanel>
  )
}
