import Link from 'next/link'
import { Card, EmptyState } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import { Screen } from './_shell/Screen.tsx'

/** A missing record inside the app (for example another user's account id): keeps the shell. */
export default function AppNotFound() {
  return (
    <Screen title={cs.notFound.title}>
      <Card>
        <EmptyState
          title={cs.notFound.title}
          action={<Link href="/">{cs.notFound.home}</Link>}
        >
          {cs.notFound.body}
        </EmptyState>
      </Card>
    </Screen>
  )
}
