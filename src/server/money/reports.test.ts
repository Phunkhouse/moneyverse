import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../db/client.ts'
import { exchangeRate, exchangeRateDay } from '../db/schema.ts'
import { createTestDb, createTestUser } from '../test/database.ts'
import {
  createAccount,
  createCategory,
  createTransaction,
  setMonthValue,
  type TransactionInput,
} from './ledger.ts'
import { loadRateBook } from './rates.ts'
import {
  convertFromCzk,
  monthEndBalances,
  netWorthByMonth,
  spendingByCategory,
} from './reports.ts'
import type { AccountType, Currency } from './types.ts'

// Invented accounts, amounts and rates only (public repository).
let db: Db
let cleanup: () => Promise<void>
let me: string

beforeEach(async () => {
  ;({ db, cleanup } = await createTestDb())
  me = await createTestUser(db)
})
afterEach(() => cleanup())

const account = (
  type: AccountType,
  opening = 0,
  currency: Currency = 'CZK',
  openedOn = '2026-01-01',
) =>
  createAccount(db, me, {
    name: `Účet ${type} ${currency}`,
    type,
    currency,
    openingBalanceMinor: opening,
    openedOn,
  })

const save = (input: TransactionInput) =>
  createTransaction(db, me, crypto.randomUUID(), input)

async function storeEurRate(
  day: string,
  rateMilli: number,
  coversDays: string[] = [day],
) {
  await db
    .insert(exchangeRate)
    .values({ validFor: day, currency: 'EUR', amount: 1, rateMilli })
  for (const d of coversDays)
    await db.insert(exchangeRateDay).values({ day: d, validFor: day })
}

describe('credit card payment (AC-2)', () => {
  it('moves money between both balances and is not spending', async () => {
    const bank = await account('checking', 5_000_000)
    const card = await account('credit_card')
    const food = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    await save({
      kind: 'expense',
      date: '2026-11-05',
      accountId: card.id,
      amountMinor: 100_000,
      categoryId: food.id,
    })
    await save({
      kind: 'transfer',
      date: '2026-11-20',
      accountId: bank.id,
      amountMinor: 100_000,
      toAccountId: card.id,
    })

    const series = await monthEndBalances(db, me, {
      from: '2026-10',
      to: '2026-11',
      today: '2026-11-27',
    })
    const byId = new Map(series.map((s) => [s.account.id, s.months]))
    expect(byId.get(bank.id)!.map((m) => m.minor)).toEqual([
      5_000_000, 4_900_000,
    ])
    expect(byId.get(card.id)!.map((m) => m.minor)).toEqual([0, 0])

    const spending = await spendingByCategory(db, me, { month: '2026-11' })
    expect(spending.categories).toEqual([
      { categoryId: food.id, totalCzk: 100_000, averageCzk: null },
    ])
  })
})

describe('net worth (AC-5)', () => {
  it('counts all seven account types, debt negative, grouped by kind', async () => {
    await account('checking', 1_000_000)
    await account('savings', 2_000_000)
    await account('credit_card', -300_000)
    await account('brokerage', 4_000_000)
    await account('crypto', 500_000)
    await account('managed_fund', 600_000)
    await account('retirement', 700_000)
    const [month] = await netWorthByMonth(db, me, {
      from: '2026-11',
      to: '2026-11',
      today: '2026-11-27',
    })
    expect(month.byGroup).toEqual({
      cash: 3_000_000,
      debt: -300_000,
      investments: 5_800_000,
    })
    expect(month.totalCzk).toBe(8_500_000)
  })
})

describe('month-end balances (AC-8)', () => {
  it('takes each month’s last day, ignores later entries and starts at the opening month', async () => {
    const bank = await account('checking', 1_000_000, 'CZK', '2026-09-15')
    const salary = await createCategory(db, me, {
      kind: 'income',
      name: 'Mzda',
    })
    const rent = await createCategory(db, me, {
      kind: 'expense',
      name: 'Bydlení',
    })
    await save({
      kind: 'income',
      date: '2026-09-30',
      accountId: bank.id,
      amountMinor: 4_000_000,
      categoryId: salary.id,
    })
    await save({
      kind: 'expense',
      date: '2026-10-01',
      accountId: bank.id,
      amountMinor: 1_500_000,
      categoryId: rent.id,
    })
    await save({
      kind: 'expense',
      date: '2026-11-28',
      accountId: bank.id,
      amountMinor: 1_500_000,
      categoryId: rent.id,
    })
    const [series] = await monthEndBalances(db, me, {
      from: '2026-08',
      to: '2026-12',
      today: '2026-11-27',
    })
    expect(series.months.map((m) => [m.month, m.minor])).toEqual([
      ['2026-09', 5_000_000],
      ['2026-10', 3_500_000],
      // The current month stops at today; 28 November is still ahead.
      ['2026-11', 3_500_000],
    ])
  })

  it('carries the last monthly value forward and marks it (AC-6 rule)', async () => {
    const fund = await account('managed_fund', 900_000, 'CZK', '2026-08-01')
    await setMonthValue(db, me, {
      accountId: fund.id,
      month: '2026-09',
      valueMinor: 1_000_000,
    })
    const [series] = await monthEndBalances(db, me, {
      from: '2026-08',
      to: '2026-11',
      today: '2026-11-27',
    })
    expect(series.months.map((m) => [m.month, m.minor, m.carried])).toEqual([
      ['2026-08', 900_000, false],
      ['2026-09', 1_000_000, false],
      ['2026-10', 1_000_000, true],
      ['2026-11', 1_000_000, true],
    ])
  })
})

