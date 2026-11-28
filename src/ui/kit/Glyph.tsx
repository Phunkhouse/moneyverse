import type { CSSProperties } from 'react'
import styles from './Glyph.module.scss'

// Hues around the brand's violet, pink and cyan (prototype's category hues).
const HUES = [188, 328, 236, 252, 200, 290, 340, 312, 182, 222, 268, 176]

function hash(text: string) {
  let h = 0
  for (const char of text) h = (h * 31 + char.codePointAt(0)!) >>> 0
  return h
}

/** Two letters of a name, upper case: "Jídlo" → "JÍ", "Mzda a odměny" → "MO". */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters =
    words.length > 1
      ? words[0][0] + words[words.length - 1][0]
      : [...(words[0] ?? '?')].slice(0, 2).join('')
  return letters.toLocaleUpperCase('cs-CZ')
}

/** The category or account icon: two letters on a gradient whose hue follows the `seed`. */
export function Glyph({ name, seed }: { name: string; seed: string }) {
  const hue = HUES[hash(seed) % HUES.length]
  return (
    <span
      className={styles.glyph}
      style={{ '--h': hue } as CSSProperties}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
