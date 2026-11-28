'use client'

import styles from './Keypad.module.scss'

export const KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  ',',
  '0',
  '⌫',
] as const
export type Key = (typeof KEYS)[number]

/**
 * Applies a key to the typed amount: digits, one decimal comma with at most two decimals, and
 * backspace. Returns the new text ("" means zero). At most nine digits before the comma.
 */
export function applyKey(amount: string, key: string): string {
  if (key === '⌫' || key === 'Backspace') return amount.slice(0, -1)
  if (key === ',' || key === '.')
    return amount.includes(',') ? amount : `${amount || '0'},`
  if (!/^\d$/.test(key)) return amount
  const [whole, fraction] = amount.split(',')
  if (fraction !== undefined)
    return fraction.length >= 2 ? amount : amount + key
  if (whole === '0') return key
  return whole.length >= 9 ? amount : amount + key
}

type Props = {
  onKey: (key: Key) => void
  labels: { backspace: string; decimal: string }
}

/** The on-screen amount keypad (W-4): ready as soon as the sheet opens. */
export function Keypad({ onKey, labels }: Props) {
  return (
    <div className={styles.keypad}>
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className={styles.key}
          aria-label={
            key === '⌫'
              ? labels.backspace
              : key === ','
                ? labels.decimal
                : undefined
          }
          onClick={() => onKey(key)}
        >
          {key}
        </button>
      ))}
    </div>
  )
}
