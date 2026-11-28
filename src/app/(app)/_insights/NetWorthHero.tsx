'use client'

import type { InsightsData } from '@/app/_lib/money.ts'
import { LineChart } from '@/ui/charts/Chart.tsx'
import { formatMoney, formatMonthLong, formatMonthShort } from '@/ui/format.ts'
import { Card } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import styles from './insights.module.scss'

/** Přehled's gradient card: net worth now, the change against last month, and 12 months (R-10). */
export function NetWorthHero({ data }: { data: InsightsData }) {
  // Always present: insightsData covers at least the current month.
  const now = data.netWorth.at(-1)!
  const before = data.netWorth.at(-2)
  const delta = before ? now.total - before.total : null
  const percent =
    before && before.total !== 0
      ? new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 }).format(
          (Math.abs(delta!) / Math.abs(before.total)) * 100,
        )
      : null
  return (
    <Card hero>
      <div className={styles.heroGrid}>
        <div>
          <span className={styles.eyebrow}>{cs.charts.netWorth}</span>
          <div className={styles.heroNumber}>
            {formatMoney(now.total, 'CZK', { decimals: 'never' })}
          </div>
          {delta !== null && (
            <div className={styles.delta}>
              <b>
                {delta >= 0 ? '▲' : '▼'}{' '}
                {formatMoney(Math.abs(delta), 'CZK', { decimals: 'never' })}
                {percent && ` · ${percent} %`}
              </b>
              <span>{cs.charts.vsLastMonth}</span>
            </div>
          )}
        </div>
        <LineChart
          label={cs.charts.netWorth}
          labels={data.months.map(formatMonthShort)}
          tipLabels={data.months.map(formatMonthLong)}
          currency="CZK"
          height={150}
          onHero
          series={[
            {
              name: cs.charts.netWorth,
              color: 'var(--hero-line)',
              values: data.netWorth.map((m) => m.total),
              area: true,
            },
          ]}
        />
      </div>
    </Card>
  )
}
