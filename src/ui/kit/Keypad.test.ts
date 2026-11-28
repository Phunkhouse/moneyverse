import { describe, expect, it } from 'vitest'
import { applyKey } from './Keypad.tsx'

const type = (keys: string[]) => keys.reduce(applyKey, '')

describe('applyKey', () => {
  it('builds an amount with one comma and two decimals at most', () => {
    expect(type(['1', '2', '9'])).toBe('129')
    expect(type(['1', ',', '5', '0', '7'])).toBe('1,50')
    expect(type([',', '5'])).toBe('0,5')
    expect(type(['1', ',', ',', '2'])).toBe('1,2')
    expect(type(['0', '0', '7'])).toBe('7')
  })

  it('deletes and caps the whole part at nine digits', () => {
    expect(type(['1', '2', '⌫'])).toBe('1')
    expect(type(['1', 'Backspace'])).toBe('')
    expect(type(Array(12).fill('9'))).toBe('999999999')
    expect(type(['x'])).toBe('')
  })
})
