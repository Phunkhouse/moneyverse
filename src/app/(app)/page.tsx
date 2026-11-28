import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { Banner, Card, EmptyState, Money } from '@/ui/kit/index.ts'
import { HomeIcon, ListIcon } from '@/ui/kit/icons.tsx'
import iconButton from '@/ui/kit/IconButton.module.scss'
import { formatDayLong, formatMonthName, todayInPrague } from '@/ui/format.ts'
import { cs } from '@/ui/messages.ts'
import {
  insightsData,
  monthValuesData,
  transactionItems,
} from '../_lib/money.ts'
import { PairedBars } from '@/ui/charts/Chart.tsx'
import { NetWorthHero } from './_insights/NetWorthHero.tsx'
import { MonthValuesButton } from './_values/MonthValues.tsx'
import { requireUser } from '../_lib/session.ts'
import { TransactionList } from './_quickadd/TransactionList.tsx'
import { Screen } from './_shell/Screen.tsx'
import { SignOutButton } from './_shell/SignOutButton.tsx'
import { ThemeSwitch } from './_shell/ThemeSwitch.tsx'
import styles from './page.module.scss'

export default function OverviewPage() {
  return (
    <Screen
      title={cs.overview.title}
      actions={
        <Link
          href="/transakce"
          className={iconButton.iconButton}
          aria-label={cs.transactions.all}
          title={cs.transactions.all}
        >
          <ListIcon />
        </Link>
      }
      subtitle={
        <Suspense fallback={<span>&nbsp;</span>}>
          <Today />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <ValuesReminder />
      </Suspense>
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
      <Suspense fallback={<p className={styles.muted}>{cs.common.loading}</p>}>
        <Recent />
      </Suspense>
      {/* Temporary home for the settings until the Nastavení screen exists. */}
      <Card
        title={cs.overview.settings}
        action={<Link href="/kategorie">{cs.categories.link}</Link>}
      >
        <div className={styles.settings}>
          <ThemeSwitch />
          <Suspense
            fallback={<p className={styles.muted}>{cs.common.loading}</p>}
          >
            <Account />
          </Suspense>
        </div>
      </Card>
    </Screen>
  )
}

async function Today() {
  // The date is per request, not baked into the static shell.
  await connection()
  return <>{formatDayLong(todayInPrague())}</>
}

/** W-5: once the month has turned, last month's investment values are due. */
async function ValuesReminder() {
  const user = await requireUser()
  const data = await monthValuesData(user.id)
  if (data.dueCount === 0) return null
  return (
    <Banner
      action={
        <MonthValuesButton
          data={data}
          label={cs.values.enterShort}
          variant="primary"
          month={data.months[0]}
        />
      }
    >
      {cs.values.due(formatMonthName(data.months[0]), data.dueCount)}
    </Banner>
  )
}

/** Net worth and this month's spending (W-6); nothing until the first account exists. */
async function Dashboard() {
  const user = await requireUser()
  const data = await insightsData(user.id)
  if (data.accounts.length === 0) return null
  const month = data.months.at(-1)!
  const spending = data.comparison[6]
  const spent = data.flows.at(-1)?.spent ?? 0
  return (
    <>
      <NetWorthHero data={data} />
      <Card
        title={cs.charts.spentIn(formatMonthName(month))}
        action={<Link href="/grafy">{cs.charts.seeCharts}</Link>}
      >
        <div className={styles.spent}>
          <span className={styles.figure}>
            <Money minor={spent} currency="CZK" />
          </span>
          {spending.monthsInAverage > 0 && (
            <span className={styles.muted}>
              {cs.charts.average(spending.monthsInAverage)}
            </span>
          )}
        </div>
        {spending.categories.length === 0 ? (
          <p className={styles.muted}>{cs.charts.noSpending}</p>
        ) : (
          <PairedBars
            currency="CZK"
            names={[
              formatMonthName(month),
              cs.charts.average(spending.monthsInAverage),
            ]}
            rows={spending.categories.slice(0, 4).map((c) => ({
              id: c.id,
              label: c.name,
              a: c.total,
              b: c.average,
            }))}
          />
        )}
      </Card>
    </>
  )
}

async function Recent() {
  const user = await requireUser()
  const items = await transactionItems(user.id)
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon={<HomeIcon />} title={cs.overview.emptyTitle}>
          {cs.overview.emptyBody}
        </EmptyState>
      </Card>
    )
  }
  return (
    <Card
      title={cs.transactions.recent}
      action={<Link href="/transakce">{cs.transactions.all}</Link>}
    >
      <TransactionList items={items.slice(0, 8)} today={todayInPrague()} />
    </Card>
  )
}

async function Account() {
  const user = await requireUser()
  return (
    <div className={styles.account}>
      <p className={styles.muted}>{cs.overview.signedInAs(user.name)}</p>
      <SignOutButton />
    </div>
  )
}
