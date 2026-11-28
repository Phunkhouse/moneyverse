import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Chip.module.scss'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** A toggle chip announces its state; leave undefined for a plain action chip. */
  pressed?: boolean
  /** A short tag before the label, such as a currency or initials. */
  tag?: ReactNode
}

export function Chip({ pressed, tag, children, className, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={[styles.chip, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {tag && <span className={styles.tag}>{tag}</span>}
      {children}
    </button>
  )
}

export function Chips({
  label,
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {children}
    </div>
  )
}
