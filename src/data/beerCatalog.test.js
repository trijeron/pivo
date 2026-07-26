import { describe, it, expect } from 'vitest'
import { beerCatalog, beerStyleGroups, styleDefaultAbv } from './beerCatalog.js'

describe('beer catalog data', () => {
  it('uses only styles from the shared style groups', () => {
    const allowedStyles = new Set(beerStyleGroups.flatMap(group => group.styles))

    beerCatalog.forEach(beer => {
      expect(allowedStyles.has(beer.style)).toBe(true)
      expect(styleDefaultAbv[beer.style]).not.toBeUndefined()
    })
  })

  it('does not contain duplicate beer names', () => {
    const seenNames = new Set()

    beerCatalog.forEach(beer => {
      const key = beer.name.trim().toLowerCase()
      expect(seenNames.has(key)).toBe(false)
      seenNames.add(key)
    })
  })
})
