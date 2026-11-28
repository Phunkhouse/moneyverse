// Export and re-import of a user's whole ledger (R-18, AC-13). The file is JSON with a format name
// and version, amounts in minor units with their currency, and no user ids, sessions or rates:
// it is the user's own data and nothing else. Import goes into an empty ledger only, all or
// nothing, with fresh ids and every row checked by the same ledger rules as the screens.
import { and, eq } from 'drizzle-orm'
import type { Db } from '../db/client.ts'
import { category, moneyAccount } from '../db/schema.ts'
import { isDay, isMonth } from './calendar.ts'
import {
  createAccount,
  createCategory,
  createTransaction,
  listAccounts,
  listCategories,
  listMonthValues,
  listTransactions,
  setMonthValue,
  type TransactionInput,
} from './ledger.ts'
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  MoneyError,
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
    exportedAt: typeof root.exportedAt === 'string' ? root.exportedAt : '',
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

/**
 * Imports a parsed file into the user's ledger, which must be empty (no accounts, categories or
 * transactions), so an import never mixes with or doubles existing data. Runs in one database
 * transaction: any invalid row rolls everything back.
 */
export async function importLedger(
  db: Db,
  userId: string,
  file: ExportFile,
): Promise<ImportSummary> {
  const [accounts, categories, transactions] = await Promise.all([
    listAccounts(db, userId),
    listCategories(db, userId),
    listTransactions(db, userId),
  ])
  if (accounts.length || categories.length || transactions.length) {
    throw new MoneyError('CONFLICT', 'Import needs an empty ledger')
  }
  return db.transaction(async (tx) => {
    // The transaction handle has the same query API as the database; the ledger functions only
    // use that API.
    const t = tx as unknown as Db
    const accountIds = new Map<string, string>()
    const categoryIds = new Map<string, string>()
    // Everything is created active first: archived accounts and categories take no new
    // transactions (ADR 0005). Archiving is restored at the end.
    for (const a of file.accounts) {
      const created = await createAccount(t, userId, {
        name: a.name,
        type: a.type,
        currency: a.currency,
        openingBalanceMinor: a.openingBalanceMinor,
        openedOn: a.openedOn,
      })
      accountIds.set(a.id, created.id)
    }
    for (const c of file.categories) {
      const created = await createCategory(t, userId, {
        kind: c.kind,
        name: c.name,
      })
      categoryIds.set(c.id, created.id)
    }
    for (const x of file.transactions) {
      const common = {
        date: x.date,
        accountId: accountIds.get(x.accountId)!,
        amountMinor: x.amountMinor,
        what: x.what,
        note: x.note,
      }
      const input: TransactionInput =
        x.kind === 'transfer'
          ? {
              ...common,
              kind: 'transfer',
              toAccountId: accountIds.get(x.toAccountId ?? '') ?? '',
              toAmountMinor: x.toAmountMinor ?? undefined,
            }
          : {
              ...common,
              kind: x.kind,
              categoryId: categoryIds.get(x.categoryId ?? '') ?? '',
            }
      // A fresh id: the file's ids may already exist in this database (another user, a restore).
      await createTransaction(t, userId, crypto.randomUUID(), input)
    }
    for (const v of file.monthValues) {
      await setMonthValue(t, userId, {
        accountId: accountIds.get(v.accountId)!,
        month: v.month,
        valueMinor: v.valueMinor,
      })
    }
    for (const a of file.accounts.filter((a) => a.archived)) {
      await t
        .update(moneyAccount)
        .set({ archived: true })
        .where(
          and(
            eq(moneyAccount.id, accountIds.get(a.id)!),
            eq(moneyAccount.userId, userId),
          ),
        )
    }
    for (const c of file.categories.filter((c) => c.archived)) {
      await t
        .update(category)
        .set({ archived: true })
        .where(
          and(
            eq(category.id, categoryIds.get(c.id)!),
            eq(category.userId, userId),
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
