'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cs } from '../messages.ts'
import { CloseIcon } from './icons.tsx'
import styles from './Sheet.module.scss'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * A modal sheet on a native <dialog>: focus moves in and back, Escape closes it, and the page
 * behind is inert. Clicking the backdrop closes it too. Mark the field that should take focus
 * with `data-autofocus` (React's autoFocus runs before the dialog opens).
 */
export function Sheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal() focuses the first control (the close button); a field marked
      // data-autofocus takes focus instead, so typing can start at once.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={styles.grab} aria-hidden="true" />
      <div className={styles.head}>
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={cs.common.close}
        >
          <CloseIcon />
        </button>
      </div>
      <div className={styles.body}>{open && children}</div>
    </dialog>
  )
}
