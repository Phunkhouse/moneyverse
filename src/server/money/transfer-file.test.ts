import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../db/client.ts'
import { createTestDb, createTestUser } from '../test/database.ts'
import {
  createAccount,
  createCategory,
  createTransaction,
  listAccounts,
  listCategories,
  listTransactions,
  setMonthValue,
  updateAccount,
  updateCategory,
} from './ledger.ts'
import { monthEndBalances } from './reports.ts'
import { exportLedger, importLedger, parseExportFile } from './transfer-file.ts'

// Invented data only (public repository).
let db: Db
let cleanup: () => Promise<void>
let me: string
let other: string

beforeEach(async () => {
  ;({ db, cleanup } = await createTestDb())
  me = await createTestUser(db, 'Já')
  other = await createTestUser(db, 'Nový uživatel')
})
afterEach(() => cleanup())

/** A small ledger with every kind of row: transfer across currencies, archived rows, values. */
async function seed(userId: string) {
  const bank = await createAccount(db, userId, {
    name: 'Běžný účet',
    type: 'checking',
    currency: 'CZK',
    openingBalanceMinor: 5_000_000,
    openedOn: '2026-01-01',
  })
  const eur = await createAccount(db, userId, {
    name: 'Účet v EUR',
    type: 'savings',
    currency: 'EUR',
    openedOn: '2026-01-01',
  })
  const fund = await createAccount(db, userId, {
    name: 'Fond',
    type: 'managed_fund',
    currency: 'CZK',
    openingBalanceMinor: 1_000_000,
    openedOn: '2026-01-01',
  })
  const old = await createAccount(db, userId, {
    name: 'Starý účet',
    type: 'checking',
    currency: 'CZK',
    openedOn: '2026-01-01',
  })
  const food = await createCategory(db, userId, {
    kind: 'expense',
    name: 'Jídlo',
  })
  const pay = await createCategory(db, userId, { kind: 'income', name: 'Mzda' })
  const gone = await createCategory(db, userId, {
    kind: 'expense',
    name: 'Kouření',
  })
  const id = () => crypto.randomUUID()
  await createTransaction(db, userId, id(), {
    kind: 'income',
    date: '2026-10-01',
    accountId: bank.id,
    amountMinor: 4_000_000,
    categoryId: pay.id,
    what: 'Výplata',
  })
  await createTransaction(db, userId, id(), {
    kind: 'expense',
    date: '2026-10-02',
    accountId: old.id,
    amountMinor: 10_000,
    categoryId: gone.id,
    note: 'Naposledy',
  })
  await createTransaction(db, userId, id(), {
    kind: 'expense',
    date: '2026-10-03',
    accountId: bank.id,
    amountMinor: 12_900,
    categoryId: food.id,
  })
  await createTransaction(db, userId, id(), {
    kind: 'transfer',
    date: '2026-10-04',
    accountId: bank.id,
    amountMinor: 250_000,
    toAccountId: eur.id,
    toAmountMinor: 10_150,
  })
  await setMonthValue(db, userId, {
    accountId: fund.id,
    month: '2026-10',
    valueMinor: 1_050_000,
  })
  await updateAccount(db, userId, old.id, { archived: true })
  await updateCategory(db, userId, gone.id, { archived: true })
}

const balances = async (userId: string) =>
  (
    await monthEndBalances(db, userId, {
      from: '2026-10',
      to: '2026-11',
      today: '2026-11-28',
    })
  )
    .map(({ account, months }) => [
      account.name,
      account.archived,
      months.map((m) => [m.month, m.minor, m.carried]),
    ])
    .sort()

describe('export and re-import (AC-13)', () => {
  it('round-trips the whole ledger into another user with the same balances', async () => {
    await seed(me)
    const file = await exportLedger(db, me, new Date('2026-11-28T10:00:00Z'))
    expect(file).toMatchObject({ format: 'moneyverse-export', version: 1 })
    expect(JSON.stringify(file)).not.toContain(me)

    const parsed = parseExportFile(JSON.stringify(file))
    const summary = await importLedger(db, other, parsed)
    expect(summary).toEqual({
      accounts: 4,
      categories: 3,
      transactions: 4,
      monthValues: 1,
    })

    expect(await balances(other)).toEqual(await balances(me))
    const imported = await listTransactions(db, other)
    const transfer = imported.find((t) => t.kind === 'transfer')!
    expect(transfer).toMatchObject({
      amountMinor: 250_000,
      toAmountMinor: 10_150,
    })
    // Fresh ids: nothing of the original user's rows is reused.
    const originalIds = new Set(
      (await listTransactions(db, me)).map((t) => t.id),
    )
    expect(imported.some((t) => originalIds.has(t.id))).toBe(false)
    expect(
      (await listCategories(db, other))
        .filter((c) => c.archived)
        .map((c) => c.name),
    ).toEqual(['Kouření'])
    expect(
      (await listAccounts(db, other))
        .filter((a) => a.archived)
        .map((a) => a.name),
    ).toEqual(['Starý účet'])
  })

  it('refuses to import into a ledger that already has data', async () => {
    await seed(me)
    const file = await exportLedger(db, me)
    await expect(importLedger(db, me, file)).rejects.toMatchObject({
      code: 'CONFLICT',
    })
  })

  it('writes nothing when one row is invalid', async () => {
    await seed(me)
    const file = await exportLedger(db, me)
    file.transactions[2].amountMinor = 0
    await expect(importLedger(db, other, file)).rejects.toThrow('positive')
    expect(await listAccounts(db, other)).toEqual([])
    expect(await listCategories(db, other)).toEqual([])
    expect(await listTransactions(db, other)).toEqual([])
  })

  it('reads only well-formed files of this format and version', async () => {
    await seed(me)
    const good = await exportLedger(db, me)
    const broken = (change: (f: Record<string, unknown>) => void) => {
      const copy = JSON.parse(JSON.stringify(good))
      change(copy)
      return JSON.stringify(copy)
    }
    expect(() => parseExportFile('{')).toThrow('not JSON')
    expect(() => parseExportFile(broken((f) => (f.format = 'other')))).toThrow(
      'format',
    )
    expect(() => parseExportFile(broken((f) => (f.version = 2)))).toThrow(
      'version 2',
    )
    expect(() =>
      parseExportFile(
        broken(
          (f) =>
            ((f.transactions as { accountId: string }[])[0].accountId =
              'nowhere'),
        ),
      ),
    ).toThrow('accountId')
    expect(() =>
      parseExportFile(
        broken(
          (f) => ((f.accounts as { currency: string }[])[0].currency = 'GBP'),
        ),
      ),
    ).toThrow('currency')
    expect(() =>
      parseExportFile(
        broken(
          (f) =>
            ((f.transactions as { amountMinor: number }[])[0].amountMinor =
              1.5),
        ),
      ),
    ).toThrow('amountMinor')
    expect(() =>
      parseExportFile(
        broken(
          (f) => ((f.monthValues as { month: string }[])[0].month = '2026-13'),
        ),
      ),
    ).toThrow('month')
  })
})
