'use server'

import { refresh } from 'next/cache'
import { createCategory, updateCategory } from '@/server/money/ledger.ts'
import { cs } from '@/ui/messages.ts'
import { getDb } from '../../_lib/db.ts'
import {
  formError,
  text,
  withValues,
  type FormState,
} from '../../_lib/forms.ts'
import { requireUser } from '../../_lib/session.ts'

function readName(formData: FormData): string | FormState {
  const name = text(formData, 'name').trim()
  if (!name || name.length > 80) {
    return {
      status: 'error',
      message: cs.forms.invalid,
      fields: { name: cs.forms.nameRequired },
    }
  }
  return name
}

export async function createCategoryAction(
  previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return withValues(await createCategory_(previous, formData), formData)
}

async function createCategory_(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser()
  const kind = text(formData, 'kind')
  if (kind !== 'expense' && kind !== 'income') {
    return { status: 'error', message: cs.forms.invalid }
  }
  const name = readName(formData)
  if (typeof name !== 'string') return name
  try {
    await createCategory(getDb(), user.id, { kind, name })
  } catch (error) {
    return formError(error, cs.categories.duplicate)
  }
  refresh()
  return { status: 'ok' }
}

export async function renameCategoryAction(
  previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return withValues(await renameCategory_(previous, formData), formData)
}

async function renameCategory_(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser()
  const name = readName(formData)
  if (typeof name !== 'string') return name
  try {
    await updateCategory(getDb(), user.id, text(formData, 'id'), { name })
  } catch (error) {
    return formError(error, cs.categories.duplicate)
  }
  refresh()
  return { status: 'ok' }
}

export async function setCategoryArchivedAction(
  categoryId: string,
  archived: boolean,
) {
  const user = await requireUser()
  await updateCategory(getDb(), user.id, categoryId, { archived })
  refresh()
}
