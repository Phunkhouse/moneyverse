'use server'

import { refresh } from 'next/cache'
import { IMPORT_MAX_BYTES } from '@/server/money/limits.ts'
import {
  importLedger,
  LedgerNotEmptyError,
  parseExportFile,
} from '@/server/money/transfer-file.ts'
import { MoneyError } from '@/server/money/types.ts'
import { cs } from '@/ui/messages.ts'
import { getDb } from '../../_lib/db.ts'
import { requireUser } from '../../_lib/session.ts'

export type ImportState =
  | { status: 'idle' }
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string }

/** Imports an export file into the signed-in user's empty ledger, all or nothing (AC-13). */
export async function importAction(
  _previous: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const user = await requireUser()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: cs.data.noFile }
  }
  if (file.size > IMPORT_MAX_BYTES) {
    return { status: 'error', message: cs.data.tooLarge }
  }
  try {
    const parsed = parseExportFile(await file.text())
    const summary = await importLedger(getDb(), user.id, parsed)
    refresh()
    return { status: 'ok', message: cs.data.imported(summary) }
  } catch (error) {
    // Only "the ledger already has data" is about the app; everything else is about the file.
    if (error instanceof LedgerNotEmptyError) {
      return { status: 'error', message: cs.data.notEmpty }
    }
    if (error instanceof MoneyError) {
      return { status: 'error', message: cs.data.invalidFile }
    }
    console.error(
      'Import failed:',
      error instanceof Error ? error.message : error,
    )
    return { status: 'error', message: cs.forms.failed }
  }
}
