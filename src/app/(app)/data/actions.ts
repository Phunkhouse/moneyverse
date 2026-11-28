'use server'

import { refresh } from 'next/cache'
import { importLedger, parseExportFile } from '@/server/money/transfer-file.ts'
import { MoneyError } from '@/server/money/types.ts'
import { cs } from '@/ui/messages.ts'
import { getDb } from '../../_lib/db.ts'
import { requireUser } from '../../_lib/session.ts'

/** Keep in step with `serverActions.bodySizeLimit` in next.config.ts. */
const MAX_BYTES = 5 * 1024 * 1024

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
  if (file.size > MAX_BYTES)
    return { status: 'error', message: cs.data.tooLarge }
  try {
    const parsed = parseExportFile(await file.text())
    const summary = await importLedger(getDb(), user.id, parsed)
    refresh()
    return { status: 'ok', message: cs.data.imported(summary) }
  } catch (error) {
    if (error instanceof MoneyError) {
      return {
        status: 'error',
        message:
          error.code === 'CONFLICT' ? cs.data.notEmpty : cs.data.invalidFile,
      }
    }
    console.error(
      'Import failed:',
      error instanceof Error ? error.message : error,
    )
    return { status: 'error', message: cs.forms.failed }
  }
}
