import type { ButtonHTMLAttributes } from 'react'
import styles from './IconButton.module.scss'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** The accessible name; icon buttons have no visible text. */
  label: string
}

export function IconButton({
  label,
  type = 'button',
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[styles.iconButton, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
