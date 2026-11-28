import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './Row.module.scss'

type Props = {
  lead?: ReactNode
  title: ReactNode
  meta?: ReactNode
  trail?: ReactNode
  /** A smaller line under `trail`, such as the CZK value of a EUR balance. */
  trailSub?: ReactNode
  href?: string
  onClick?: () => void
}

/** A list row (account, category, later transaction): icon, two lines of text, a value. */
export function Row({
  lead,
  title,
  meta,
  trail,
  trailSub,
  href,
  onClick,
}: Props) {
  const className = [styles.row, !lead && styles.noLead]
    .filter(Boolean)
    .join(' ')
  const content = (
    <>
      {lead}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </span>
      {(trail || trailSub) && (
        <span className={styles.trail}>
          {trail}
          {trailSub && <span className={styles.sub}>{trailSub}</span>}
        </span>
      )}
    </>
  )
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}

/** A list of rows separated by lines. */
export function RowList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>
}
