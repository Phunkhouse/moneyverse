import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { todayInPrague, transactionItems } from '@/app/_lib/money.ts'
import { requireUser } from '@/app/_lib/session.ts'
import { Card, EmptyState } from '@/ui/kit/index.ts'
import { BackIcon, ListIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { TransactionList } from '../_quickadd/TransactionList.tsx'
import { Screen } from '../_shell/Screen.tsx'
import styles from '../ucty/accounts.module.scss'

export const metadata: Metadata = { title: cs.transactions.title }

export default function TransactionsPage() {
  return (
    <Screen
      title={cs.transactions.title}
      subtitle={
        <Link href="/" className={styles.back}>
          <BackIcon />
          {cs.overview.title}
        </Link>
      }
    >
      <Suspense fallback={<p className={styles.muted}>{cs.common.loading}</p>}>
        <Transactions />
      </Suspense>
    </Screen>
  )
}

async function Transactions() {
  const user = await requireUser()
  const items = await transactionItems(user.id)
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon={<ListIcon />} title={cs.transactions.title}>
          {cs.transactions.empty}
        </EmptyState>
      </Card>
    )
  }
  return (
    <Card title={cs.transactions.count(items.length)}>
      <TransactionList items={items} today={todayInPrague()} grouped />
    </Card>
  )
}
