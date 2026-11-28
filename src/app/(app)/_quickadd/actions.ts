'use server'

import { refresh } from 'next/cache'
import {
  createCategory,
  createTransaction,
  deleteTransaction,
  findAccount,
  getTransaction,
  updateTransaction,
  type TransactionInput,
} from '@/server/money/ledger.ts'
import { parseAmount } from '@/server/money/parse.ts'
import { MoneyError } from '@/server/money/types.ts'
import { toInput } from '@/server/money/usage.ts'
import { formatMoney } from '@/ui/format.ts'
import { cs } from '@/ui/messages.ts'
import { getDb } from '../../_lib/db.ts'
import { formError } from '../../_lib/forms.ts'
import { requireUser } from '../../_lib/session.ts'

/** What the sheet sends. Amounts are the text typed on the keypad; the server parses them. */
export type TransactionPayload = {
  id: string
  mode: 'create' | 'update'
  kind: 'expense' | 'income' | 'transfer'
  date: string
  accountId: string
  amount: string
  categoryId?: string | null
  toAccountId?: string | null
  toAmount?: string | null
  what?: string | null
  note?: string | null
}

/** How to reverse the last change (AC-3). Applied by undoAction, validated again on the server. */
export type UndoOp =
  | { type: 'delete'; id: string }
  | { type: 'restore'; id: string; input: TransactionInput }
  | { type: 'recreate'; id: string; input: TransactionInput }

export type SaveResult =
  | {
      status: 'ok'
      /** The saved amount, formatted; the sheet adds the category or note it shows. */
      amount: string
      undo: UndoOp
    }
  | { status: 'error'; message: string }

function amountOf(text: string | null | undefined): number {
  const minor = parseAmount(text ?? '')
  if (minor === null || minor <= 0)
    throw new MoneyError('INVALID', 'Amount must be positive')
  return minor
}

async function toLedgerInput(
  userId: string,
  p: TransactionPayload,
): Promise<TransactionInput> {
  const common = {
    date: p.date,
    accountId: p.accountId,
    amountMinor: amountOf(p.amount),
    what: p.what,
    note: p.note,
  }
  if (p.kind === 'transfer') {
    const [from, to] = await Promise.all([
      findAccount(getDb(), userId, p.accountId),
      findAccount(getDb(), userId, p.toAccountId),
    ])
    return {
      ...common,
      kind: 'transfer',
      toAccountId: to.id,
      // Same currency: one amount. Different: the amount that arrived, as typed.
      toAmountMinor:
        from.currency === to.currency ? undefined : amountOf(p.toAmount),
    }
  }
  return { ...common, kind: p.kind, categoryId: p.categoryId ?? '' }
}

export async function saveTransactionAction(
  payload: TransactionPayload,
): Promise<SaveResult> {
  const user = await requireUser()
  const db = getDb()
  try {
    const input = await toLedgerInput(user.id, payload)
    const account = await findAccount(db, user.id, input.accountId)
    let undo: UndoOp
    if (payload.mode === 'update') {
      const previous = await getTransaction(db, user.id, payload.id)
      await updateTransaction(db, user.id, payload.id, input)
      undo = { type: 'restore', id: previous.id, input: toInput(previous) }
    } else {
      const created = await createTransaction(db, user.id, payload.id, input)
      undo = { type: 'delete', id: created.id }
    }
    refresh()
    return {
      status: 'ok',
      amount: formatMoney(input.amountMinor, account.currency),
      undo,
    }
  } catch (error) {
    const state = formError(error)
    return {
      status: 'error',
      message: state.status === 'error' ? state.message : cs.forms.failed,
    }
  }
}

export async function deleteTransactionAction(id: string): Promise<SaveResult> {
  const user = await requireUser()
  try {
    const deleted = await deleteTransaction(getDb(), user.id, id)
    refresh()
    const account = await findAccount(getDb(), user.id, deleted.accountId)
    return {
      status: 'ok',
      amount: formatMoney(deleted.amountMinor, account.currency),
      undo: { type: 'recreate', id: deleted.id, input: toInput(deleted) },
    }
  } catch (error) {
    const state = formError(error)
    return {
      status: 'error',
      message: state.status === 'error' ? state.message : cs.forms.failed,
    }
  }
}

/** Reverses a save, edit or delete. Everything goes through the same ledger checks again. */
export async function undoAction(
  op: UndoOp,
): Promise<{ status: 'ok' } | { status: 'error'; message: string }> {
  const user = await requireUser()
  const db = getDb()
  try {
    if (op.type === 'delete') await deleteTransaction(db, user.id, op.id)
    else if (op.type === 'restore')
      await updateTransaction(db, user.id, op.id, op.input)
    else await createTransaction(db, user.id, op.id, op.input)
    refresh()
    return { status: 'ok' }
  } catch (error) {
    const state = formError(error)
    return {
      status: 'error',
      message: state.status === 'error' ? state.message : cs.forms.failed,
    }
  }
}

/** Creates a category during entry without leaving it (AC-4). */
export async function createCategoryInlineAction(
  kind: 'expense' | 'income',
  name: string,
): Promise<
  | {
      status: 'ok'
      category: { id: string; kind: 'expense' | 'income'; name: string }
    }
  | { status: 'error'; message: string }
> {
  const user = await requireUser()
  try {
    const created = await createCategory(getDb(), user.id, { kind, name })
    refresh()
    return {
      status: 'ok',
      category: { id: created.id, kind: created.kind, name: created.name },
    }
  } catch (error) {
    const state = formError(error, cs.categories.duplicate)
    return {
      status: 'error',
      message: state.status === 'error' ? state.message : cs.forms.failed,
    }
  }
}
