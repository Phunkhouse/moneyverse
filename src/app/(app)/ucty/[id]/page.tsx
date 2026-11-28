import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { accountsWithBalances, todayInPrague } from '@/app/_lib/money.ts'
import { requireUser } from '@/app/_lib/session.ts'
import { Card, EmptyState, Money, Pill } from '@/ui/kit/index.ts'
import { BackIcon, ListIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { Screen } from '../../_shell/Screen.tsx'
import styles from '../accounts.module.scss'
import { openingForForm } from '../view.ts'
import { AccountActions } from './AccountActions.tsx'

export const metadata: Metadata = { title: cs.accounts.detailTitle }

const VALUE_TRACKED = new Set([
  'brokerage',
  'crypto',
  'managed_fund',
  'retirement',
])

export default function AccountPage({ params }: PageProps<'/ucty/[id]'>) {
  return (
    <Screen
      title={cs.accounts.title}
      subtitle={
        <Link href="/ucty" className={styles.back}>
          <BackIcon />
          {cs.accounts.back}
        </Link>
      }
    >
      <Suspense fallback={<p className={styles.muted}>{cs.common.loading}</p>}>
        <AccountDetail params={params} />
      </Suspense>
    </Screen>
  )
}

async function AccountDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  // Only the signed-in user's accounts are loaded, so another user's id is simply not found.
  const item = (await accountsWithBalances(user.id)).find(
    (i) => i.account.id === id,
  )
  if (!item) notFound()
  const { account, balance } = item
  const valueTracked = VALUE_TRACKED.has(account.type)
  return (
    <>
      <Card>
        <div className={styles.detail}>
          <div className={styles.eyebrow}>
            {cs.accounts.types[account.type]} · {account.currency}
            {account.archived && (
              <>
                {' '}
                <Pill>{cs.common.archived}</Pill>
              </>
            )}
          </div>
          <h2 className={styles.hero}>{account.name}</h2>
          <div className={styles.big}>
            <Money
              minor={balance.minor}
              currency={account.currency}
              tone="debt"
            />
          </div>
          <p className={styles.muted}>
            {valueTracked ? cs.accounts.value : cs.accounts.balance}
            {balance.carried && ` · ${cs.accounts.carriedFrom}`}
            {account.currency !== 'CZK' && balance.czk !== null && (
              <>
                {' · ≈ '}
                <Money
                  minor={balance.czk}
                  currency="CZK"
                  estimated={balance.estimated}
                />
              </>
            )}
          </p>
          {account.archived && (
            <p className={styles.muted}>{cs.accounts.archivedNote}</p>
          )}
          <AccountActions
            today={todayInPrague()}
            account={{
              id: account.id,
              name: account.name,
              type: account.type,
              currency: account.currency,
              opening: openingForForm(
                account.type,
                account.openingBalanceMinor,
              ),
              openedOn: account.openedOn,
              archived: account.archived,
            }}
          />
        </div>
      </Card>
      <Card>
        <EmptyState
          icon={<ListIcon />}
          title={
            valueTracked
              ? cs.accounts.valuesTitle
              : cs.accounts.transactionsTitle
          }
        >
          {valueTracked ? cs.accounts.valueTracked : cs.accounts.noTransactions}
        </EmptyState>
      </Card>
    </>
  )
}
