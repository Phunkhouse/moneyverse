import { describe, expect, it } from 'vitest'
import { parseAmount } from './parse.ts'

describe('parseAmount', () => {
  it.each([
    ['1 234,50', 123_450],
    ['1 234,5', 123_450],
    ['1234.05', 123_405],
    ['-9 500', -950_000],
    ['−9 500', -950_000],
    ['+12', 1_200],
    ['0,01', 1],
    ['  42  ', 4_200],
    ['-0', 0],
  ])('reads %j as %i minor units', (text, minor) => {
    expect(parseAmount(text)).toBe(minor)
  })

  it('treats empty input as no amount', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('   ')).toBeNull()
    expect(parseAmount(undefined)).toBeNull()
  })

  // A comma is the decimal mark, so "1,234" is three decimals, not a thousands separator.
  it.each(['1,234', '12,345', 'abc', '1,2,3', '--5', '1e3', ',5', '1.'])(
    'refuses %j',
    (text) => expect(() => parseAmount(text)).toThrow(),
  )
})
