import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.scss'

type Props = HTMLAttributes<HTMLElement> & {
  title?: ReactNode
  /** A link or button shown at the right of the title, such as "Vše". */
  action?: ReactNode
  /** The gradient card for the key figure on a screen. */
  hero?: boolean
}

export function Card({
  title,
  action,
  hero = false,
  className,
  children,
  ...rest
}: Props) {
  const classes = [styles.card, hero && styles.hero, className]
    .filter(Boolean)
    .join(' ')
  return (
    <section className={classes} {...rest}>
      {(title || action) && (
        <header className={styles.head}>
          {title && <h2>{title}</h2>}
          {action && <span className={styles.action}>{action}</span>}
        </header>
      )}
      {children}
    </section>
  )
}
