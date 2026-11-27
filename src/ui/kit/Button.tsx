import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.scss'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'medium' | 'large'
  block?: boolean
  /** Shows a spinner and ignores clicks while an action runs. */
  busy?: boolean
}

export function Button({
  variant = 'primary',
  size = 'medium',
  block = false,
  busy = false,
  type = 'button',
  className,
  children,
  onClick,
  ...rest
}: Props) {
  const classes = [
    styles.button,
    styles[variant],
    size === 'large' && styles.large,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type={type}
      className={classes}
      aria-busy={busy || undefined}
      onClick={busy ? (event) => event.preventDefault() : onClick}
      {...rest}
    >
      {busy && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}