describe('spending by category (AC-9)', () => {
  it('compares this month with the average of earlier months, without transfers', async () => {
    const bank = await account('checking', 10_000_000)
    const savings = await account('savings')
    const food = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    const fun = await createCategory(db, me, {
      kind: 'expense',
      name: 'Zábava',
    })
    const spend = (date: string, amountMinor: number, categoryId: string) =>
      save({
        kind: 'expense',
        date,
        accountId: bank.id,
        amountMinor,
        categoryId,
      })
    await spend('2026-09-10', 300_000, food.id)
    await spend('2026-10-10', 400_000, food.id)
    await spend('2026-10-12', 100_001, fun.id)
    await spend('2026-11-10', 500_000, food.id)
    await save({
      kind: 'transfer',
      date: '2026-11-11',
      accountId: bank.id,
      amountMinor: 2_000_000,
      toAccountId: savings.id,
    })

    const report = await spendingByCategory(db, me, { month: '2026-11' })
    // The history starts in September, so the average covers September and October.
    expect(report.monthsInAverage).toBe(2)
    expect(report.categories).toEqual([
      { categoryId: food.id, totalCzk: 500_000, averageCzk: 350_000 },
      // 1 000,01 Kč over two months is 500,005 Kč, rounded half away from zero.
      { categoryId: fun.id, totalCzk: 0, averageCzk: 50_001 },
    ])
  })
})

describe('foreign currency (AC-15)', () => {
  it('keeps the EUR amount and counts it in CZK at that day’s rate', async () => {
    const eur = await account('checking', 0, 'EUR')
    const food = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    await storeEurRate('2026-11-20', 24_000)
    await storeEurRate('2026-11-23', 25_000)
    const tx = await save({
      kind: 'expense',
      date: '2026-11-20',
      accountId: eur.id,
      amountMinor: 1_000,
      categoryId: food.id,
    })
    expect(tx.amountMinor).toBe(1_000)

    const report = await spendingByCategory(db, me, { month: '2026-11' })
    expect(report.categories[0].totalCzk).toBe(24_000)
    expect(report.estimated).toBe(false)
  })

  it('uses the last known rate when the day has none, and marks it', async () => {
    const eur = await account('checking', 0, 'EUR')
    const food = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    await storeEurRate('2026-11-20', 24_000)
    await save({
      kind: 'expense',
      date: '2026-11-25',
      accountId: eur.id,
      amountMinor: 1_000,
      categoryId: food.id,
    })
    const report = await spendingByCategory(db, me, { month: '2026-11' })
    expect(report.categories[0].totalCzk).toBe(24_000)
    expect(report.estimated).toBe(true)
  })

  it('converts month-end balances and records a CZK to EUR transfer in both accounts', async () => {
    const czk = await account('checking', 1_000_000)
    const eur = await account('savings', 0, 'EUR')
    await storeEurRate('2026-10-30', 24_500, ['2026-10-30', '2026-10-31'])
    await save({
      kind: 'transfer',
      date: '2026-10-15',
      accountId: czk.id,
      amountMinor: 250_000,
      toAccountId: eur.id,
      toAmountMinor: 10_150,
    })
    const series = await monthEndBalances(db, me, {
      from: '2026-10',
      to: '2026-10',
      today: '2026-11-27',
    })
    const eurOctober = series.find((s) => s.account.id === eur.id)!.months[0]
    // 101,50 EUR × 24,5 = 2 486,75 Kč at the month's last rate
    expect(eurOctober).toMatchObject({
      minor: 10_150,
      czk: 248_675,
      estimated: false,
    })
    const czkOctober = series.find((s) => s.account.id === czk.id)!.months[0]
    expect(czkOctober.minor).toBe(750_000)
  })

  it('leaves an account out of totals when no rate exists at all, and says so', async () => {
    await account('checking', 1_000_000)
    await account('savings', 5_000, 'EUR')
    const [month] = await netWorthByMonth(db, me, {
      from: '2026-11',
      to: '2026-11',
      today: '2026-11-27',
    })
    expect(month).toMatchObject({ totalCzk: 1_000_000, missingRate: true })
  })

  it('shows CZK totals in EUR at the day’s rate', async () => {
    await storeEurRate('2026-11-20', 24_455)
    const book = await loadRateBook(db)
    expect(convertFromCzk(book, 244_550, 'EUR', '2026-11-20')).toEqual({
      minor: 10_000,
      estimated: false,
    })
  })
})
