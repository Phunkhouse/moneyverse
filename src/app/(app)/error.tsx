'use client'

import Link from 'next/link'
import { Button, Card, EmptyState } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import { Screen } from './_shell/Screen.tsx'

// A failing screen inside the app keeps the navigation, so the other tabs stay usable.
export default function AppError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  const digest =
    error instanceof Error &&
    'digest' in error &&
    typeof error.digest === 'string'
      ? error.digest
      : null
  return (
    <Screen title={cs.error.title}>
      <Card>
        <EmptyState
          title={cs.error.title}
          action={
            <>
              <Button onClick={retry}>{cs.error.retry}</Button>
              <Link href="/">{cs.error.home}</Link>
            </>
          }
        >
          {cs.error.body}
          {digest && (
            <>
              <br />
              {cs.error.code(digest)}
            </>
          )}
        </EmptyState>
      </Card>
    </Screen>
  )
}
