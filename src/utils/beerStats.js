export const ALCOHOL_ABV_THRESHOLD = 0.5
export const ALCOHOL_LOOKBACK_MS = 24 * 60 * 60 * 1000

export function parseTimeToDate(timeValue, fallbackTime, now = new Date()) {
  const source = String(
    timeValue || fallbackTime ||
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  )
  const [hRaw, mRaw] = source.split(':')
  const hours = Number.parseInt(hRaw, 10)
  const minutes = Number.parseInt(mRaw, 10)
  const parsed = new Date(now)
  parsed.setHours(
    Number.isNaN(hours) ? now.getHours() : hours,
    Number.isNaN(minutes) ? now.getMinutes() : minutes,
    0, 0
  )
  if (parsed > now) parsed.setDate(parsed.getDate() - 1)
  return parsed
}

export function isBeerCountedAsAlcohol(beer, startTime, now = new Date()) {
  const abv = parseFloat(beer?.abv) || 0
  if (abv <= ALCOHOL_ABV_THRESHOLD) return false

  const beerTime = parseTimeToDate(beer?.drinkTime, startTime, now)
  const elapsed = now - beerTime
  return elapsed >= 0 && elapsed <= ALCOHOL_LOOKBACK_MS
}

export function computeStatsForBeers(beers, friends, startTime, now = new Date()) {
  let tableTotal = 0
  const friendTotals = new Array(friends.length).fill(0)
  const friendGramsAlcohol = new Array(friends.length).fill(0)
  const friendFirstDrinkTimes = new Array(friends.length).fill(null)

  beers.forEach(beer => {
    const price = parseFloat(beer.price) || 0
    const abv = parseFloat(beer.abv) || 0
    const vol = parseFloat(beer.vol) || 0
    const gramsPerBeer = vol * 1000 * (abv / 100) * 0.8
    const beerTime = parseTimeToDate(beer.drinkTime, startTime, now)
    const countsAsAlcohol = isBeerCountedAsAlcohol(beer, startTime, now)

    beer.counts.forEach((count, fi) => {
      if (!count) return

      friendTotals[fi] += count * price
      tableTotal += count * price

      if (countsAsAlcohol) {
        friendGramsAlcohol[fi] += count * gramsPerBeer

        if (!friendFirstDrinkTimes[fi] || beerTime < friendFirstDrinkTimes[fi]) {
          friendFirstDrinkTimes[fi] = beerTime
        }
      }
    })
  })

  const friendBacs = friendGramsAlcohol.map((totalGrams, fi) => {
    if (totalGrams === 0) return 0

    const friend = friends[fi] || {}
    const r = friend.gender === 'f' ? 0.55 : 0.68
    const bodyWeight = (parseFloat(friend.weight) || 80) * r
    const theoreticalBac = totalGrams / bodyWeight
    const hoursElapsed = Math.max(0, (now - friendFirstDrinkTimes[fi]) / (1000 * 60 * 60))
    const currentBac = theoreticalBac - hoursElapsed * 0.15

    return Math.max(0, currentBac)
  })

  const friendSobers = friendBacs.map(v => (v > 0 ? v / 0.15 : 0))

  return { tableTotal, friendTotals, friendBacs, friendSobers }
}
