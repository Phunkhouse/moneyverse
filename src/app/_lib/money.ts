import 'server-only'
import { todayInPrague, monthOf } from '@/server/money/calendar.ts'
import {
  listAccounts,
  listCategories,
  listTransactions,
} from '@/server/money/ledger.ts'
import { loadRateBook } from '@/server/money/rates.ts'
import { convertToCzk, monthEndBalances } from '@/server/money/reports.ts'
import {
  categoryScores,
  lastUsedAccountId,
  newestFirst,
} from '@/server/money/usage.ts'
import { getDb } from './db.ts'

/**
 * Every account of the user with today's balance in its own currency and in CZK. The caller has
 * already called requireUser(); `userId` comes from it, never from the request.
 */
export async function accountsWithBalances(userId: string) {
  const today = todayInPrague()
  const month = monthOf(today)
  const series = await monthEndBalances(getDb(), userId, {
    from: month,
    to: month,
    today,
  })
  return series.map(({ account, months }) => ({
    account,
    // Accounts opened later than today have no balance yet; show their opening balance.
    balance: months[0] ?? {
      month,
      minor: account.openingBalanceMinor,
      czk: null,
      carried: false,
      estimated: false,
    },
  }))
}

export async function categoriesOf(userId: string) {
  return listCategories(getDb(), userId)
}

export { todayInPrague }

// ---- Quick add and the transaction list ----

export type QuickAddData = {
  today: string
  accounts: {
    id: string
    name: string
    currency: 'CZK' | 'EUR' | 'USD'
    valueTracked: boolean
  }[]
  /** Active categories, most used and recent first. */
  categories: { id: string; kind: 'expense' | 'income'; name: string }[]
  lastAccountId: string | null
}

const VALUE_TRACKED_TYPES = new Set([
  'brokerage',
  'crypto',
  'managed_fund',
  'retirement',
])

export async function quickAddData(userId: string): Promise<QuickAddData> {
  const db = getDb()
  const [accounts, categories, transactions] = await Promise.all([
    listAccounts(db, userId),
    listCategories(db, userId),
    listTransactions(db, userId),
  ])
  const scores = categoryScores(transactions)
  return {
    today: todayInPrague(),
    accounts: accounts
      .filter((a) => !a.archived)
      .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
      .map((a) => ({
        id: a.id,
        name: a.name,
        currency: a.currency,
        valueTracked: VALUE_TRACKED_TYPES.has(a.type),
      })),
    categories: categories
      .filter((c) => !c.archived)
      .sort(
        (a, b) =>
          (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) ||
          a.name.localeCompare(b.name, 'cs'),
      )
      .map((c) => ({ id: c.id, kind: c.kind, name: c.name })),
    lastAccountId: lastUsedAccountId(transactions),
  }
}

export type TransactionItem = {
  id: string
  kind: 'expense' | 'income' | 'transfer'
  date: string
  amountMinor: number
  currency: 'CZK' | 'EUR' | 'USD'
  accountId: string
  accountName: string
  categoryId: string | null
  categoryName: string | null
  toAccountId: string | null
  toAccountName: string | null
  toAmountMinor: number | null
  toCurrency: 'CZK' | 'EUR' | 'USD' | null
  what: string | null
  note: string | null
  /** The amount in CZK, for foreign-currency rows and day totals. */
  czk: number | null
  estimated: boolean
}

/** The user's transactions, newest first, with names and CZK values; optionally one account's. */
export async function transactionItems(
  userId: string,
  { accountId }: { accountId?: string } = {},
): Promise<TransactionItem[]> {
  const db = getDb()
  const [accounts, categories, transactions, book] = await Promise.all([
    listAccounts(db, userId),
    listCategories(db, userId),
    listTransactions(db, userId),
    loadRateBook(db),
  ])
  const accountById = new Map(accounts.map((a) => [a.id, a]))
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  return transactions
    .filter(
      (tx) =>
        !accountId ||
        tx.accountId === accountId ||
        tx.toAccountId === accountId,
    )
    .sort(newestFirst)
    .map((tx) => {
      const account = accountById.get(tx.accountId)!
      const to = tx.toAccountId ? accountById.get(tx.toAccountId)! : null
      const converted = convertToCzk(
        book,
        tx.amountMinor,
        account.currency,
        tx.date,
      )
      return {
        id: tx.id,
        kind: tx.kind,
        date: tx.date,
        amountMinor: tx.amountMinor,
        currency: account.currency,
        accountId: account.id,
        accountName: account.name,
        categoryId: tx.categoryId,
        categoryName: tx.categoryId
          ? (categoryById.get(tx.categoryId)?.name ?? null)
          : null,
        toAccountId: to?.id ?? null,
        toAccountName: to?.name ?? null,
        toAmountMinor: tx.toAmountMinor,
        toCurrency: to?.currency ?? null,
        what: tx.what,
        note: tx.note,
        czk: converted.czk,
        estimated: converted.estimated,
      }
    })
}
