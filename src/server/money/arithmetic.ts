import { MoneyError } from './types.ts'

/** Integer division rounded half away from zero (ADR 0003). */
export function divideRounded(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new RangeError('Division by zero')
  const negative = numerator < 0n !== denominator < 0n
  const n = numerator < 0n ? -numerator : numerator
  const d = denominator < 0n ? -denominator : denominator
  // floor((2n + d) / 2d) is n/d rounded half up on the magnitude.
  const result = (2n * n + d) / (2n * d)
  return negative ? -result : result
}

export function toSafeNumber(value: bigint): number {
  if (
    value > BigInt(Number.MAX_SAFE_INTEGER) ||
    value < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new MoneyError('INVALID', 'Amount is out of range')
  }
  return Number(value)
}

export function assertMinor(
  value: unknown,
  field: string,
  { positive = false } = {},
): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new MoneyError(
      'INVALID',
      `${field} must be a whole number of minor units`,
    )
  }
  if (positive && value <= 0)
    throw new MoneyError('INVALID', `${field} must be positive`)
  return value
}

/** A rate as ČNB publishes it: CZK in thousandths for `amount` units of the currency. */
export type Rate = { amount: number; rateMilli: number }

/** Foreign minor units to CZK minor units (haléře). Cents and haléře are both hundredths. */
export function toCzk(minor: number, rate: Rate): number {
  return toSafeNumber(
    divideRounded(
      BigInt(minor) * BigInt(rate.rateMilli),
      1000n * BigInt(rate.amount),
    ),
  )
}

/** CZK minor units to the currency's minor units, for showing totals in EUR or USD. */
export function fromCzk(czkMinor: number, rate: Rate): number {
  return toSafeNumber(
    divideRounded(
      BigInt(czkMinor) * 1000n * BigInt(rate.amount),
      BigInt(rate.rateMilli),
    ),
  )
}
