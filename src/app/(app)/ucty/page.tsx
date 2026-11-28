import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  accountsWithBalances,
  monthValuesData,
  todayInPrague,
} from '@/app/_lib/money.ts'
import { requireUser } from '@/app/_lib/session.ts'
import {
  Banner,
  Card,
  EmptyState,
  Money,
  Row,
  RowList,
} from '@/ui/kit/index.ts'
import { AccountsIcon } from '@/ui/kit/icons.tsx'
import { cs } from '@/ui/messages.ts'
import { Screen } from '../_shell/Screen.tsx'
import { MonthValuesButton } from '../_values/MonthValues.tsx'
import valueStyles from '../_values/values.module.scss'
import styles from './accounts.module.scss'
import { AddAccount } from './AddAccount.tsx'
import { DISPLAY_GROUPS } from './view.ts'

export const metadata: Metadata = { title: cs.accounts.title }

export default function AccountsPage() {
  return (
    <Screen title={cs.accounts.title} subtitle={cs.accounts.subtitle}>
      <Suspense fallback={<p className={styles.muted}>{cs.common.loading}</p>}>
        <Accounts />
      </Suspense>
    </Screen>
  )
}

type Item = Awaited<ReturnType<typeof accountsWithBalances>>[number]

async function Accounts() {
  const user = await requireUser()
  const [items, values] = await Promise.all([
    accountsWithBalances(user.id),
    monthValuesData(user.id),
  ])
  const today = todayInPrague()
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<AccountsIcon />}
          title={cs.accounts.emptyTitle}
          action={<AddAccount today={today} />}
        >
          {cs.accounts.emptyBody}
        </EmptyState>
      </Card>
    )
  }
  const active = items.filter((i) => !i.account.archived)
  const archived = items.filter((i) => i.account.archived)
  // Net worth counts every account, archived ones too, as the reports do (ADR 0005).
  let assets = 0
  let debts = 0
  let estimated = false
  let missing = false
  for (const { balance } of items) {
    estimated ||= balance.estimated
    if (balance.czk === null) missing ||= balance.minor !== 0
    else if (balance.czk >= 0) assets += balance.czk
    else debts += balance.czk
  }
  return (
    <>
      <div className={styles.toolbar}>
        <AddAccount today={today} />
      </div>
      <Card>
        <div className={styles.summary}>
          <div>
            <div className={styles.eyebrow}>{cs.accounts.netWorth}</div>
            <div className={styles.hero}>
              <Money
                minor={assets + debts}
                currency="CZK"
                tone="debt"
                estimated={estimated}
              />
            </div>
          </div>
          <div>
            <div className={styles.eyebrow}>{cs.accounts.assets}</div>
            <div className={styles.figure}>
              <Money minor={assets} currency="CZK" estimated={estimated} />
            </div>
          </div>
          <div>
            <div className={styles.eyebrow}>{cs.accounts.debts}</div>
            <div className={styles.figure}>
              <Money
                minor={debts}
                currency="CZK"
                tone="debt"
                estimated={estimated}
              />
            </div>
          </div>
        </div>
      </Card>
      {missing && <Banner tone="warn">{cs.money.missingRate}</Banner>}
      <div className={styles.groups}>
        {DISPLAY_GROUPS.map((group) => {
          const list = active.filter((i) =>
            (group.types as readonly string[]).includes(i.account.type),
          )
          if (list.length === 0) return null
          const total = list.reduce((sum, i) => sum + (i.balance.czk ?? 0), 0)
          return (
            <Card
              key={group.key}
              title={cs.accounts.groups[group.key]}
              action={<Money minor={total} currency="CZK" tone="debt" />}
            >
              <AccountRows items={list} />
            </Card>
          )
        })}
      </div>
      {values.accounts.length > 0 && (
        <Card>
          <div className={valueStyles.cta}>
            <div>
              <b>{cs.values.cardTitle}</b>
              <p className={styles.muted}>{cs.values.cardBody}</p>
            </div>
            <MonthValuesButton data={values} />
          </div>
        </Card>
      )}
      {archived.length > 0 && (
        <Card>
          <details className={styles.archived}>
            <summary>
              {cs.common.archived} ({archived.length})
            </summary>
            <AccountRows items={archived} />
          </details>
        </Card>
      )}
    </>
  )
}

function AccountRows({ items }: { items: Item[] }) {
  return (
    <RowList>
      {items.map(({ account, balance }) => (
        <li key={account.id}>
          <Row
            href={`/ucty/${account.id}`}
            title={
              <>
                {account.name}
                {account.currency !== 'CZK' && (
                  <span className={styles.ccy}>{account.currency}</span>
                )}
              </>
            }
            meta={
              <>
                {cs.accounts.types[account.type]}
                {balance.carried && (
                  <>
                    {' · '}
                    <span className={styles.carried}>
                      {cs.accounts.carriedFrom}
                    </span>
                  </>
                )}
              </>
            }
            trail={
              <Money
                minor={balance.minor}
                currency={account.currency}
                tone="debt"
              />
            }
            trailSub={
              account.currency !== 'CZK' && balance.czk !== null ? (
                <>
                  ≈{' '}
                  <Money
                    minor={balance.czk}
                    currency="CZK"
                    estimated={balance.estimated}
                  />
                </>
              ) : undefined
            }
          />
        </li>
      ))}
    </RowList>
  )
}
