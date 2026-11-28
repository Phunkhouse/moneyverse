import { describe, expect, it } from 'vitest'
import { nearestIndex, niceTicks } from './scale.ts'

describe('niceTicks', () => {
  it('covers the range with round steps', () => {
    expect(niceTicks(0, 9_500_000, 4)).toEqual([
      0, 2_500_000, 5_000_000, 7_500_000, 10_000_000,
    ])
    expect(niceTicks(-120_000, 310_000, 4)).toEqual([
      -200_000, 0, 200_000, 400_000,
    ])
  })

  it('gives an all-zero chart a readable axis instead of ±1 haléř', () => {
    expect(niceTicks(0, 0)).toEqual([0, 2_500, 5_000, 7_500, 10_000])
    expect(niceTicks(0, 1)).toEqual([0, 2_500, 5_000, 7_500, 10_000])
  })

  it('opens up a flat series around its value', () => {
    const ticks = niceTicks(500, 500)
    expect(ticks[0]).toBeLessThan(500)
    expect(ticks.at(-1)).toBeGreaterThan(500)
  })
})

describe('nearestIndex', () => {
  it('picks the closest point', () => {
    expect(nearestIndex([0, 10, 20], 14)).toBe(1)
    expect(nearestIndex([0, 10, 20], 16)).toBe(2)
    expect(nearestIndex([5], 100)).toBe(0)
  })
})
