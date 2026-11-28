import type { Metadata } from 'next'
import Link from 'next/link'
import { cs } from '@/ui/messages.ts'
import { AuthPanel } from './_components/AuthPanel.tsx'

export const metadata: Metadata = { title: cs.notFound.title }

export default function NotFound() {
  return (
    <AuthPanel title={cs.notFound.title} lead={cs.notFound.body}>
      <Link href="/">{cs.notFound.home}</Link>
    </AuthPanel>
  )
}
