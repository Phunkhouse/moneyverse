import { formatMoney, type Currency } from '../format.ts'
import { cs } from '../messages.ts'
import styles from './Money.module.scss'

type Props = {
  minor: number
  currency: Currency
  /** Colour negative amounts red (debts) or signed amounts by direction. */
  tone?: 'plain' | 'debt' | 'signed'
  signed?: boolean
  /** Converted at the last known rate (AC-15): underlined, with an explanation on hover. */
  estimated?: boolean
  className?: string
}

/** An amount in its currency, formatted for cs-CZ with tabular figures. */
export function Money({
  minor,
  currency,
  tone = 'plain',
  signed = false,
  estimated = false,
  className,
}: Props) {
  const classes = [
    styles.money,
    tone !== 'plain' && minor < 0 && styles.negative,
    tone === 'signed' && minor > 0 && styles.positive,
    estimated && styles.estimated,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <span
      className={classes}
      title={estimated ? cs.money.estimated : undefined}
    >
      {formatMoney(minor, currency, { signed })}
    </span>
  )
}
