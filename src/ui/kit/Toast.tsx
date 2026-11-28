'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Toast.module.scss'

type Props = {
  message: string
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
  /** How long it stays; paused while hovered or focused. */
  duration?: number
}

/** A short confirmation with an optional action such as Undo, announced politely. */
export function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 8000,
}: Props) {
  const [paused, setPaused] = useState(false)
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  }, [onClose])
  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => close.current(), duration)
    return () => clearTimeout(timer)
  }, [paused, duration, message])
  return (
    <div
      className={styles.toast}
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.message}>{message}</span>
      {actionLabel && onAction && (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
