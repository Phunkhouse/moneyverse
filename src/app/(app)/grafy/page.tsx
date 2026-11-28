import type { Metadata } from 'next'
import { Suspense } from 'react'
import { insightsData } from '@/app/_lib/money.ts'
import { requireUser } from '@/app/_lib/session.ts'
import { Card, EmptyState } from '@/ui/kit/index.ts'
import { ChartsIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { Insights } from '../_insights/Insights.tsx'
import { Screen } from '../_shell/Screen.tsx'

export const metadata: Metadata = { title: cs.charts.title }

export default function ChartsPage() {
  return (
    <Screen title={cs.charts.title} subtitle={cs.charts.subtitle}>
      <Suspense fallback={<p>{cs.common.loading}</p>}>
        <Charts />
      </Suspense>
    </Screen>
  )
}

async function Charts() {
  const user = await requireUser()
  const data = await insightsData(user.id)
  if (data.accounts.length === 0) {
    return (
      <Card>
        <EmptyState icon={<ChartsIcon />} title={cs.charts.emptyTitle}>
          {cs.charts.emptyBody}
        </EmptyState>
      </Card>
    )
  }
  return <Insights data={data} />
}
