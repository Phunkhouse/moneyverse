import type { Metadata } from 'next'
import { cs } from '@/ui/messages.ts'
import { AuthPanel } from '../_components/AuthPanel.tsx'
import { AcceptInvite } from './AcceptInvite.tsx'

export const metadata: Metadata = { title: cs.auth.inviteTitle }

export default function InvitePage() {
  return (
    <AuthPanel title={cs.auth.inviteHeading} lead={cs.auth.inviteLead}>
      <AcceptInvite />
    </AuthPanel>
  )
}
