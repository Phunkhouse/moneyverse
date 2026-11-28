// What quick add pre-fills (W-4): categories in order of recent use, and the account used last.
import type { Transaction, TransactionInput } from './ledger.ts'

/** Newest first: by day, then by when it was saved. */
export function newestFirst(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return b.createdAt.getTime() - a.createdAt.getTime()
}

/**
 * A score per category from the last `window` transactions: the newest counts `window`, the
 * next `window - 1`, and so on (the prototype's rule). Most used and recent come first.
 */
export function categoryScores(
  transactions: Transaction[],
  window = 60,
): Map<string, number> {
  const scores = new Map<string, number>()
  transactions
    .slice()
    .sort(newestFirst)
    .slice(0, window)
    .forEach((tx, index) => {
      if (tx.categoryId) {
        scores.set(
          tx.categoryId,
          (scores.get(tx.categoryId) ?? 0) + (window - index),
        )
      }
    })
  return scores
}

/** The account of the most recently saved expense or income, for pre-filling the next one. */
export function lastUsedAccountId(transactions: Transaction[]): string | null {
  let latest: Transaction | null = null
  for (const tx of transactions) {
    if (tx.kind === 'transfer') continue
    if (!latest || tx.createdAt > latest.createdAt) latest = tx
  }
  return latest?.accountId ?? null
}

/** A stored transaction as input again, for editing it or restoring it with Undo. */
export function toInput(tx: Transaction): TransactionInput {
  const common = {
    date: tx.date,
    accountId: tx.accountId,
    amountMinor: tx.amountMinor,
    what: tx.what,
    note: tx.note,
  }
  if (tx.kind === 'transfer') {
    return {
      ...common,
      kind: 'transfer',
      toAccountId: tx.toAccountId!,
      toAmountMinor: tx.toAmountMinor!,
    }
  }
  return { ...common, kind: tx.kind, categoryId: tx.categoryId! }
}
