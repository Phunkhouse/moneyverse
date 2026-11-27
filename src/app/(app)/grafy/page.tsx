import type { Metadata } from 'next'
import { Card, EmptyState } from '@/ui/kit/index.ts'
import { ChartsIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { Screen } from '../_shell/Screen.tsx'

export const metadata: Metadata = { title: cs.charts.title }

// No data yet; the dashboard and charts PR adds requireUser() and the charts here.
export default function ChartsPage() {
  return (
    <Screen title={cs.charts.title} subtitle={cs.charts.subtitle}>
      <Card>
        <EmptyState icon={<ChartsIcon />} title={cs.charts.emptyTitle}>
          {cs.charts.emptyBody}
        </EmptyState>
      </Card>
    </Screen>
  )
}
