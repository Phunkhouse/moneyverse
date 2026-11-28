import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { Card, EmptyState } from '@/ui/kit/index.ts'
import { HomeIcon } from '@/ui/kit/icons.tsx'
import { formatDayLong, todayInPrague } from '@/ui/format.ts'
import { cs } from '@/ui/messages.ts'
import { requireUser } from '../_lib/session.ts'
import { Screen } from './_shell/Screen.tsx'
import { SignOutButton } from './_shell/SignOutButton.tsx'
import { ThemeSwitch } from './_shell/ThemeSwitch.tsx'
import styles from './page.module.scss'

export default function OverviewPage() {
  return (
    <Screen
      title={cs.overview.title}
      subtitle={
        <Suspense fallback={<span>&nbsp;</span>}>
          <Today />
        </Suspense>
      }
    >
      <Card>
        <EmptyState icon={<HomeIcon />} title={cs.overview.emptyTitle}>
          {cs.overview.emptyBody}
        </EmptyState>
      </Card>
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

async function Account() {
  const user = await requireUser()
  return (
    <div className={styles.account}>
      <p className={styles.muted}>{cs.overview.signedInAs(user.name)}</p>
      <SignOutButton />
    </div>
  )
}
