// Writing the ledger: accounts, categories, transactions and monthly values. Every function takes
// the signed-in user's id and touches only that user's rows (A-9, AC-12). Input is validated
// here, on the server, whatever the form already checked.
import { and, eq } from 'drizzle-orm'
import type { Db } from '../db/client.ts'
import {
  category,
  moneyAccount,
  moneyTransaction,
  monthValue,
} from '../db/schema.ts'
import { assertMinor } from './arithmetic.ts'
import { assertDay, assertMonth } from './calendar.ts'
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  MoneyError,
  VALUE_TRACKED,
  type AccountType,
  type CategoryKind,
  type Currency,
  type Day,
  type Month,
} from './types.ts'

export type Account = typeof moneyAccount.$inferSelect
export type Category = typeof category.$inferSelect
export type Transaction = typeof moneyTransaction.$inferSelect
export type MonthValue = typeof monthValue.$inferSelect

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_NAME = 80
const MAX_TEXT = 500

function assertId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new MoneyError('INVALID', `${field} must be a UUID`)
  }
  return value.toLowerCase()
}

function assertName(value: unknown, field: string): string {
  const name = typeof value === 'string' ? value.trim() : ''
  if (!name || name.length > MAX_NAME) {
    throw new MoneyError(
      'INVALID',
      `${field} must have 1 to ${MAX_NAME} characters`,
    )
  }
  return name
}

function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || value.length > MAX_TEXT) {
    throw new MoneyError(
      'INVALID',
      `${field} must be text of at most ${MAX_TEXT} characters`,
    )
  }
  return value.trim() || null
}

function assertOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
  field: string,
): T {
  if (!options.includes(value as T)) {
    throw new MoneyError(
      'INVALID',
      `${field} must be one of ${options.join(', ')}`,
    )
  }
  return value as T
}

// ---- Accounts ----

export type NewAccount = {
  name: string
  type: AccountType
  currency: Currency
  openingBalanceMinor?: number
  openedOn: Day
}

export async function createAccount(db: Db, userId: string, input: NewAccount) {
  const [account] = await db
    .insert(moneyAccount)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: assertName(input.name, 'name'),
      type: assertOneOf(input.type, ACCOUNT_TYPES, 'type'),
      currency: assertOneOf(input.currency, CURRENCIES, 'currency'),
      openingBalanceMinor: assertMinor(
        input.openingBalanceMinor ?? 0,
        'openingBalanceMinor',
      ),
      openedOn: assertDay(input.openedOn, 'openedOn'),
    })
    .returning()
  return account
}

/** Name, opening balance, opening day and archiving can change; type and currency cannot. */
export async function updateAccount(
  db: Db,
  userId: string,
  accountId: string,
  changes: Partial<
    Pick<NewAccount, 'name' | 'openingBalanceMinor' | 'openedOn'>
  > & {
    archived?: boolean
  },
) {
  const set: Partial<typeof moneyAccount.$inferInsert> = {}
  if (changes.name !== undefined) set.name = assertName(changes.name, 'name')
  if (changes.openingBalanceMinor !== undefined) {
    set.openingBalanceMinor = assertMinor(
      changes.openingBalanceMinor,
      'openingBalanceMinor',
    )
  }
  if (changes.openedOn !== undefined)
    set.openedOn = assertDay(changes.openedOn, 'openedOn')
  if (changes.archived !== undefined) set.archived = changes.archived === true
  const [account] = await db
    .update(moneyAccount)
    .set(set)
    .where(and(eq(moneyAccount.id, accountId), eq(moneyAccount.userId, userId)))
    .returning()
  if (!account) throw new MoneyError('NOT_FOUND', 'Account not found')
  return account
}

export async function listAccounts(db: Db, userId: string) {
  return db.select().from(moneyAccount).where(eq(moneyAccount.userId, userId))
}

async function getAccount(
  db: Db,
  userId: string,
  accountId: unknown,
  field: string,
) {
  if (typeof accountId !== 'string')
    throw new MoneyError('INVALID', `${field} is required`)
  const [account] = await db
    .select()
    .from(moneyAccount)
    .where(and(eq(moneyAccount.id, accountId), eq(moneyAccount.userId, userId)))
  // Another user's account is reported exactly like a missing one.
  if (!account) throw new MoneyError('NOT_FOUND', `${field}: account not found`)
  return account
}

// ---- Categories ----

export async function createCategory(
  db: Db,
  userId: string,
  input: { kind: CategoryKind; name: string },
) {
  const kind = assertOneOf(input.kind, ['expense', 'income'] as const, 'kind')
  const name = assertName(input.name, 'name')
  try {
    const [created] = await db
      .insert(category)
      .values({ id: crypto.randomUUID(), userId, kind, name })
      .returning()
    return created
  } catch (error) {
    if (
      String((error as { cause?: unknown })?.cause ?? error).includes('UNIQUE')
    ) {
      throw new MoneyError(
        'CONFLICT',
        'A category with this name already exists',
      )
    }
    throw error
  }
}

export async function listCategories(db: Db, userId: string) {
  return db.select().from(category).where(eq(category.userId, userId))
}

// ---- Transactions ----

export type TransactionInput =
  | {
      kind: 'expense' | 'income'
      date: Day
      accountId: string
      amountMinor: number
      categoryId: string
      what?: string | null
      note?: string | null
    }
  | {
      kind: 'transfer'
      date: Day
      accountId: string
      amountMinor: number
      toAccountId: string
      /** Required when the accounts' currencies differ; equal to `amountMinor` otherwise. */
      toAmountMinor?: number
      what?: string | null
      note?: string | null
    }

