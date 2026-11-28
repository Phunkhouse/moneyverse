// Export and re-import of a user's whole ledger (R-18, AC-13). The file is JSON with a format name
// and version, amounts in minor units with their currency, and no user ids, sessions or rates:
// it is the user's own data and nothing else. Import goes into an empty ledger only, all or
// nothing, with fresh ids and every row checked by the same ledger rules as the screens.
import { and, eq, inArray } from 'drizzle-orm'
import type { Db } from '../db/client.ts'
import {
  category,
  moneyAccount,
  moneyTransaction,
  monthValue,
} from '../db/schema.ts'
import { isDay, isMonth } from './calendar.ts'
import {
  createAccount,
  createCategory,
  listAccounts,
  listCategories,
  listMonthValues,
  listTransactions,
  optionalText,
} from './ledger.ts'
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  MoneyError,
  VALUE_TRACKED,
  type AccountType,
  type Currency,
} from './types.ts'

export const FILE_FORMAT = 'moneyverse-export'
export const FILE_VERSION = 1

export type ExportFile = {
  format: typeof FILE_FORMAT
  version: typeof FILE_VERSION
  exportedAt: string
  accounts: {
    id: string
    name: string
    type: AccountType
    currency: Currency
    openingBalanceMinor: number
    openedOn: string
    archived: boolean
  }[]
  categories: {
    id: string
    kind: 'expense' | 'income'
    name: string
    archived: boolean
  }[]
  transactions: {
    id: string
    kind: 'expense' | 'income' | 'transfer'
    date: string
    accountId: string
    amountMinor: number
    categoryId: string | null
    toAccountId: string | null
    toAmountMinor: number | null
    what: string | null
    note: string | null
  }[]
  monthValues: { accountId: string; month: string; valueMinor: number }[]
}

/** Everything the user owns, as a file they can keep and import again. */
export async function exportLedger(
  db: Db,
  userId: string,
  now = new Date(),
): Promise<ExportFile> {
  const [accounts, categories, transactions, values] = await Promise.all([
    listAccounts(db, userId),
    listCategories(db, userId),
    listTransactions(db, userId),
    listMonthValues(db, userId),
  ])
  const byDate = <T extends { createdAt: Date }>(a: T, b: T) =>
    a.createdAt.getTime() - b.createdAt.getTime()
  return {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    exportedAt: now.toISOString(),
    accounts: accounts.sort(byDate).map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currency: a.currency,
      openingBalanceMinor: a.openingBalanceMinor,
      openedOn: a.openedOn,
      archived: a.archived,
    })),
    categories: categories.sort(byDate).map((c) => ({
      id: c.id,
      kind: c.kind,
      name: c.name,
      archived: c.archived,
    })),
    transactions: transactions
      .sort((a, b) =>
        a.date === b.date ? byDate(a, b) : a.date < b.date ? -1 : 1,
      )
      .map((t) => ({
        id: t.id,
        kind: t.kind,
        date: t.date,
        accountId: t.accountId,
        amountMinor: t.amountMinor,
        categoryId: t.categoryId,
        toAccountId: t.toAccountId,
        toAmountMinor: t.toAmountMinor,
        what: t.what,
        note: t.note,
      })),
    monthValues: values
      .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0))
      .map((v) => ({
        accountId: v.accountId,
        month: v.month,
        valueMinor: v.valueMinor,
      })),
  }
}

// ---- Reading a file ----

const invalid = (what: string) =>
  new MoneyError('INVALID', `Not a valid export file: ${what}`)

function object(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalid(what)
  return value as Record<string, unknown>
}

function list(value: unknown, what: string): unknown[] {
  if (!Array.isArray(value)) throw invalid(what)
  return value
}

const str = (v: unknown, what: string) => {
  if (typeof v !== 'string') throw invalid(what)
  return v
}
const nullableStr = (v: unknown, what: string) =>
  v === null || v === undefined ? null : str(v, what)
const int = (v: unknown, what: string) => {
  if (typeof v !== 'number' || !Number.isSafeInteger(v)) throw invalid(what)
  return v
}
const bool = (v: unknown, what: string) => {
  if (typeof v !== 'boolean') throw invalid(what)
  return v
}
function oneOf<T extends string>(
  v: unknown,
  options: readonly T[],
  what: string,
): T {
  if (!options.includes(v as T)) throw invalid(what)
  return v as T
}

/**
 * Checks a file's shape and every reference in it before anything is written. Values are
 * checked again by the ledger rules during import.
 */
