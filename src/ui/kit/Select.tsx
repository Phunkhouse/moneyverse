'use client'

import { useId, type SelectHTMLAttributes } from 'react'
import fieldStyles from './TextField.module.scss'
import styles from './Select.module.scss'

type Option = { value: string; label: string }

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string
  options: readonly Option[]
  hint?: string
  error?: string
}

/** A native select styled like the text field. */
export function Select({
  label,
  options,
  hint,
  error,
  className,
  ...rest
}: Props) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={[fieldStyles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={fieldStyles.label}>
        {label}
      </label>
      <select
        id={id}
        className={`${fieldStyles.input} ${styles.select}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hintId, errorId].filter(Boolean).join(' ') || undefined
        }
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className={fieldStyles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={fieldStyles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
