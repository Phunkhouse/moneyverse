import { describe, expect, it } from 'vitest'
import type { Transaction } from './ledger.ts'
import { categoryScores, lastUsedAccountId, toInput } from './usage.ts'

let seq = 0
const tx = (over: Partial<Transaction>): Transaction => ({
  id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`,
  userId: 'u',
  kind: 'expense',
  date: '2026-11-01',
  accountId: 'bank',
  amountMinor: 100,
  categoryId: 'food',
  categoryKind: 'expense',
  toAccountId: null,
  toAmountMinor: null,
  what: null,
  note: null,
  createdAt: new Date(Date.UTC(2026, 10, 1, 0, 0, seq)),
  updatedAt: new Date(),
  ...over,
})

describe('quick add pre-fills', () => {
  it('ranks categories by recent use, newest weighing most', () => {
    const list = [
      tx({ date: '2026-11-01', categoryId: 'fun' }),
      tx({ date: '2026-11-02', categoryId: 'food' }),
      tx({ date: '2026-11-03', categoryId: 'food' }),
      tx({ date: '2026-11-04', categoryId: 'fun' }),
    ]
    const scores = categoryScores(list, 4)
    // food: 3 + 2 = 5; fun: 4 + 1 = 5; a window of 3 drops the oldest.
    expect(scores.get('food')).toBe(5)
    expect(scores.get('fun')).toBe(5)
    expect(categoryScores(list, 3).get('fun')).toBe(3)
  })

  it('pre-fills the account of the last saved expense or income, ignoring transfers', () => {
    const list = [
      tx({ accountId: 'bank' }),
      tx({ accountId: 'card' }),
      tx({
        kind: 'transfer',
        accountId: 'savings',
        categoryId: null,
        toAccountId: 'bank',
        toAmountMinor: 100,
      }),
    ]
    expect(lastUsedAccountId(list)).toBe('card')
    expect(lastUsedAccountId([])).toBeNull()
  })

  it('turns a stored transfer back into input for Undo', () => {
    const transfer = tx({
      kind: 'transfer',
      categoryId: null,
      categoryKind: null,
      toAccountId: 'card',
      toAmountMinor: 99,
    })
    expect(toInput(transfer)).toEqual({
      kind: 'transfer',
      date: '2026-11-01',
      accountId: 'bank',
      amountMinor: 100,
      toAccountId: 'card',
      toAmountMinor: 99,
      what: null,
      note: null,
    })
  })
})
