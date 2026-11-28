import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Db } from '../db/client.ts'
import { eq } from 'drizzle-orm'
import { category, moneyTransaction } from '../db/schema.ts'
import { createTestDb, createTestUser } from '../test/database.ts'
import {
  createAccount,
  createCategory,
  createTransaction,
  deleteMonthValue,
  deleteTransaction,
  findAccount,
  openingFromForm,
  listTransactions,
  setMonthValue,
  updateCategory,
  updateAccount,
  updateTransaction,
} from './ledger.ts'
import { ACCOUNT_TYPES } from './types.ts'

// Invented names and amounts only (public repository).
let db: Db
let cleanup: () => Promise<void>
let me: string
let other: string

beforeEach(async () => {
  ;({ db, cleanup } = await createTestDb())
  me = await createTestUser(db, 'Já')
  other = await createTestUser(db, 'Někdo jiný')
})
afterEach(() => cleanup())

const id = () => crypto.randomUUID()
// Categories have no archive function yet (the categories PR adds it); set the flag directly.
const archiveCategory = (categoryId: string) =>
  db.update(category).set({ archived: true }).where(eq(category.id, categoryId))
const checking = (userId = me, currency: 'CZK' | 'EUR' = 'CZK') =>
  createAccount(db, userId, {
    name: 'Běžný účet',
    type: 'checking',
    currency,
    openedOn: '2026-01-01',
  })

