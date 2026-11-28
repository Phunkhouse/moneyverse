'use server'

import { refresh } from 'next/cache'
import { assertMonth } from '@/server/money/calendar.ts'
import {
  deleteMonthValue,
  findAccount,
  listMonthValues,
  setMonthValue,
} from '@/server/money/ledger.ts'
import { parseAmount } from '@/server/money/parse.ts'
import { VALUE_TRACKED } from '@/server/money/types.ts'
import { cs } from '@/ui/messages.ts'
import { getDb } from '../../_lib/db.ts'
import { formError } from '../../_lib/forms.ts'
import { requireUser } from '../../_lib/session.ts'

/** How to put the values back as they were before a save: a number, or none (carried). */
export type ValuesUndo = {
  month: string
  previous: { accountId: string; valueMinor: number | null }[]
}

export type ValuesResult =
  | { status: 'ok'; saved: number; undo: ValuesUndo }
  | { status: 'error'; message: string; fields?: Record<string, string> }

/**
 * Saves the values typed for one month (R-8). An empty field leaves the account as it is, so a
 * skipped month keeps carrying the last value (AC-6). Every value is parsed and checked here.
 */
export async function saveMonthValuesAction(
  month: string,
  entries: { accountId: string; value: string }[],
): Promise<ValuesResult> {
  const user = await requireUser()
  const db = getDb()
  try {
    assertMonth(month, 'month')
    const fields: Record<string, string> = {}
    const parsed: { accountId: string; valueMinor: number }[] = []
    for (const entry of entries) {
      try {
        const valueMinor = parseAmount(entry.value)
        if (valueMinor !== null)
          parsed.push({ accountId: entry.accountId, valueMinor })
      } catch {
        fields[entry.accountId] = cs.forms.amountInvalid
      }
    }
    if (Object.keys(fields).length > 0) {
      return { status: 'error', message: cs.forms.invalid, fields }
    }
    // Check every account first, so a bad entry cannot leave the month half saved.
    for (const { accountId } of parsed) {
      const account = await findAccount(db, user.id, accountId)
      if (!VALUE_TRACKED.has(account.type)) {
        return { status: 'error', message: cs.forms.invalid }
      }
    }
    const before = await listMonthValues(db, user.id)
    const undo: ValuesUndo = { month, previous: [] }
    for (const { accountId, valueMinor } of parsed) {
      const old = before.find(
        (v) => v.accountId === accountId && v.month === month,
      )
      // setMonthValue checks that the account is the user's own investment account.
      await setMonthValue(db, user.id, { accountId, month, valueMinor })
      undo.previous.push({ accountId, valueMinor: old?.valueMinor ?? null })
    }
    refresh()
    return { status: 'ok', saved: parsed.length, undo }
  } catch (error) {
    const state = formError(error)
    return {
      status: 'error',
      message: state.status === 'error' ? state.message : cs.forms.failed,
    }
  }
}

/** Reverses a save: restores the earlier values, or removes ones that did not exist. */
export async function undoMonthValuesAction(
  undo: ValuesUndo,
): Promise<{ status: 'ok' } | { status: 'error'; message: string }> {
  const user = await requireUser()
  const db = getDb()
  try {
    const month = assertMonth(undo.month, 'month')
    for (const { accountId, valueMinor } of undo.previous) {
      if (valueMinor === null)
        await deleteMonthValue(db, user.id, { accountId, month })
      else await setMonthValue(db, user.id, { accountId, month, valueMinor })
    }
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
