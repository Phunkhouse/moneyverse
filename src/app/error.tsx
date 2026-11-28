'use client'

import { ErrorView } from './_components/ErrorView.tsx'

// Catches errors below the root layout, including the app shell's layout (Czech, R-25).
export default function RootError(props: {
  error: unknown
  retry: () => void
}) {
  return <ErrorView {...props} />
}