describe('accounts', () => {
  it('creates all seven account types (AC-5)', async () => {
    for (const type of ACCOUNT_TYPES) {
      const account = await createAccount(db, me, {
        name: `Účet ${type}`,
        type,
        currency: 'CZK',
        openedOn: '2026-01-01',
      })
      expect(account.type).toBe(type)
    }
  })

  it('validates input on the server', async () => {
    const base = {
      name: 'X',
      type: 'checking',
      currency: 'CZK',
      openedOn: '2026-01-01',
    } as const
    await expect(
      createAccount(db, me, { ...base, name: '  ' }),
    ).rejects.toThrow('name')
    await expect(
      createAccount(db, me, { ...base, type: 'loan' as never }),
    ).rejects.toThrow('type')
    await expect(
      createAccount(db, me, { ...base, currency: 'GBP' as never }),
    ).rejects.toThrow('currency')
    await expect(
      createAccount(db, me, { ...base, openedOn: '2026-02-30' }),
    ).rejects.toThrow('openedOn')
    await expect(
      createAccount(db, me, { ...base, openingBalanceMinor: 1.5 }),
    ).rejects.toThrow('minor')
  })

  it('refuses an empty change and a malformed id with INVALID', async () => {
    const account = await checking()
    await expect(updateAccount(db, me, account.id, {})).rejects.toMatchObject({
      code: 'INVALID',
    })
    await expect(
      updateAccount(db, me, 'not-a-uuid', { name: 'X' }),
    ).rejects.toMatchObject({ code: 'INVALID' })
    await expect(
      deleteMonthValue(db, me, { accountId: 'not-a-uuid', month: '2026-10' }),
    ).rejects.toMatchObject({ code: 'INVALID' })
  })

  it('does not let one user change another user’s account', async () => {
    const theirs = await checking(other)
    await expect(
      updateAccount(db, me, theirs.id, { name: 'Moje' }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

describe('opening balances from the form', () => {
  it('stores a card’s typed debt as negative and refuses a negative debt', () => {
    expect(openingFromForm('credit_card', 950_000)).toBe(-950_000)
    expect(openingFromForm('credit_card', 0)).toBe(0)
    expect(() => openingFromForm('credit_card', -500_000)).toThrow('positive')
    expect(openingFromForm('checking', -500_000)).toBe(-500_000)
    expect(openingFromForm('brokerage', 500_000)).toBe(500_000)
  })

  it('finds only the user’s own account, by its stored type', async () => {
    const card = await createAccount(db, me, {
      name: 'Karta',
      type: 'credit_card',
      currency: 'CZK',
      openedOn: '2026-01-01',
    })
    expect((await findAccount(db, me, card.id)).type).toBe('credit_card')
    await expect(findAccount(db, other, card.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

describe('archived accounts and categories', () => {
  it('take no new entries, but edits of existing ones still work', async () => {
    const account = await checking()
    const food = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    const txId = id()
    const input = {
      kind: 'expense' as const,
      date: '2026-11-26',
      accountId: account.id,
      amountMinor: 100,
      categoryId: food.id,
    }
    await createTransaction(db, me, txId, input)
    await updateAccount(db, me, account.id, { archived: true })
    await archiveCategory(food.id)

    await expect(createTransaction(db, me, id(), input)).rejects.toThrow(
      'archived',
    )
    const edited = await updateTransaction(db, me, txId, {
      ...input,
      amountMinor: 150,
    })
    expect(edited.amountMinor).toBe(150)

    // Moving an entry onto another archived account is still refused.
    const old = await checking()
    await updateAccount(db, me, old.id, { archived: true })
    await expect(
      updateTransaction(db, me, txId, { ...input, accountId: old.id }),
    ).rejects.toThrow('archived')
  })
})

describe('transactions', () => {
  it('saves a repeated save once (idempotent)', async () => {
    const account = await checking()
    const food = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    const input = {
      kind: 'expense' as const,
      date: '2026-11-26',
      accountId: account.id,
      amountMinor: 12_900,
      categoryId: food.id,
      what: 'Oběd',
    }
    const txId = id()
    const first = await createTransaction(db, me, txId, input)
    const second = await createTransaction(db, me, txId, input)
    expect(second).toEqual(first)
    expect(await listTransactions(db, me)).toHaveLength(1)
    await expect(
      createTransaction(db, me, txId, { ...input, amountMinor: 13_000 }),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('does not reveal or reuse another user’s transaction id', async () => {
    const mine = await checking()
    const theirs = await checking(other)
    const myCat = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    const theirCat = await createCategory(db, other, {
      kind: 'expense',
      name: 'Jídlo',
    })
    const txId = id()
    const base = {
      kind: 'expense' as const,
      date: '2026-11-26',
      amountMinor: 100,
    }
    await createTransaction(db, other, txId, {
      ...base,
      accountId: theirs.id,
      categoryId: theirCat.id,
    })
    await expect(
      createTransaction(db, me, txId, {
        ...base,
        accountId: mine.id,
        categoryId: myCat.id,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
    await expect(deleteTransaction(db, me, txId)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    await expect(
      updateTransaction(db, me, txId, {
        ...base,
        accountId: mine.id,
        categoryId: myCat.id,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('refuses another user’s account or category (AC-12)', async () => {
    const mine = await checking()
    const theirs = await checking(other)
    const myCat = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    const theirCat = await createCategory(db, other, {
      kind: 'expense',
      name: 'Bydlení',
    })
    const base = {
      kind: 'expense' as const,
      date: '2026-11-26',
      amountMinor: 100,
    }
    await expect(
      createTransaction(db, me, id(), {
        ...base,
        accountId: theirs.id,
        categoryId: myCat.id,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      createTransaction(db, me, id(), {
        ...base,
        accountId: mine.id,
        categoryId: theirCat.id,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(
      createTransaction(db, me, id(), {
        kind: 'transfer',
        date: '2026-11-26',
        amountMinor: 100,
        accountId: mine.id,
        toAccountId: theirs.id,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('has the database refuse a cross-user row even if code skipped the check', async () => {
    const theirs = await checking(other)
    await expect(
      db.insert(moneyTransaction).values({
        id: id(),
        userId: me,
        kind: 'transfer',
        date: '2026-11-26',
        accountId: theirs.id,
        amountMinor: 100,
        toAccountId: (await checking()).id,
        toAmountMinor: 100,
      }),
    ).rejects.toSatisfy((error: { cause?: unknown }) =>
      String(error.cause).includes('FOREIGN KEY constraint failed'),
    )
  })

  it('checks amounts, categories and transfer shapes', async () => {
    const czk = await checking()
    const eur = await checking(me, 'EUR')
    const food = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    const salary = await createCategory(db, me, {
      kind: 'income',
      name: 'Mzda',
    })
    const base = { date: '2026-11-26', accountId: czk.id }
    await expect(
      createTransaction(db, me, id(), {
        ...base,
        kind: 'expense',
        amountMinor: 0,
        categoryId: food.id,
      }),
    ).rejects.toThrow('positive')
    await expect(
      createTransaction(db, me, id(), {
        ...base,
        kind: 'expense',
        amountMinor: 100,
        categoryId: salary.id,
      }),
    ).rejects.toThrow('expense category')
    await expect(
      createTransaction(db, me, id(), {
        ...base,
        kind: 'transfer',
        amountMinor: 100,
        toAccountId: czk.id,
      }),
    ).rejects.toThrow('two different')
    await expect(
      createTransaction(db, me, id(), {
        ...base,
        kind: 'transfer',
        amountMinor: 100,
        toAccountId: eur.id,
      }),
    ).rejects.toThrow('toAmountMinor')
    await expect(
      createTransaction(db, me, id(), {
        ...base,
        kind: 'transfer',
        amountMinor: 100,
        toAccountId: (await checking()).id,
        toAmountMinor: 99,
      }),
    ).rejects.toThrow('one amount')
    await expect(
      createTransaction(db, me, 'not-a-uuid', {
        ...base,
        kind: 'expense',
        amountMinor: 100,
        categoryId: food.id,
      }),
    ).rejects.toThrow('UUID')
  })

  it('keeps both amounts of a CZK to EUR transfer (AC-15)', async () => {
    const czk = await checking()
    const eur = await checking(me, 'EUR')
    const tx = await createTransaction(db, me, id(), {
      kind: 'transfer',
      date: '2026-11-26',
      accountId: czk.id,
      amountMinor: 250_000,
      toAccountId: eur.id,
      toAmountMinor: 10_150,
    })
    expect(tx).toMatchObject({ amountMinor: 250_000, toAmountMinor: 10_150 })
  })

  it('returns a deleted transaction so Undo can save it again', async () => {
    const account = await checking()
    const food = await createCategory(db, me, {
      kind: 'expense',
      name: 'Jídlo',
    })
    const txId = id()
    const input = {
      kind: 'expense' as const,
      date: '2026-11-26',
      accountId: account.id,
      amountMinor: 100,
      categoryId: food.id,
    }
    await createTransaction(db, me, txId, input)
    const deleted = await deleteTransaction(db, me, txId)
    expect(await listTransactions(db, me)).toHaveLength(0)
    await createTransaction(db, me, deleted.id, input)
    expect(await listTransactions(db, me)).toHaveLength(1)
  })
})

describe('categories and monthly values', () => {
  it('refuses a duplicate category name regardless of case', async () => {
    await createCategory(db, me, { kind: 'expense', name: 'Jídlo' })
    await expect(
      createCategory(db, me, { kind: 'expense', name: 'jídlo' }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    const other_ = await createCategory(db, me, {
      kind: 'expense',
      name: 'Doprava',
    })
    await expect(
      updateCategory(db, me, other_.id, { name: 'JÍDLO' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(
      (await updateCategory(db, me, other_.id, { name: 'MHD', archived: true }))
        .archived,
    ).toBe(true)
    await expect(updateCategory(db, me, other_.id, {})).rejects.toMatchObject({
      code: 'INVALID',
    })
    // The same name is fine for income and for another user.
    await createCategory(db, me, { kind: 'income', name: 'Jídlo' })
    await createCategory(db, other, { kind: 'expense', name: 'Jídlo' })
  })

  it('takes monthly values only for investment accounts, one per month', async () => {
    const fund = await createAccount(db, me, {
      name: 'Fond',
      type: 'managed_fund',
      currency: 'CZK',
      openedOn: '2026-01-01',
    })
    await setMonthValue(db, me, {
      accountId: fund.id,
      month: '2026-10',
      valueMinor: 1_000_000,
    })
    const updated = await setMonthValue(db, me, {
      accountId: fund.id,
      month: '2026-10',
      valueMinor: 1_050_000,
    })
    expect(updated.valueMinor).toBe(1_050_000)
    await expect(
      setMonthValue(db, me, {
        accountId: (await checking()).id,
        month: '2026-10',
        valueMinor: 1,
      }),
    ).rejects.toThrow('investment')
    await expect(
      setMonthValue(db, other, {
        accountId: fund.id,
        month: '2026-10',
        valueMinor: 1,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})
