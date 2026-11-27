import type { ReactNode } from 'react'
import styles from './Banner.module.scss'

type Props = {
  tone?: 'info' | 'warn' | 'error'
  /** A button or link at the right, such as "Zadat hodnoty". */
  action?: ReactNode
  children: ReactNode
}

/** A message across the screen. Errors are announced as alerts. */
export function Banner({ tone = 'info', action, children }: Props) {
  const classes = [styles.banner, tone !== 'info' && styles[tone]]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classes} role={tone === 'error' ? 'alert' : undefined}>
      <p className={styles.text}>{children}</p>
      {action}
    </div>
  )
}
