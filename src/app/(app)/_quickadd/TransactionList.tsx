'use client'

import type { TransactionItem } from '@/app/_lib/money.ts'
import { formatDayShort, type IsoDate } from '@/ui/format.ts'
import { Glyph, Money, Row, RowList } from '@/ui/kit/index.ts'
import { cs } from '@/ui/messages.ts'
import { useQuickAdd } from './QuickAddProvider.tsx'
import styles from './transactions.module.scss'

type Props = {
  items: TransactionItem[]
  today: string
  /** Group by day with a heading and the day's spending (the full list). */
  grouped?: boolean
  /** On an account's page: a transfer shows as money in or out of this account. */
  accountId?: string
}

function dayLabel(day: string, today: string) {
  if (day === today) return cs.transactions.today
  const yesterday = new Date(`${today}T00:00:00Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  if (day === yesterday.toISOString().slice(0, 10))
    return cs.transactions.yesterday
  return formatDayShort(day as IsoDate)
}

/** Transactions, newest first; a tap opens the edit sheet (AC-3). */
export function TransactionList({
  items,
  today,
  grouped = false,
  accountId,
}: Props) {
  if (!grouped) {
    return (
      <RowList>
        {items.map((item) => (
          <li key={item.id}>
            <TransactionRow
              item={item}
              today={today}
              accountId={accountId}
              withDay
            />
          </li>
        ))}
      </RowList>
    )
  }
  const days: { day: string; items: TransactionItem[]; spent: number }[] = []
  for (const item of items) {
    let group = days.at(-1)
    if (!group || group.day !== item.date) {
      group = { day: item.date, items: [], spent: 0 }
      days.push(group)
    }
    group.items.push(item)
    if (item.kind === 'expense') group.spent += item.czk ?? 0
  }
  return (
    <div className={styles.days}>
      {days.map((group) => (
        <section key={group.day} aria-label={dayLabel(group.day, today)}>
          <h2 className={styles.dayhead}>
            <span>{dayLabel(group.day, today)}</span>
            {group.spent > 0 && <Money minor={-group.spent} currency="CZK" />}
          </h2>
          <RowList>
            {group.items.map((item) => (
              <li key={item.id}>
                <TransactionRow
                  item={item}
                  today={today}
                  accountId={accountId}
                />
              </li>
            ))}
          </RowList>
        </section>
      ))}
    </div>
  )
}

function TransactionRow({
  item,
  today,
  accountId,
  withDay = false,
}: {
  item: TransactionItem
  today: string
  accountId?: string
  withDay?: boolean
}) {
  const { data, open } = useQuickAdd()
  const isTransfer = item.kind === 'transfer'
  const title =
    item.what ||
    (isTransfer ? cs.transactions.transfer : (item.categoryName ?? ''))
  const meta = [
    isTransfer
      ? `${item.accountName} → ${item.toAccountName}`
      : `${item.categoryName} · ${item.accountName}`,
    item.note,
    withDay ? dayLabel(item.date, today) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  // On the target account's page, an incoming transfer shows what arrived there.
  const incoming =
    isTransfer && accountId !== undefined && item.toAccountId === accountId
  const minor = incoming
    ? (item.toAmountMinor ?? item.amountMinor)
    : item.amountMinor
  const currency = incoming ? (item.toCurrency ?? item.currency) : item.currency
  const signed =
    item.kind === 'income' || incoming
      ? minor
      : item.kind === 'expense' || (isTransfer && accountId === item.accountId)
        ? -minor
        : minor
  return (
    <Row
      lead={
        isTransfer ? (
          <Glyph name="⇄" seed="transfer" />
        ) : (
          <Glyph name={item.categoryName ?? '?'} seed={item.categoryId ?? ''} />
        )
      }
      title={title}
      meta={meta}
      trail={
        <Money
          minor={signed}
          currency={currency}
          // Expenses in ink with a minus, income in green (prototype); debts are red elsewhere.
          tone={signed > 0 ? 'signed' : 'plain'}
          signed={signed > 0}
        />
      }
      trailSub={
        item.currency !== 'CZK' && !isTransfer && item.czk !== null ? (
          <>
            ≈{' '}
            <Money minor={item.czk} currency="CZK" estimated={item.estimated} />
          </>
        ) : undefined
      }
      onClick={data ? () => open(item) : undefined}
    />
  )
}
