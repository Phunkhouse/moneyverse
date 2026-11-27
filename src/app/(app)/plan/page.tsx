import type { Metadata } from 'next'
import { Card, EmptyState, Pill } from '@/ui/kit/index.ts'
import { PlanIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { Screen } from '../_shell/Screen.tsx'

export const metadata: Metadata = { title: cs.plan.title }

// "Coming later" in the MVP (docs/design/README.md#decided): no sample data, no controls.
// Becomes the real screen with budgets (R-14) or the payment calendar (R-15).
export default function PlanPage() {
  return (
    <Screen title={cs.plan.title} subtitle={cs.plan.subtitle}>
      <Card>
        <EmptyState
          icon={<PlanIcon />}
          title={cs.plan.soonTitle}
          action={<Pill tone="accent">{cs.common.comingLater}</Pill>}
        >
          {cs.plan.soonBody}
        </EmptyState>
      </Card>
    </Screen>
  )
}
