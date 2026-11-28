// Reading the ledger: month-end balances (AC-8), net worth (AC-5, R-10) and spending by category
// (AC-9), all converted to CZK on the server at the rate of the day (ADR 0003, AC-15). Volumes
// are small (about 1,500 rows a year), so rows are loaded once and summed in memory.
import type { Db } from '../db/client.ts'
import { fromCzk, toCzk, divideRounded, toSafeNumber } from './arithmetic.ts'
import { addMonths, lastDayOf, monthOf, monthsBetween } from './calendar.ts'
import {
  listAccounts,
  listMonthValues,
  listTransactions,
  type Account,
  type MonthValue,
  type Transaction,
} from './ledger.ts'
import { loadRateBook, type RateBook } from './rates.ts'
import {
  ACCOUNT_GROUP,
  VALUE_TRACKED,
  type AccountGroup,
  type Currency,
  type Day,
  type Month,
} from './types.ts'

/** A converted amount, with how sure the conversion is. */
export type Converted = {
  /** CZK minor units, or null when no rate is known for the currency. */
  czk: number | null
  /** The last known rate was used because the day's own was missing (AC-15). */
  estimated: boolean
}

export function convertToCzk(
  book: RateBook,
  minor: number,
  currency: Currency,
  day: Day,
): Converted {
  const rate = book.lookup(currency, day)
  if (!rate) return { czk: null, estimated: false }
  return { czk: toCzk(minor, rate), estimated: rate.estimated }
}

/** A CZK total shown in EUR or USD (R-23), at the rate of `day`. */
export function convertFromCzk(
  book: RateBook,
  czkMinor: number,
  currency: Currency,
  day: Day,
): { minor: number | null; estimated: boolean } {
  const rate = book.lookup(currency, day)
  if (!rate) return { minor: null, estimated: false }
  return { minor: fromCzk(czkMinor, rate), estimated: rate.estimated }
}

/** How a transaction changes one account's balance, in that account's currency. */
export function flowFor(tx: Transaction, accountId: string): number {
  if (tx.kind === 'expense')
    return tx.accountId === accountId ? -tx.amountMinor : 0
  if (tx.kind === 'income')
    return tx.accountId === accountId ? tx.amountMinor : 0
  if (tx.accountId === accountId) return -tx.amountMinor
  if (tx.toAccountId === accountId) return tx.toAmountMinor ?? 0
  return 0
}

export type AccountMonth = Converted & {
  month: Month
  /** The balance at the month's end (or today, for the current month), in the account's currency. */
  minor: number
  /** A value-tracked account without a value for this month: the last value carried forward. */
  carried: boolean
}

export type AccountSeries = { account: Account; months: AccountMonth[] }

type Range = { from: Month; to: Month; today: Day }

/** The day a month's balance is taken: its last day, or today for the current month. */
function balanceDay(month: Month, today: Day): Day {
  const last = lastDayOf(month)
  return last < today ? last : today
}

export function computeMonthEndBalances(
  accounts: Account[],
  transactions: Transaction[],
  values: MonthValue[],
  book: RateBook,
  { from, to, today }: Range,
): AccountSeries[] {
  const lastMonth = to < monthOf(today) ? to : monthOf(today)
  const months = from <= lastMonth ? monthsBetween(from, lastMonth) : []
  return accounts.map((account) => {
    const opened = monthOf(account.openedOn)
    const flows = transactions
      .map((tx) => ({ date: tx.date, amount: flowFor(tx, account.id) }))
      .filter((f) => f.amount !== 0)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    const accountValues = values
      .filter((v) => v.accountId === account.id)
      .sort((a, b) => (a.month < b.month ? -1 : 1))
    const series: AccountMonth[] = []
    let balance = account.openingBalanceMinor
    let next = 0
    for (const month of months) {
      const day = balanceDay(month, today)
      while (next < flows.length && flows[next].date <= day)
        balance += flows[next++].amount
      if (month < opened) continue
      let minor = balance
      let carried = false
      if (VALUE_TRACKED.has(account.type)) {
        // Value-tracked: the month's value, else the last one carried, else the opening value.
        const latest = accountValues.filter((v) => v.month <= month).at(-1)
        minor = latest ? latest.valueMinor : account.openingBalanceMinor
        carried = latest ? latest.month !== month : month !== opened
      }
      series.push({
        month,
        minor,
        carried,
        ...convertToCzk(book, minor, account.currency, day),
      })
    }
    return { account, months: series }
  })
}

export async function monthEndBalances(db: Db, userId: string, range: Range) {
  const [accounts, transactions, values, book] = await Promise.all([
    listAccounts(db, userId),
    listTransactions(db, userId),
    listMonthValues(db, userId),
    loadRateBook(db),
  ])
  return computeMonthEndBalances(accounts, transactions, values, book, range)
}

export type NetWorthMonth = {
  month: Month
  /** Sum of every account in CZK minor units; accounts without a known rate are left out. */
  totalCzk: number
  byGroup: Record<AccountGroup, number>
  carried: boolean
  estimated: boolean
  /** Some account could not be converted at all; the total is incomplete. */
  missingRate: boolean
}

