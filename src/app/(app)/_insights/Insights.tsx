'use client'

import { useState } from 'react'
import type { InsightsData } from '@/app/_lib/money.ts'
import {
  ColumnChart,
  Legend,
  LineChart,
  PairedBars,
} from '@/ui/charts/Chart.tsx'
import {
  formatMoney,
  formatMonthLong,
  formatMonthName,
  formatMonthShort,
} from '@/ui/format.ts'
import { Banner, Card, Chip, Chips, Segmented } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import styles from './insights.module.scss'

type Range = 6 | 12

/** The Grafy screen: composition, spending, comparison and balances (AC-7, R-10 to R-12). */
export function Insights({ data }: { data: InsightsData }) {
  const [range, setRange] = useState<Range>(12)
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? '')
  const from = Math.max(0, data.months.length - range)
  const months = data.months.slice(from)
  const labels = months.map(formatMonthShort)
  const tipLabels = months.map(formatMonthLong)
  // data.months always holds at least the current month (monthsBetween(from, current) with
  // from <= current), so the `.at(-1)!` below cannot be undefined.
  const nw = data.netWorth.slice(from)
  const flows = data.flows.slice(from)
  const comparison = data.comparison[range]
  const account =
    data.accounts.find((a) => a.id === accountId) ?? data.accounts[0]
  const current = formatMonthName(data.months.at(-1)!)
  // The dashed line averages the earlier months shown here; the per-category comparison uses
  // computeSpending's own window (up to 5 or 11 months from the first transaction). Both are
  // labelled with their month counts, so the two averages may differ without either being wrong.
  const previousSpent = flows.slice(0, -1).map((f) => f.spent)
  const averageSpent = previousSpent.length
    ? Math.round(
        previousSpent.reduce((a, b) => a + b, 0) / previousSpent.length,
      )
    : null
  const saved = flows.reduce((sum, f) => sum + f.income - f.spent, 0)

  return (
    <>
      <div className={styles.toolbar}>
        <Segmented
          label={cs.charts.range}
          value={String(range) as '6' | '12'}
          onChange={(value) => setRange(Number(value) as Range)}
          options={[
            { value: '6', label: cs.charts.months(6) },
            { value: '12', label: cs.charts.months(12) },
          ]}
        />
        {data.months.length < range && (
          <span className={styles.muted}>
            {cs.charts.covers(data.months.length)}
          </span>
        )}
      </div>

      {(nw.some((m) => m.missingRate) || flows.some((f) => f.missingRate)) && (
        <Banner tone="warn">{cs.charts.missingNote}</Banner>
      )}

      <div className={styles.grid}>
        <Card
          className={styles.span}
          title={cs.charts.composition}
          action={
            <span className={styles.figure}>
              {formatMoney(nw.at(-1)!.total, 'CZK', { decimals: 'never' })}
            </span>
          }
        >
          <LineChart
            label={cs.charts.composition}
            labels={labels}
            tipLabels={tipLabels}
            currency="CZK"
            height={200}
            series={[
              {
                name: cs.charts.cash,
                color: 'var(--s1)',
                values: nw.map((m) => m.cash),
                stack: true,
              },
              {
                name: cs.charts.investments,
                color: 'var(--s2)',
                values: nw.map((m) => m.investments),
                stack: true,
              },
              {
                name: cs.charts.netWorthAfterDebt,
                color: 'var(--ink)',
                values: nw.map((m) => m.total),
                dash: true,
              },
            ]}
            extraRows={[
              { name: cs.charts.debt, values: nw.map((m) => m.debt) },
            ]}
          />
          <Legend
            items={[
              { name: cs.charts.cash, color: 'var(--s1)' },
              { name: cs.charts.investments, color: 'var(--s2)' },
              { name: cs.charts.netWorthAfterDebt, dash: true },
            ]}
          />
          <p className={styles.note}>
            {cs.charts.compositionNote}
            {nw.some((m) => m.estimated) && ` ${cs.charts.estimatedNote}`}
          </p>
        </Card>

        <Card title={cs.charts.spendingByMonth}>
          <ColumnChart
            label={cs.charts.spendingByMonth}
            name={cs.charts.spending}
            labels={labels}
            tipLabels={tipLabels}
            currency="CZK"
            values={flows.map((f) => f.spent)}
            reference={
              averageSpent !== null
                ? {
                    value: averageSpent,
                    label: cs.charts.average(previousSpent.length),
                  }
                : undefined
            }
          />
          <p className={styles.note}>{cs.charts.currentMonthNote}</p>
        </Card>

        <Card title={cs.charts.vsAverage(current, comparison.monthsInAverage)}>
          {comparison.categories.length === 0 ? (
            <p className={styles.muted}>{cs.charts.noSpending}</p>
          ) : (
            <>
              <Legend
                items={[
                  { name: current, color: 'var(--s1)' },
                  ...(comparison.monthsInAverage > 0
                    ? [
                        {
                          name: cs.charts.average(comparison.monthsInAverage),
                          color: 'var(--s2)',
                        },
                      ]
                    : []),
                ]}
              />
              <div className={styles.gap} />
              <PairedBars
                currency="CZK"
                names={[current, cs.charts.average(comparison.monthsInAverage)]}
                rows={comparison.categories.map((c) => ({
                  id: c.id,
                  label: c.name,
                  a: c.total,
                  b: c.average,
                }))}
              />
              {comparison.monthsInAverage === 0 && (
                <p className={styles.note}>{cs.charts.noHistory}</p>
              )}
            </>
          )}
        </Card>

        {account && (
          <Card title={cs.charts.balances}>
            <Chips label={cs.charts.balances}>
              {data.accounts.map((a) => (
                <Chip
                  key={a.id}
                  pressed={a.id === account.id}
                  onClick={() => setAccountId(a.id)}
                >
                  {a.name}
                </Chip>
              ))}
            </Chips>
            <div className={styles.gap} />
            <LineChart
              key={account.id}
              label={cs.charts.balanceOf(account.name)}
              labels={labels}
              tipLabels={tipLabels}
              currency={account.currency}
              zero
              series={[
                {
                  name: account.name,
                  color: 'var(--s1)',
                  values: account.balances.slice(from),
                  area: true,
                },
              ]}
            />
          </Card>
        )}

        <Card
          title={cs.charts.incomeVsSpending}
          action={
            <span className={styles.muted}>
              {cs.charts.saved(
                formatMoney(saved, 'CZK', { decimals: 'never' }),
              )}
            </span>
          }
        >
          <LineChart
            label={cs.charts.incomeVsSpending}
            labels={labels}
            tipLabels={tipLabels}
            currency="CZK"
            zero
            series={[
              {
                name: cs.charts.income,
                color: 'var(--s1)',
                values: flows.map((f) => f.income),
              },
              {
                name: cs.charts.spending,
                color: 'var(--s2)',
                values: flows.map((f) => f.spent),
              },
            ]}
          />
          <Legend
            items={[
              { name: cs.charts.income, color: 'var(--s1)' },
              { name: cs.charts.spending, color: 'var(--s2)' },
            ]}
          />
        </Card>
      </div>
    </>
  )
}
