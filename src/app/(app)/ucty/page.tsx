import type { Metadata } from 'next'
import { Card, EmptyState } from '@/ui/kit/index.ts'
import { AccountsIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { Screen } from '../_shell/Screen.tsx'

export const metadata: Metadata = { title: cs.accounts.title }

// No account data yet; the accounts PR adds requireUser() and the user's accounts here.
export default function AccountsPage() {
  return (
    <Screen title={cs.accounts.title} subtitle={cs.accounts.subtitle}>
      <Card>
        <EmptyState icon={<AccountsIcon />} title={cs.accounts.emptyTitle}>
          {cs.accounts.emptyBody}
        </EmptyState>
      </Card>
    </Screen>
  )
}
