import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import {
  accountsWithBalances,
  monthValuesData,
  todayInPrague,
  transactionItems,
  valueHistory,
} from '@/app/_lib/money.ts'
import { requireUser } from '@/app/_lib/session.ts'
import { Card, Money, Pill } from '@/ui/kit/index.ts'
import { BackIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { Screen } from '../../_shell/Screen.tsx'
import styles from '../accounts.module.scss'
import { openingForForm } from '../view.ts'
import { TransactionList } from '../../_quickadd/TransactionList.tsx'
import { MonthValuesButton } from '../../_values/MonthValues.tsx'
import valueStyles from '../../_values/values.module.scss'
import { formatMonthName } from '@/ui/format.ts'
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
  // Only the signed-in user's rows are loaded, so another user's id is simply not found.
  const [all, items, values, history] = await Promise.all([
    accountsWithBalances(user.id),
    transactionItems(user.id, { accountId: id }),
    monthValuesData(user.id),
    valueHistory(user.id, id),
  ])
  const item = all.find((i) => i.account.id === id)
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
      {valueTracked ? (
        <Card
          title={cs.values.history}
          action={
            <MonthValuesButton data={values} label={cs.values.enterShort} />
          }
        >
          <div className={valueStyles.history}>
            {history.map((month) => (
              <div key={month.month} className={valueStyles.row}>
                <span>{formatMonthName(month.month)}</span>
                <span
                  className={month.carried ? valueStyles.carried : undefined}
                >
                  <Money minor={month.minor} currency={account.currency} />
                  {month.carried && ` · ${cs.values.carriedMark}`}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card title={cs.accounts.transactionsTitle}>
          {items.length === 0 ? (
            <p className={styles.muted}>{cs.accounts.noTransactions}</p>
          ) : (
            <TransactionList
              items={items}
              today={todayInPrague()}
              accountId={account.id}
              grouped
            />
          )}
        </Card>
      )}
    </>
  )
}
