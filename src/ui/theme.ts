// Theme choice: "Podle systému" (no data-theme), light or dark. Stored per device in
// localStorage, applied by an inline script before the first paint so there is no flash
// (node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md).

export type ThemeChoice = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'mv-theme'

/** Fired on window when the choice changes in this tab. */
export const THEME_CHANGE_EVENT = 'mv-theme-change'

export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`

export function readThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage can be unavailable (private mode); fall back to the system theme.
  }
  return 'system'
}

export function applyThemeChoice(choice: ThemeChoice): void {
  const root = document.documentElement
  if (choice === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', choice)
  try {
    if (choice === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // The choice still applies to this page.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

export function isDarkNow(): boolean {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'dark') return true
  if (attr === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
