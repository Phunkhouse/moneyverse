'use client'

import Link from 'next/link'
import { Button } from '@/ui/kit/Button.tsx'
import { cs } from '@/ui/messages.ts'
import { AuthPanel } from './AuthPanel.tsx'

/**
 * The Czech error screen. Server errors reach the browser without their message (Next hides it
 * in production); the digest matches the line in the Vercel logs.
 */
export function ErrorView({
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
    <AuthPanel
      title={cs.error.title}
      lead={cs.error.body}
      foot={digest ? cs.error.code(digest) : undefined}
    >
      <Button size="large" block onClick={retry}>
        {cs.error.retry}
      </Button>
      <Link href="/">{cs.error.home}</Link>
    </AuthPanel>
  )
}
