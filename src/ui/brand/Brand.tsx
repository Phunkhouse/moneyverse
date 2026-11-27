import { useId } from 'react'
import styles from './Brand.module.scss'

/** Logo 02 "Glass trio" (docs/design/brand/logo/moneyverse-mark.svg). */
export function Mark({ size = 22 }: { size?: number }) {
  // Unique clip ids: the mark can appear more than once on a page.
  const id = useId()
  const a = `${id}a`
  const b = `${id}b`
  return (
    <svg
      width={size}
      height={size}
      viewBox="12 14 76 73"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={a}>
          <circle cx="37" cy="39" r="24" />
        </clipPath>
        <clipPath id={b}>
          <circle cx="63" cy="39" r="24" />
        </clipPath>
      </defs>
      <circle cx="37" cy="39" r="24" fill="#5b5bf7" />
      <circle cx="63" cy="39" r="24" fill="#ec4899" />
      <circle cx="50" cy="62" r="24" fill="#22d3ee" />
      <circle cx="63" cy="39" r="24" fill="#f389fc" clipPath={`url(#${a})`} />
      <circle cx="50" cy="62" r="24" fill="#71e3fe" clipPath={`url(#${a})`} />
      <circle cx="50" cy="62" r="24" fill="#eedff8" clipPath={`url(#${b})`} />
      <g clipPath={`url(#${a})`}>
        <circle cx="50" cy="62" r="24" fill="#fbf5ff" clipPath={`url(#${b})`} />
      </g>
    </svg>
  )
}

/** Mark on its tile plus the lowercase wordmark. */
export function Brand({
  size = 34,
  fontSize = 'var(--fs-xl)',
}: {
  size?: number
  fontSize?: string
}) {
  return (
    <span className={styles.brand} style={{ fontSize }}>
      <span className={styles.tile} style={{ width: size, height: size }}>
        <Mark size={Math.round(size * 0.65)} />
      </span>
      moneyverse
    </span>
  )
}
