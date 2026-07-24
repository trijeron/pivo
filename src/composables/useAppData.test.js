import { describe, it, expect, beforeEach } from 'vitest'
import { useAppData } from './useAppData.js'

// The composable uses a module-level singleton; clearAll() resets it between tests.
let addBeer, incrementCount, decrementCount, deletePub
let addPub, setActivePub, addFriend
let appData, activePubStats, activeBeers, clearAll

beforeEach(() => {
  const api = useAppData()
  addBeer = api.addBeer
  incrementCount = api.incrementCount
  decrementCount = api.decrementCount
  deletePub = api.deletePub
  addPub = api.addPub
  setActivePub = api.setActivePub
  addFriend = api.addFriend
  appData = api.appData
  activePubStats = api.activePubStats
  activeBeers = api.activeBeers
  clearAll = api.clearAll
  clearAll()
})

// ─── addBeer ────────────────────────────────────────────────────────────────

describe('addBeer', () => {
  it('adds a beer to the beer list', () => {
    addBeer({ name: 'Test Pivo', style: 'IPA', price: 60, vol: 0.5, abv: 5.0 })
    expect(appData.beers.length).toBe(1)
    expect(appData.beers[0].name).toBe('Test Pivo')
  })

  it('assigns the active pub id', () => {
    addBeer({ name: 'Test Pivo', price: 60, vol: 0.5, abv: 5.0 })
    expect(appData.beers[0].pubId).toBe(appData.activePubId)
  })

  it('initializes counts array to zero for all friends', () => {
    addBeer({ name: 'Test Pivo', price: 60, vol: 0.5, abv: 5.0 })
    expect(appData.beers[0].counts.length).toBe(appData.friends.length)
    expect(appData.beers[0].counts.every(c => c === 0)).toBe(true)
  })

  it('stores the beer in the catalog', () => {
    addBeer({ name: 'Unique Craft', style: 'IPA', price: 90, vol: 0.33, abv: 7.0 })
    expect(appData.catalog.some(c => c.name === 'Unique Craft')).toBe(true)
  })

  it('prepends new beers (most recent first)', () => {
    addBeer({ name: 'First', price: 50, vol: 0.5, abv: 4.0 })
    addBeer({ name: 'Second', price: 60, vol: 0.5, abv: 5.0 })
    expect(appData.beers[0].name).toBe('Second')
  })
})

// ─── incrementCount / decrementCount ────────────────────────────────────────

describe('incrementCount', () => {
  it('increments the count for the specified friend', () => {
    addBeer({ name: 'Pivo', price: 60, vol: 0.5, abv: 5.0 })
    const beerId = appData.beers[0].id
    incrementCount(beerId, 0)
    expect(appData.beers[0].counts[0]).toBe(1)
  })

  it('increments multiple times', () => {
    addBeer({ name: 'Pivo', price: 60, vol: 0.5, abv: 5.0 })
    const beerId = appData.beers[0].id
    incrementCount(beerId, 0)
    incrementCount(beerId, 0)
    incrementCount(beerId, 0)
    expect(appData.beers[0].counts[0]).toBe(3)
  })
})

describe('decrementCount', () => {
  it('decrements the count', () => {
    addBeer({ name: 'Pivo', price: 60, vol: 0.5, abv: 5.0 })
    const beerId = appData.beers[0].id
    incrementCount(beerId, 0)
    incrementCount(beerId, 0)
    decrementCount(beerId, 0)
    expect(appData.beers[0].counts[0]).toBe(1)
  })

  it('does not go below zero', () => {
    addBeer({ name: 'Pivo', price: 60, vol: 0.5, abv: 5.0 })
    const beerId = appData.beers[0].id
    decrementCount(beerId, 0)
    decrementCount(beerId, 0)
    expect(appData.beers[0].counts[0]).toBe(0)
  })
})

// ─── alcohol consumed (BAC) via activePubStats ───────────────────────────────