export function computeNetWorth(
  series: AccountSeries[],
  months: Month[],
): NetWorthMonth[] {
  return months.map((month) => {
    const result: NetWorthMonth = {
      month,
      totalCzk: 0,
      byGroup: { cash: 0, debt: 0, investments: 0 },
      carried: false,
      estimated: false,
      missingRate: false,
    }
    for (const { account, months: accountMonths } of series) {
      const entry = accountMonths.find((m) => m.month === month)
      if (!entry) continue
      result.carried ||= entry.carried
      result.estimated ||= entry.estimated
      if (entry.czk === null) {
        result.missingRate = true
        continue
      }
      // Balances are signed: a card's debt is negative and lowers net worth (AC-5).
      result.totalCzk += entry.czk
      result.byGroup[ACCOUNT_GROUP[account.type]] += entry.czk
    }
    return result
  })
}

export async function netWorthByMonth(db: Db, userId: string, range: Range) {
  const series = await monthEndBalances(db, userId, range)
  const lastMonth =
    range.to < monthOf(range.today) ? range.to : monthOf(range.today)
  return computeNetWorth(
    series,
    range.from <= lastMonth ? monthsBetween(range.from, lastMonth) : [],
  )
}

export type CategorySpending = {
  categoryId: string
  /** This month, CZK minor units. */
  totalCzk: number
  /** Average of the previous months in the window, CZK minor units; null without history. */
  averageCzk: number | null
}

export type SpendingReport = {
  month: Month
  categories: CategorySpending[]
  /** How many previous months the average covers (charts say so with little history). */
  monthsInAverage: number
  estimated: boolean
  missingRate: boolean
}

/**
 * Expenses per category this month next to the average of up to `previousMonths` earlier months,
 * counted from the first month with any transaction. Transfers never count as spending (AC-2, AC-9).
 */
export function computeSpending(
  accounts: Account[],
  transactions: Transaction[],
  book: RateBook,
  { month, previousMonths = 6 }: { month: Month; previousMonths?: number },
): SpendingReport {
  const currencyOf = new Map(accounts.map((a) => [a.id, a.currency]))
  const firstMonth = transactions.reduce<Month | null>(
    (first, tx) =>
      first === null || monthOf(tx.date) < first ? monthOf(tx.date) : first,
    null,
  )
  let windowStart = addMonths(month, -previousMonths)
  if (firstMonth && firstMonth > windowStart) windowStart = firstMonth
  const windowEnd = addMonths(month, -1)
  const monthsInAverage =
    windowStart <= windowEnd ? monthsBetween(windowStart, windowEnd).length : 0

  const current = new Map<string, bigint>()
  const previous = new Map<string, bigint>()
  let estimated = false
  let missingRate = false
  for (const tx of transactions) {
    if (tx.kind !== 'expense' || !tx.categoryId) continue
    const txMonth = monthOf(tx.date)
    const target =
      txMonth === month
        ? current
        : txMonth >= windowStart && txMonth <= windowEnd
          ? previous
          : null
    if (!target) continue
    const converted = convertToCzk(
      book,
      tx.amountMinor,
      currencyOf.get(tx.accountId)!,
      tx.date,
    )
    estimated ||= converted.estimated
    if (converted.czk === null) {
      missingRate = true
      continue
    }
    target.set(
      tx.categoryId,
      (target.get(tx.categoryId) ?? 0n) + BigInt(converted.czk),
    )
  }
  const ids = new Set([...current.keys(), ...previous.keys()])
  const categories = [...ids].map((categoryId) => ({
    categoryId,
    totalCzk: toSafeNumber(current.get(categoryId) ?? 0n),
    averageCzk:
      monthsInAverage === 0
        ? null
        : toSafeNumber(
            divideRounded(
              previous.get(categoryId) ?? 0n,
              BigInt(monthsInAverage),
            ),
          ),
  }))
  categories.sort((a, b) => b.totalCzk - a.totalCzk)
  return { month, categories, monthsInAverage, estimated, missingRate }
}

export async function spendingByCategory(
  db: Db,
  userId: string,
  options: { month: Month; previousMonths?: number },
) {
  const [accounts, transactions, book] = await Promise.all([
    listAccounts(db, userId),
    listTransactions(db, userId),
    loadRateBook(db),
  ])
  return computeSpending(accounts, transactions, book, options)
}

export type MonthFlow = {
  month: Month
  /** Expenses in CZK minor units (transfers never count). */
  spentCzk: number
  /** Income in CZK minor units. */
  incomeCzk: number
  estimated: boolean
  missingRate: boolean
}

/** Expenses and income per month in CZK, at each transaction's day rate (R-12 trend). */
export function computeMonthlyFlows(
  accounts: Account[],
  transactions: Transaction[],
  book: RateBook,
  months: Month[],
): MonthFlow[] {
  const currencyOf = new Map(accounts.map((a) => [a.id, a.currency]))
  const byMonth = new Map(
    months.map((month) => [
      month,
      { month, spent: 0n, income: 0n, estimated: false, missingRate: false },
    ]),
  )
  for (const tx of transactions) {
    if (tx.kind === 'transfer') continue
    const entry = byMonth.get(monthOf(tx.date))
    if (!entry) continue
    const converted = convertToCzk(
      book,
      tx.amountMinor,
      currencyOf.get(tx.accountId)!,
      tx.date,
    )
    entry.estimated ||= converted.estimated
    if (converted.czk === null) {
      entry.missingRate = true
      continue
    }
    if (tx.kind === 'expense') entry.spent += BigInt(converted.czk)
    else entry.income += BigInt(converted.czk)
  }
  return [...byMonth.values()].map((e) => ({
    month: e.month,
    spentCzk: toSafeNumber(e.spent),
    incomeCzk: toSafeNumber(e.income),
    estimated: e.estimated,
    missingRate: e.missingRate,
  }))
}
