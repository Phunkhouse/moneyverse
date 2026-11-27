// Money vocabulary (ADR 0003, ADR 0005). src/ui/format.ts keeps its own copy of the currency list
// so client bundles stay free of server code; src/ui/format.test.ts checks they match.

export const CURRENCIES = ['CZK', 'EUR', 'USD'] as const
export type Currency = (typeof CURRENCIES)[number]
export const BASE_CURRENCY: Currency = 'CZK'

export const ACCOUNT_TYPES = [
  'checking',
  'credit_card',
  'savings',
  'brokerage',
  'crypto',
  'managed_fund',
  'retirement',
] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

/** Kinds of account for net worth composition (R-10). */
export type AccountGroup = 'cash' | 'debt' | 'investments'

export const ACCOUNT_GROUP: Record<AccountType, AccountGroup> = {
  checking: 'cash',
  savings: 'cash',
  credit_card: 'debt',
  brokerage: 'investments',
  crypto: 'investments',
  managed_fund: 'investments',
  retirement: 'investments',
}

/**
 * Accounts whose balance is the monthly value the owner enters (R-8), not the sum of
 * transactions. Transfers to and from them are recorded but do not move their balance
 * (assumption O-14).
 */
export const VALUE_TRACKED: ReadonlySet<AccountType> = new Set([
  'brokerage',
  'crypto',
  'managed_fund',
  'retirement',
])

export type TransactionKind = 'expense' | 'income' | 'transfer'
export type CategoryKind = 'expense' | 'income'

/** A calendar day, `YYYY-MM-DD`. */
export type Day = string
/** A calendar month, `YYYY-MM`. */
export type Month = string

export class MoneyError extends Error {
  readonly code: 'INVALID' | 'NOT_FOUND' | 'CONFLICT'
  constructor(code: MoneyError['code'], message: string) {
    super(message)
    this.name = 'MoneyError'
    this.code = code
  }
}