/** Validates input against the user's own accounts and categories; returns the row to store. */
async function validate(db: Db, userId: string, input: TransactionInput) {
  const kind = assertOneOf(
    input.kind,
    ['expense', 'income', 'transfer'] as const,
    'kind',
  )
  const date = assertDay(input.date, 'date')
  const amountMinor = assertMinor(input.amountMinor, 'amountMinor', {
    positive: true,
  })
  const account = await getAccount(db, userId, input.accountId, 'accountId')
  const common = {
    kind,
    date,
    accountId: account.id,
    amountMinor,
    what: optionalText(input.what, 'what'),
    note: optionalText(input.note, 'note'),
  }
  if (input.kind === 'transfer') {
    const to = await getAccount(db, userId, input.toAccountId, 'toAccountId')
    if (to.id === account.id) {
      throw new MoneyError('INVALID', 'A transfer needs two different accounts')
    }
    let toAmountMinor = amountMinor
    if (to.currency !== account.currency) {
      // Both amounts are kept, so the bank's real rate is recorded (ADR 0003, AC-15).
      toAmountMinor = assertMinor(input.toAmountMinor, 'toAmountMinor', {
        positive: true,
      })
    } else if (
      input.toAmountMinor !== undefined &&
      input.toAmountMinor !== amountMinor
    ) {
      throw new MoneyError('INVALID', 'Same-currency transfers move one amount')
    }
    return {
      ...common,
      categoryId: null,
      categoryKind: null,
      toAccountId: to.id,
      toAmountMinor,
    }
  }
  if (typeof input.categoryId !== 'string') {
    throw new MoneyError('INVALID', 'categoryId is required')
  }
  const [found] = await db
    .select()
    .from(category)
    .where(and(eq(category.id, input.categoryId), eq(category.userId, userId)))
  if (!found)
    throw new MoneyError('NOT_FOUND', 'categoryId: category not found')
  if (found.kind !== kind) {
    throw new MoneyError('INVALID', `An ${kind} needs an ${kind} category`)
  }
  return {
    ...common,
    categoryId: found.id,
    categoryKind: found.kind,
    toAccountId: null,
    toAmountMinor: null,
  }
}

const SAME_FIELDS = [
  'kind',
  'date',
  'accountId',
  'amountMinor',
  'categoryId',
  'toAccountId',
  'toAmountMinor',
  'what',
  'note',
] as const

/**
 * Saves a transaction under the id the client chose. Saving the same id and content again
 * returns the stored row instead of a second one, so a double tap or a retry is harmless.
 * The same id with different content is a conflict.
 */
export async function createTransaction(
  db: Db,
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<Transaction> {
  const txId = assertId(id, 'id')
  const row = await validate(db, userId, input)
  const [inserted] = await db
    .insert(moneyTransaction)
    .values({ id: txId, userId, ...row })
    .onConflictDoNothing({ target: moneyTransaction.id })
    .returning()
  if (inserted) return inserted
  const [existing] = await db
    .select()
    .from(moneyTransaction)
    .where(
      and(eq(moneyTransaction.id, txId), eq(moneyTransaction.userId, userId)),
    )
  const same =
    existing &&
    SAME_FIELDS.every(
      (field) => existing[field] === (row as Record<string, unknown>)[field],
    )
  if (!same) throw new MoneyError('CONFLICT', 'This id is already used')
  return existing
}

export async function updateTransaction(
  db: Db,
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<Transaction> {
  const row = await validate(db, userId, input)
  const [updated] = await db
    .update(moneyTransaction)
    .set(row)
    .where(
      and(
        eq(moneyTransaction.id, assertId(id, 'id')),
        eq(moneyTransaction.userId, userId),
      ),
    )
    .returning()
  if (!updated) throw new MoneyError('NOT_FOUND', 'Transaction not found')
  return updated
}

/** Deletes a transaction; returns it so the caller can offer Undo by saving it again. */
export async function deleteTransaction(db: Db, userId: string, id: string) {
  const [deleted] = await db
    .delete(moneyTransaction)
    .where(
      and(
        eq(moneyTransaction.id, assertId(id, 'id')),
        eq(moneyTransaction.userId, userId),
      ),
    )
    .returning()
  if (!deleted) throw new MoneyError('NOT_FOUND', 'Transaction not found')
  return deleted
}

export async function listTransactions(db: Db, userId: string) {
  return db
    .select()
    .from(moneyTransaction)
    .where(eq(moneyTransaction.userId, userId))
}

// ---- Monthly values ----

/** Sets the value of a value-tracked account for a month, replacing an earlier one (R-8). */
export async function setMonthValue(
  db: Db,
  userId: string,
  input: { accountId: string; month: Month; valueMinor: number },
): Promise<MonthValue> {
  const account = await getAccount(db, userId, input.accountId, 'accountId')
  if (!VALUE_TRACKED.has(account.type)) {
    throw new MoneyError(
      'INVALID',
      'Only investment accounts take monthly values',
    )
  }
  const month = assertMonth(input.month, 'month')
  const valueMinor = assertMinor(input.valueMinor, 'valueMinor')
  const [stored] = await db
    .insert(monthValue)
    .values({
      id: crypto.randomUUID(),
      userId,
      accountId: account.id,
      month,
      valueMinor,
    })
    .onConflictDoUpdate({
      target: [monthValue.accountId, monthValue.month],
      set: { valueMinor },
    })
    .returning()
  return stored
}

export async function deleteMonthValue(
  db: Db,
  userId: string,
  input: { accountId: string; month: Month },
) {
  await db
    .delete(monthValue)
    .where(
      and(
        eq(monthValue.userId, userId),
        eq(monthValue.accountId, input.accountId),
        eq(monthValue.month, assertMonth(input.month, 'month')),
      ),
    )
}

export async function listMonthValues(db: Db, userId: string) {
  return db.select().from(monthValue).where(eq(monthValue.userId, userId))
}
