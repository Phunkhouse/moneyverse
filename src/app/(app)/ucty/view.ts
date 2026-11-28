import type { AccountType } from '@/server/money/types.ts'
import { cs } from '@/ui/messages.ts'

/** The Účty screen's groups (prototype), not the net worth kinds. */
export const DISPLAY_GROUPS = [
  { key: 'everyday', types: ['checking', 'credit_card'] },
  { key: 'savings', types: ['savings'] },
  { key: 'investments', types: ['brokerage', 'crypto', 'managed_fund'] },
  { key: 'retirement', types: ['retirement'] },
] as const satisfies readonly {
  key: keyof typeof cs.accounts.groups
  types: readonly AccountType[]
}[]

/** The opening balance as the form shows it: a card's debt as a positive number. */
export function openingForForm(type: AccountType, minor: number): string {
  const shown = type === 'credit_card' ? -minor : minor
  if (shown === 0) return ''
  const sign = shown < 0 ? '-' : ''
  const abs = Math.abs(shown)
  const whole = Math.floor(abs / 100)
  const cents = abs % 100
  return `${sign}${whole}${cents ? `,${String(cents).padStart(2, '0')}` : ''}`
}
