'use client'

import { useSyncExternalStore } from 'react'
import { Segmented } from '@/ui/kit/Segmented.tsx'
import { cs } from '@/ui/messages.ts'
import {
  applyThemeChoice,
  readThemeChoice,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ThemeChoice,
} from '@/ui/theme.ts'

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onChange()
  }
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

const options = [
  { value: 'system', label: cs.theme.system },
  { value: 'light', label: cs.theme.light },
  { value: 'dark', label: cs.theme.dark },
] as const

/** Podle systému, Světlý, Tmavý: the full theme choice, kept per device. */
export function ThemeSwitch() {
  const choice = useSyncExternalStore<ThemeChoice>(
    subscribe,
    readThemeChoice,
    () => 'system',
  )
  return (
    <Segmented
      label={cs.theme.label}
      options={options}
      value={choice}
      onChange={applyThemeChoice}
    />
  )
}
