import 'server-only'
import { MoneyError } from '@/server/money/types.ts'
import { cs } from '@/ui/messages.ts'

/** What a form's server action returns to `useActionState`. Messages are Czech, for display. */
export type FormState =
  | { status: 'idle' }
  | { status: 'ok' }
  | {
      status: 'error'
      message: string
      fields?: Record<string, string>
      /** What was submitted: React resets a form after its action, so fields show these again. */
      values?: Record<string, string>
    }

export const idle: FormState = { status: 'idle' }

/** Maps a failure to a message the user can act on; unexpected errors are logged, not shown. */
export function formError(
  error: unknown,
  conflict: string = cs.forms.invalid,
): FormState {
  if (error instanceof MoneyError) {
    const message =
      error.code === 'NOT_FOUND'
        ? cs.forms.notFound
        : error.code === 'CONFLICT'
          ? conflict
          : cs.forms.invalid
    return { status: 'error', message }
  }
  console.error(
    'Form action failed:',
    error instanceof Error ? error.message : error,
  )
  return { status: 'error', message: cs.forms.failed }
}

/** Keeps the submitted text fields on an error, so the user does not retype them. */
export function withValues(state: FormState, formData: FormData): FormState {
  if (state.status !== 'error') return state
  const values: Record<string, string> = {}
  for (const [key, value] of formData) {
    if (typeof value === 'string' && !key.startsWith('$')) values[key] = value
  }
  return { ...state, values }
}

export function text(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}
