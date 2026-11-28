'use client'

import './globals.scss'
import { cs } from '@/ui/messages.ts'
import { ErrorView } from './_components/ErrorView.tsx'

// Replaces the root layout when it fails, so it brings its own document (Next 16 global-error).
export default function GlobalError(props: {
  error: unknown
  retry: () => void
}) {
  return (
    <html lang="cs">
      <body>
        <title>{cs.error.title}</title>
        <ErrorView {...props} />
      </body>
    </html>
  )
}