describe('activePubStats - alcohol consumed', () => {
  it('returns zero BAC when no beer has been consumed', () => {
    addBeer({ name: 'Pivo', price: 60, vol: 0.5, abv: 5.0 })
    expect(activePubStats.value.friendBacs[0]).toBe(0)
  })

  it('returns positive BAC after consuming an alcoholic beer', () => {
    addBeer({ name: 'Pivo', price: 60, vol: 0.5, abv: 5.0 })
    incrementCount(appData.beers[0].id, 0)
    expect(activePubStats.value.friendBacs[0]).toBeGreaterThan(0)
  })

  it('returns zero BAC for a non-alcoholic beer', () => {
    addBeer({ name: 'Nealko', price: 40, vol: 0.5, abv: 0.3 })
    incrementCount(appData.beers[0].id, 0)
    expect(activePubStats.value.friendBacs[0]).toBe(0)
  })

  it('computes the correct table total', () => {
    addBeer({ name: 'Pivo', price: 60, vol: 0.5, abv: 5.0 })
    const beerId = appData.beers[0].id
    incrementCount(beerId, 0)
    incrementCount(beerId, 0)
    expect(activePubStats.value.tableTotal).toBe(120)
  })

  it('accumulates BAC across multiple different beers', () => {
    addBeer({ name: 'Pivo A', price: 60, vol: 0.5, abv: 5.0 })
    addBeer({ name: 'Pivo B', price: 80, vol: 0.5, abv: 6.0 })
    const idA = appData.beers.find(b => b.name === 'Pivo A').id
    const idB = appData.beers.find(b => b.name === 'Pivo B').id
    incrementCount(idA, 0)
    const bacAfterOne = activePubStats.value.friendBacs[0]
    incrementCount(idB, 0)
    expect(activePubStats.value.friendBacs[0]).toBeGreaterThan(bacAfterOne)
  })

  it('only counts beers for the active pub', () => {
    const pub2 = addPub('Druhá hospoda')
    // Add beer in pub1 (default)
    setActivePub(appData.pubs[0].id)
    addBeer({ name: 'Pivo 1', price: 60, vol: 0.5, abv: 5.0 })
    incrementCount(appData.beers[0].id, 0)
    // Switch to pub2
    setActivePub(pub2.id)
    expect(activePubStats.value.tableTotal).toBe(0)
    expect(activePubStats.value.friendBacs[0]).toBe(0)
  })
})

// ─── deletePub ───────────────────────────────────────────────────────────────

describe('deletePub', () => {
  it('returns false when trying to delete the only pub', () => {
    expect(appData.pubs.length).toBe(1)
    const result = deletePub(appData.pubs[0].id)
    expect(result).toBe(false)
    expect(appData.pubs.length).toBe(1)
  })

  it('removes a pub when there are multiple pubs', () => {
    const pub2 = addPub('Pub 2')
    expect(appData.pubs.length).toBe(2)
    deletePub(pub2.id)
    expect(appData.pubs.length).toBe(1)
  })

  it('reassigns beers from the deleted pub to another pub', () => {
    const pub1Id = appData.pubs[0].id
    const pub2 = addPub('Pub 2')
    setActivePub(pub1Id)
    addBeer({ name: 'Pub1 Pivo', price: 50, vol: 0.5, abv: 5.0 })
    const beerId = appData.beers[0].id
    deletePub(pub1Id)
    const beer = appData.beers.find(b => b.id === beerId)
    expect(beer.pubId).toBe(pub2.id)
  })

  it('switches active pub when the active one is deleted', () => {
    const pub2 = addPub('Pub 2')
    setActivePub(pub2.id)
    deletePub(pub2.id)
    expect(appData.activePubId).not.toBe(pub2.id)
    expect(appData.pubs.some(p => p.id === appData.activePubId)).toBe(true)
  })

  it('returns true on successful deletion', () => {
    addPub('Pub 2')
    const result = deletePub(appData.pubs[0].id)
    expect(result).toBe(true)
  })
})