export function parseExportFile(text: string): ExportFile {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw invalid('not JSON')
  }
  const root = object(json, 'root')
  if (root.format !== FILE_FORMAT) throw invalid('format')
  if (root.version !== FILE_VERSION)
    throw invalid(`version ${String(root.version)}`)

  const accounts = list(root.accounts, 'accounts').map((raw, i) => {
    const a = object(raw, `accounts[${i}]`)
    const openedOn = str(a.openedOn, `accounts[${i}].openedOn`)
    if (!isDay(openedOn)) throw invalid(`accounts[${i}].openedOn`)
    return {
      id: str(a.id, `accounts[${i}].id`),
      name: str(a.name, `accounts[${i}].name`),
      type: oneOf(a.type, ACCOUNT_TYPES, `accounts[${i}].type`),
      currency: oneOf(a.currency, CURRENCIES, `accounts[${i}].currency`),
      openingBalanceMinor: int(
        a.openingBalanceMinor,
        `accounts[${i}].openingBalanceMinor`,
      ),
      openedOn,
      archived: bool(a.archived, `accounts[${i}].archived`),
    }
  })
  const categories = list(root.categories, 'categories').map((raw, i) => {
    const c = object(raw, `categories[${i}]`)
    return {
      id: str(c.id, `categories[${i}].id`),
      kind: oneOf(
        c.kind,
        ['expense', 'income'] as const,
        `categories[${i}].kind`,
      ),
      name: str(c.name, `categories[${i}].name`),
      archived: bool(c.archived, `categories[${i}].archived`),
    }
  })
  const accountIds = new Set(accounts.map((a) => a.id))
  const categoryIds = new Set(categories.map((c) => c.id))
  if (accountIds.size !== accounts.length) throw invalid('repeated account id')
  if (categoryIds.size !== categories.length)
    throw invalid('repeated category id')

  const transactions = list(root.transactions, 'transactions').map((raw, i) => {
    const t = object(raw, `transactions[${i}]`)
    const where = `transactions[${i}]`
    const date = str(t.date, `${where}.date`)
    if (!isDay(date)) throw invalid(`${where}.date`)
    const accountId = str(t.accountId, `${where}.accountId`)
    const categoryId = nullableStr(t.categoryId, `${where}.categoryId`)
    const toAccountId = nullableStr(t.toAccountId, `${where}.toAccountId`)
    if (!accountIds.has(accountId)) throw invalid(`${where}.accountId`)
    if (categoryId !== null && !categoryIds.has(categoryId))
      throw invalid(`${where}.categoryId`)
    if (toAccountId !== null && !accountIds.has(toAccountId))
      throw invalid(`${where}.toAccountId`)
    return {
      id: str(t.id, `${where}.id`),
      kind: oneOf(
        t.kind,
        ['expense', 'income', 'transfer'] as const,
        `${where}.kind`,
      ),
      date,
      accountId,
      amountMinor: int(t.amountMinor, `${where}.amountMinor`),
      categoryId,
      toAccountId,
      toAmountMinor:
        t.toAmountMinor === null || t.toAmountMinor === undefined
          ? null
          : int(t.toAmountMinor, `${where}.toAmountMinor`),
      what: nullableStr(t.what, `${where}.what`),
      note: nullableStr(t.note, `${where}.note`),
    }
  })
  const monthValues = list(root.monthValues, 'monthValues').map((raw, i) => {
    const v = object(raw, `monthValues[${i}]`)
    const accountId = str(v.accountId, `monthValues[${i}].accountId`)
    const month = str(v.month, `monthValues[${i}].month`)
    if (!accountIds.has(accountId)) throw invalid(`monthValues[${i}].accountId`)
    if (!isMonth(month)) throw invalid(`monthValues[${i}].month`)
    return {
      accountId,
      month,
      valueMinor: int(v.valueMinor, `monthValues[${i}].valueMinor`),
    }
  })
  return {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    exportedAt: str(root.exportedAt, 'exportedAt'),
    accounts,
    categories,
    transactions,
    monthValues,
  }
}

// ---- Importing ----

export type ImportSummary = {
  accounts: number
  categories: number
  transactions: number
  monthValues: number
}

/** Thrown when the user already has data: the only reason an import is refused for state. */
export class LedgerNotEmptyError extends MoneyError {
  constructor() {
    super('CONFLICT', 'Import needs an empty ledger')
    this.name = 'LedgerNotEmptyError'
  }
}

/** Rows per insert statement: few round trips to Turso, well under SQLite's parameter limit. */
const BATCH = 100

async function insertInBatches<T>(
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += BATCH)
    await insert(rows.slice(i, i + BATCH))
}

/**
 * Imports a parsed file into the user's ledger, which must be empty (no accounts, categories or
 * transactions), so an import never mixes with or doubles existing data. Everything, including
 * that check, runs in one database transaction: a second import started at the same time waits
 * and then finds the data, and any invalid row rolls everything back.
 *
 * Accounts and categories go through the ledger functions. Transactions and monthly values are
 * checked here in memory against the same rules (the database constraints check them again) and
 * written in batches, because one query per row is thousands of round trips to Turso.
 */
