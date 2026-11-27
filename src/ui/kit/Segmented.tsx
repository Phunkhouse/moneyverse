'use client'

import { useId } from 'react'
import styles from './Segmented.module.scss'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  /** The group's accessible name. */
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

/** A segmented control built on native radio buttons, so arrow keys move the choice. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: Props<T>) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label={label} className={styles.group}>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )
}
