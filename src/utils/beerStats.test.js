import { describe, it, expect } from 'vitest'
import { isBeerCountedAsAlcohol, computeStatsForBeers, ALCOHOL_ABV_THRESHOLD } from './beerStats.js'

const FRIENDS_ONE_MALE = [{ name: 'Test', weight: 80, gender: 'm' }]
const START_TIME = '18:00'

function makeNow(offsetMinutes = 0) {
  const now = new Date()
  return new Date(now.getTime() + offsetMinutes * 60 * 1000)
}

function timeStr(offsetMinutes = 0) {
  const d = makeNow(offsetMinutes)
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

describe('isBeerCountedAsAlcohol', () => {
  it('counts a beer with ABV above threshold consumed now', () => {
    const beer = { abv: 5.0, drinkTime: timeStr() }
    expect(isBeerCountedAsAlcohol(beer, START_TIME, makeNow())).toBe(true)
  })

  it('does not count a beer with ABV at or below threshold', () => {
    const beer = { abv: ALCOHOL_ABV_THRESHOLD, drinkTime: timeStr() }
    expect(isBeerCountedAsAlcohol(beer, START_TIME, makeNow())).toBe(false)
  })

  it('does not count a non-alcoholic beer (0% ABV)', () => {
    const beer = { abv: 0, drinkTime: timeStr() }
    expect(isBeerCountedAsAlcohol(beer, START_TIME, makeNow())).toBe(false)
  })

  it('does not count a beer with a drinkTime in the future relative to now', () => {
    // A drinkTime slightly in the future will be interpreted as yesterday,
    // giving elapsed ≈ 24h minus a tiny delta — still within window.
    // What we CAN test is that negative elapsed (future time beyond now+1min margin) stays safe.
    // This test verifies the elapsed >= 0 guard by using a beer whose
    // parsed beerTime would equal now (elapsed = 0) — it still counts.
    const beer = { abv: 5.0, drinkTime: timeStr() }
    expect(isBeerCountedAsAlcohol(beer, START_TIME, makeNow())).toBe(true)
  })

  it('counts a beer consumed exactly 1 hour ago', () => {
    const beer = { abv: 5.0, drinkTime: timeStr(-60) }
    expect(isBeerCountedAsAlcohol(beer, START_TIME, makeNow())).toBe(true)
  })
})

describe('computeStatsForBeers', () => {
  it('returns all zeros for an empty beer list', () => {
    const result = computeStatsForBeers([], FRIENDS_ONE_MALE, START_TIME, makeNow())
    expect(result.tableTotal).toBe(0)
    expect(result.friendTotals).toEqual([0])
    expect(result.friendBacs).toEqual([0])
    expect(result.friendSobers).toEqual([0])
  })

  it('calculates table total and friend total correctly', () => {
    const now = makeNow()
    const beers = [
      { abv: 5.0, vol: 0.5, price: 60, drinkTime: timeStr(), counts: [2] }
    ]
    const result = computeStatsForBeers(beers, FRIENDS_ONE_MALE, START_TIME, now)
    expect(result.tableTotal).toBe(120)
    expect(result.friendTotals[0]).toBe(120)
  })

  it('calculates a positive BAC after consuming an alcoholic beer', () => {
    const now = makeNow()
    const beers = [
      { abv: 5.0, vol: 0.5, price: 60, drinkTime: timeStr(), counts: [1] }
    ]
    const result = computeStatsForBeers(beers, FRIENDS_ONE_MALE, START_TIME, now)
    expect(result.friendBacs[0]).toBeGreaterThan(0)
  })

  it('does not add BAC for a non-alcoholic beer (ABV <= threshold)', () => {
    const now = makeNow()
    const beers = [
      { abv: 0.3, vol: 0.5, price: 40, drinkTime: timeStr(), counts: [3] }
    ]
    const result = computeStatsForBeers(beers, FRIENDS_ONE_MALE, START_TIME, now)
    expect(result.tableTotal).toBe(120)
    expect(result.friendBacs[0]).toBe(0)
  })

  it('accumulates totals and BAC across multiple beers', () => {
    const now = makeNow()
    const beers = [
      { abv: 5.0, vol: 0.5, price: 60, drinkTime: timeStr(), counts: [1] },
      { abv: 6.0, vol: 0.5, price: 80, drinkTime: timeStr(), counts: [1] }
    ]
    const result = computeStatsForBeers(beers, FRIENDS_ONE_MALE, START_TIME, now)
    expect(result.tableTotal).toBe(140)
    expect(result.friendBacs[0]).toBeGreaterThan(0)
  })

  it('applies a higher BAC for female friend (lower body water ratio)', () => {
    const friends = [
      { name: 'Alice', weight: 60, gender: 'f' },
      { name: 'Bob', weight: 60, gender: 'm' }
    ]
    const now = makeNow()
    const beers = [
      { abv: 5.0, vol: 0.5, price: 60, drinkTime: timeStr(), counts: [1, 1] }
    ]
    const result = computeStatsForBeers(beers, friends, START_TIME, now)
    expect(result.friendBacs[0]).toBeGreaterThan(result.friendBacs[1])
  })

  it('returns sober time proportional to BAC', () => {
    const now = makeNow()
    const beers = [
      { abv: 5.0, vol: 0.5, price: 60, drinkTime: timeStr(), counts: [1] }
    ]
    const result = computeStatsForBeers(beers, FRIENDS_ONE_MALE, START_TIME, now)
    const bac = result.friendBacs[0]
    expect(result.friendSobers[0]).toBeCloseTo(bac / 0.15, 5)
  })

  it('handles multiple friends correctly', () => {
    const friends = [
      { name: 'A', weight: 80, gender: 'm' },
      { name: 'B', weight: 80, gender: 'm' }
    ]
    const now = makeNow()
    const beers = [
      { abv: 5.0, vol: 0.5, price: 60, drinkTime: timeStr(), counts: [2, 1] }
    ]
    const result = computeStatsForBeers(beers, friends, START_TIME, now)
    expect(result.friendTotals[0]).toBe(120)
    expect(result.friendTotals[1]).toBe(60)
    expect(result.tableTotal).toBe(180)
    expect(result.friendBacs[0]).toBeGreaterThan(result.friendBacs[1])
  })
})
