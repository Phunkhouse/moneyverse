import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { Card, EmptyState } from '@/ui/kit/index.ts'
import { HomeIcon, ListIcon } from '@/ui/kit/icons.tsx'
import iconButton from '@/ui/kit/IconButton.module.scss'
import { formatDayLong, todayInPrague } from '@/ui/format.ts'
import { cs } from '@/ui/messages.ts'
import { transactionItems } from '../_lib/money.ts'
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
