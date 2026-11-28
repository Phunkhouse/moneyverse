'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { isDay } from '@/server/money/calendar.ts'
import { createAccount, updateAccount } from '@/server/money/ledger.ts'
import { parseAmount } from '@/server/money/parse.ts'
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  type AccountType,
} from '@/server/money/types.ts'
import { cs } from '@/ui/messages.ts'
import { getDb } from '../../_lib/db.ts'
import {
  formError,
  text,
  withValues,
  type FormState,
} from '../../_lib/forms.ts'
import { requireUser } from '../../_lib/session.ts'

type AccountFields = {
  name: string
  openingBalanceMinor: number
  openedOn: string
}

/** Reads the fields both forms share; a credit card's opening debt is typed as a positive number. */
function readFields(
  formData: FormData,
  type: AccountType,
): AccountFields | FormState {
  const fields: Record<string, string> = {}
  const name = text(formData, 'name').trim()
  if (!name || name.length > 80) fields.name = cs.forms.nameRequired
  let opening = 0
  try {
    opening = parseAmount(text(formData, 'opening')) ?? 0
  } catch {
    fields.opening = cs.forms.amountInvalid
  }
  const openedOn = text(formData, 'openedOn')
  if (!isDay(openedOn)) fields.openedOn = cs.forms.dateInvalid
  if (Object.keys(fields).length > 0) {
    return { status: 'error', message: cs.forms.invalid, fields }
  }
  return {
    name,
    openingBalanceMinor: type === 'credit_card' ? -opening : opening,
    openedOn,
  }
}

const isState = (value: AccountFields | FormState): value is FormState =>
  'status' in value

export async function createAccountAction(
  previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return withValues(await createAccount_(previous, formData), formData)
}

async function createAccount_(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser()
  const type = text(formData, 'type') as AccountType
  const currency = text(formData, 'currency') as (typeof CURRENCIES)[number]
  if (!ACCOUNT_TYPES.includes(type) || !CURRENCIES.includes(currency)) {
    return { status: 'error', message: cs.forms.invalid }
  }
  const fields = readFields(formData, type)
  if (isState(fields)) return fields
  let id: string
  try {
    id = (await createAccount(getDb(), user.id, { ...fields, type, currency }))
      .id
  } catch (error) {
    return formError(error)
  }
  redirect(`/ucty/${id}`)
}

export async function updateAccountAction(
  previous: FormState,
  formData: FormData,
): Promise<FormState> {
  return withValues(await updateAccount_(previous, formData), formData)
}

async function updateAccount_(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser()
  const type = text(formData, 'type') as AccountType
  if (!ACCOUNT_TYPES.includes(type))
    return { status: 'error', message: cs.forms.invalid }
  const fields = readFields(formData, type)
  if (isState(fields)) return fields
  try {
    await updateAccount(getDb(), user.id, text(formData, 'id'), fields)
  } catch (error) {
    return formError(error)
  }
  refresh()
  return { status: 'ok' }
}

export async function setAccountArchivedAction(
  accountId: string,
  archived: boolean,
) {
  const user = await requireUser()
  await updateAccount(getDb(), user.id, accountId, { archived })
  refresh()
}
