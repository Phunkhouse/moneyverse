'use client'

import { MoonIcon, SunIcon } from '@/ui/kit/icons.tsx'
import iconButton from '@/ui/kit/IconButton.module.scss'
import { cs } from '@/ui/messages.ts'
import { applyThemeChoice, isDarkNow } from '@/ui/theme.ts'
import styles from './ThemeToggle.module.scss'

/** The top bar's light and dark switch. "Podle systému" is in the settings. */
export function ThemeToggle() {
  return (
    <button
      type="button"
      className={iconButton.iconButton}
      onClick={() => applyThemeChoice(isDarkNow() ? 'light' : 'dark')}
    >
      <span className={styles.toDark}>
        <MoonIcon />
        <span className="sr-only">{cs.theme.toDark}</span>
      </span>
      <span className={styles.toLight}>
        <SunIcon />
        <span className="sr-only">{cs.theme.toLight}</span>
      </span>
    </button>
  )
}
