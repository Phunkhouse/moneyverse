import { MoneyError } from './types.ts'

const AMOUNT = /^([+-]?)(\d{1,15})(?:[.,](\d{1,2}))?$/

/**
 * Parses an amount typed in Czech or plain form into minor units: "1 234,50" → 123450,
 * "-9 500" → -950000, "12.5" → 1250. Spaces (also non-breaking) separate thousands; a comma or a
 * dot starts the decimals, at most two. Signs: "-", "−" (minus) or "+". Returns null for empty input.
 */
export function parseAmount(text: unknown): number | null {
  if (typeof text !== 'string') return null
  const compact = text
    .trim()
    .replace(/−/g, '-')
    .replace(/[\s  ]/g, '')
  if (compact === '') return null
  const match = AMOUNT.exec(compact)
  if (!match) throw new MoneyError('INVALID', 'Not an amount')
  const [, sign, whole, fraction = ''] = match
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(minor))
    throw new MoneyError('INVALID', 'Amount is out of range')
  return sign === '-' ? 0 - minor : minor
}