export async function importLedger(
  db: Db,
  userId: string,
  file: ExportFile,
): Promise<ImportSummary> {
  return db.transaction(async (tx) => {
    // The transaction handle has the same query API as the database; the ledger functions only
    // use that API.
    const t = tx as unknown as Db
    const [accounts, categories, transactions] = await Promise.all([
      listAccounts(t, userId),
      listCategories(t, userId),
      listTransactions(t, userId),
    ])
    if (accounts.length || categories.length || transactions.length) {
      throw new LedgerNotEmptyError()
    }

    // Everything is created active first: archived accounts and categories take no new
    // transactions (ADR 0005). Archiving is restored at the end.
    const accountMap = new Map<
      string,
      { id: string; currency: Currency; type: AccountType }
    >()
    for (const a of file.accounts) {
      const created = await createAccount(t, userId, {
        name: a.name,
        type: a.type,
        currency: a.currency,
        openingBalanceMinor: a.openingBalanceMinor,
        openedOn: a.openedOn,
      })
      accountMap.set(a.id, {
        id: created.id,
        currency: created.currency,
        type: created.type,
      })
    }
    const categoryMap = new Map<
      string,
      { id: string; kind: 'expense' | 'income' }
    >()
    for (const c of file.categories) {
      try {
        const created = await createCategory(t, userId, {
          kind: c.kind,
          name: c.name,
        })
        categoryMap.set(c.id, { id: created.id, kind: created.kind })
      } catch (error) {
        // Two categories whose names match ignoring case: a problem with the file, not the ledger.
        if (error instanceof MoneyError && error.code === 'CONFLICT') {
          throw new MoneyError(
            'INVALID',
            `Not a valid export file: repeated category "${c.name}"`,
          )
        }
        throw error
      }
    }

    const transactionRows = file.transactions.map((x, i) => {
      const where = `transactions[${i}]`
      const bad = (what: string) =>
        new MoneyError('INVALID', `${where}: ${what}`)
      if (x.amountMinor <= 0) throw bad('amountMinor must be positive')
      const from = accountMap.get(x.accountId)!
      const row = {
        id: crypto.randomUUID(),
        userId,
        kind: x.kind,
        date: x.date,
        accountId: from.id,
        amountMinor: x.amountMinor,
        what: optionalText(x.what, `${where}.what`),
        note: optionalText(x.note, `${where}.note`),
      }
      if (x.kind === 'transfer') {
        if (x.categoryId !== null) throw bad('a transfer has no category')
        const to =
          x.toAccountId === null ? undefined : accountMap.get(x.toAccountId)
        if (!to) throw bad('a transfer needs a target account')
        if (to.id === from.id)
          throw bad('a transfer needs two different accounts')
        let toAmountMinor = x.amountMinor
        if (to.currency !== from.currency) {
          if (x.toAmountMinor === null || x.toAmountMinor <= 0) {
            throw bad('toAmountMinor must be positive across currencies')
          }
          toAmountMinor = x.toAmountMinor
        } else if (
          x.toAmountMinor !== null &&
          x.toAmountMinor !== x.amountMinor
        ) {
          throw bad('same-currency transfers move one amount')
        }
        return {
          ...row,
          categoryId: null,
          categoryKind: null,
          toAccountId: to.id,
          toAmountMinor,
        }
      }
      if (x.toAccountId !== null || x.toAmountMinor !== null)
        throw bad('only a transfer has a target')
      const cat =
        x.categoryId === null ? undefined : categoryMap.get(x.categoryId)
      if (!cat) throw bad('categoryId is required')
      if (cat.kind !== x.kind)
        throw bad(`an ${x.kind} needs an ${x.kind} category`)
      return {
        ...row,
        categoryId: cat.id,
        categoryKind: cat.kind,
        toAccountId: null,
        toAmountMinor: null,
      }
    })
    await insertInBatches(transactionRows, (batch) =>
      t.insert(moneyTransaction).values(batch),
    )

    const seenMonths = new Set<string>()
    const valueRows = file.monthValues.map((v, i) => {
      const account = accountMap.get(v.accountId)!
      if (!VALUE_TRACKED.has(account.type)) {
        throw new MoneyError(
          'INVALID',
          `monthValues[${i}]: only investment accounts take monthly values`,
        )
      }
      const key = `${account.id}:${v.month}`
      if (seenMonths.has(key))
        throw new MoneyError('INVALID', `monthValues[${i}]: repeated month`)
      seenMonths.add(key)
      return {
        id: crypto.randomUUID(),
        userId,
        accountId: account.id,
        month: v.month,
        valueMinor: v.valueMinor,
      }
    })
    await insertInBatches(valueRows, (batch) =>
      t.insert(monthValue).values(batch),
    )

    const archivedAccounts = file.accounts
      .filter((a) => a.archived)
      .map((a) => accountMap.get(a.id)!.id)
    if (archivedAccounts.length) {
      await t
        .update(moneyAccount)
        .set({ archived: true })
        .where(
          and(
            eq(moneyAccount.userId, userId),
            inArray(moneyAccount.id, archivedAccounts),
          ),
        )
    }
    const archivedCategories = file.categories
      .filter((c) => c.archived)
      .map((c) => categoryMap.get(c.id)!.id)
    if (archivedCategories.length) {
      await t
        .update(category)
        .set({ archived: true })
        .where(
          and(
            eq(category.userId, userId),
            inArray(category.id, archivedCategories),
          ),
        )
    }
    return {
      accounts: file.accounts.length,
      categories: file.categories.length,
      transactions: file.transactions.length,
      monthValues: file.monthValues.length,
    }
  })
}
