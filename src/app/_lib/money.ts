import 'server-only'
import {
  addMonths,
  monthOf,
  monthsBetween,
  todayInPrague,
} from '@/server/money/calendar.ts'
import {
  listAccounts,
  listCategories,
  listMonthValues,
  listTransactions,
} from '@/server/money/ledger.ts'
import { loadRateBook } from '@/server/money/rates.ts'
import {
  computeMonthEndBalances,
  computeMonthlyFlows,
  computeNetWorth,
  computeSpending,
  convertToCzk,
  monthEndBalances,
} from '@/server/money/reports.ts'
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

// ---- Monthly investment values (R-8, W-5) ----

export type MonthValuesData = {
  /** Last month (whose values are due once the month has turned) and this month. */
  months: [string, string]
  accounts: {
    id: string
    name: string
    currency: 'CZK' | 'EUR' | 'USD'
    /** Per month: the stored value, or null when the month carries an earlier one. */
    values: Record<
      string,
      { stored: number | null; shown: number; carried: boolean }
    >
  }[]
  /** Accounts without a value for last month (W-5 reminder). */
  dueCount: number
}

export async function monthValuesData(
  userId: string,
): Promise<MonthValuesData> {
  const today = todayInPrague()
  const current = monthOf(today)
  const previous = addMonths(current, -1)
  const db = getDb()
  const [series, stored] = await Promise.all([
    monthEndBalances(db, userId, { from: previous, to: current, today }),
    listMonthValues(db, userId),
  ])
  const storedValue = (accountId: string, month: string) =>
    stored.find((v) => v.accountId === accountId && v.month === month)
      ?.valueMinor ?? null
  const accounts = series
    .filter(
      ({ account }) =>
        VALUE_TRACKED_TYPES.has(account.type) && !account.archived,
    )
    .sort((a, b) => a.account.name.localeCompare(b.account.name, 'cs'))
    .map(({ account, months }) => ({
      id: account.id,
      name: account.name,
      currency: account.currency,
      values: Object.fromEntries(
        months.map((m) => [
          m.month,
          {
            stored: storedValue(account.id, m.month),
            shown: m.minor,
            carried: m.carried,
          },
        ]),
      ),
    }))
  const dueCount = accounts.filter(
    (a) =>
      a.values[previous] !== undefined && a.values[previous].stored === null,
  ).length
  return { months: [previous, current], accounts, dueCount }
}

/** One investment account's month-end values for the last 12 months, newest first. */
export async function valueHistory(userId: string, accountId: string) {
  const today = todayInPrague()
  const current = monthOf(today)
  const series = await monthEndBalances(getDb(), userId, {
    from: addMonths(current, -11),
    to: current,
    today,
  })
  const found = series.find((s) => s.account.id === accountId)
  return (found?.months ?? []).slice().reverse()
}

// ---- Dashboard and charts (AC-7, R-10 to R-12) ----

export type InsightsData = {
  today: string
  /** The months the charts cover: the last 12, from the first month any account existed. */
  months: string[]
  netWorth: {
    month: string
    total: number
    cash: number
    investments: number
    debt: number
    carried: boolean
    estimated: boolean
    missingRate: boolean
  }[]
  flows: {
    month: string
    spent: number
    income: number
    estimated: boolean
    /** Some EUR or USD entry had no rate at all and is left out of this month's sums. */
    missingRate: boolean
  }[]
  /** Active accounts' month-end balances in their own currency (null before they opened). */
  accounts: {
    id: string
    name: string
    currency: 'CZK' | 'EUR' | 'USD'
    balances: (number | null)[]
  }[]
  /** This month per category against the average of the previous 5 or 11 months. */
  comparison: Record<
    6 | 12,
    {
      monthsInAverage: number
      categories: {
        id: string
        name: string
        total: number
        average: number | null
      }[]
    }
  >
}

export async function insightsData(userId: string): Promise<InsightsData> {
  const db = getDb()
  const today = todayInPrague()
  const current = monthOf(today)
  const [accounts, categories, transactions, values, book] = await Promise.all([
    listAccounts(db, userId),
    listCategories(db, userId),
    listTransactions(db, userId),
    listMonthValues(db, userId),
    loadRateBook(db),
  ])
  const firstOpened = accounts.reduce<string | null>(
    (first, a) =>
      first === null || monthOf(a.openedOn) < first
        ? monthOf(a.openedOn)
        : first,
    null,
  )
  let from = addMonths(current, -11)
  if (firstOpened && firstOpened > from)
    from = firstOpened <= current ? firstOpened : current
  const months = monthsBetween(from, current)
  const range = { from, to: current, today }
  const series = computeMonthEndBalances(
    accounts,
    transactions,
    values,
    book,
    range,
  )
  const netWorth = computeNetWorth(series, months).map((m) => ({
    month: m.month,
    total: m.totalCzk,
    cash: m.byGroup.cash,
    investments: m.byGroup.investments,
    debt: m.byGroup.debt,
    carried: m.carried,
    estimated: m.estimated,
    missingRate: m.missingRate,
  }))
  const flows = computeMonthlyFlows(accounts, transactions, book, months).map(
    (f) => ({
      month: f.month,
      spent: f.spentCzk,
      income: f.incomeCzk,
      estimated: f.estimated,
      missingRate: f.missingRate,
    }),
  )
  const nameOf = new Map(categories.map((c) => [c.id, c.name]))
  const compare = (previousMonths: number) => {
    const report = computeSpending(accounts, transactions, book, {
      month: current,
      previousMonths,
    })
    return {
      monthsInAverage: report.monthsInAverage,
      categories: report.categories.map((c) => ({
        id: c.categoryId,
        name: nameOf.get(c.categoryId) ?? '',
        total: c.totalCzk,
        average: c.averageCzk,
      })),
    }
  }
  return {
    today,
    months,
    netWorth,
    flows,
    accounts: series
      .filter(({ account }) => !account.archived)
      .sort((a, b) => a.account.name.localeCompare(b.account.name, 'cs'))
      .map(({ account, months: accountMonths }) => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
        balances: months.map(
          (m) => accountMonths.find((x) => x.month === m)?.minor ?? null,
        ),
      })),
    comparison: { 6: compare(5), 12: compare(11) },
  }
}
