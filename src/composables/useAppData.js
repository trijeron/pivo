import { reactive, computed } from 'vue'
import { useI18n } from './useI18n.js'
import {
  isBeerCountedAsAlcohol as _isBeerCountedAsAlcohol,
  computeStatsForBeers as _computeStatsForBeers
} from '../utils/beerStats.js'

const STORAGE_KEY = 'beerAppDataV9'
const THEME_STORAGE_KEY = 'beerAppThemeV1'

const { t } = useI18n()

function makeDefaultFriends() {
  return [
    { id: makeId(), name: t('defaults.me'), weight: 80, gender: 'm' }
  ]
}

function makeDefaultStart() {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

function makeCurrentTime() {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

function makeId() {
  return crypto.randomUUID()
}

function generateNickname(name) {
  return String(name || '').trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    || 'pub'
}

function generateUniquePubNickname(name, excludeId = null) {
  const base = generateNickname(name)
  const existingNicknames = new Set(
    appData.pubs
      .filter(pub => excludeId === null || pub.id !== excludeId)
      .map(pub => pub.nickname)
      .filter(Boolean)
  )
  let nick = base
  let i = 2
  while (existingNicknames.has(nick)) { nick = `${base}_${i++}` }
  return nick
}

function makeDefaultPubs() {
  const name = t('defaults.defaultPub')
  return [
    { id: 'pub-default', name, address: '', nickname: generateNickname(name) }
  ]
}

function makeDefaultActiveFriendIdsByPub(friends, pubs) {
  const friendIds = friends.map(friend => friend.id)
  return Object.fromEntries(pubs.map(pub => [pub.id, [...friendIds]]))
}

function normalizeFriend(friend, index) {
  const parsedWeight = Number(friend?.weight)
  return {
    id: String(friend?.id || makeId()),
    name: String(friend?.name || '').trim() || t('defaults.friend', { number: index + 1 }),
    weight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 80,
    gender: friend?.gender === 'f' ? 'f' : 'm'
  }
}

const initialFriends = makeDefaultFriends()
const initialPubs = makeDefaultPubs()

// Module-level singleton so all components share the same state
const appData = reactive({
  startTime: makeDefaultStart(),
  friends: initialFriends,
  pubs: initialPubs,
  activePubId: initialPubs[0].id,
  beers: [],
  catalog: [],
  activeFriendIdsByPub: makeDefaultActiveFriendIdsByPub(initialFriends, initialPubs)
})

const uiState = reactive({
  theme: 'light',
  quickMode: 'single',
  quickSelection: [0]
})

function syncTheme() {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', uiState.theme)
  }
}

function saveTheme() {
  try { localStorage.setItem(THEME_STORAGE_KEY, uiState.theme) } catch (e) {}
}

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') uiState.theme = savedTheme
  } catch (e) {}
  syncTheme()
}

function normalizeQuickSelection() {
  const validIndexes = uiState.quickSelection
    .filter(index => Number.isInteger(index) && index >= 0 && index < appData.friends.length)

  if (uiState.quickMode === 'single') {
    uiState.quickSelection = validIndexes.length ? [validIndexes[0]] : (appData.friends.length ? [0] : [])
    return
  }

  uiState.quickSelection = [...new Set(validIndexes)]
}

function ensurePubState() {
  if (!Array.isArray(appData.pubs) || appData.pubs.length === 0) {
    appData.pubs = makeDefaultPubs()
  }

  appData.pubs = appData.pubs
    .filter(pub => pub && pub.id)
    .map(pub => ({
      id: String(pub.id),
      name: String(pub.name || t('defaults.defaultPub')).trim() || t('defaults.defaultPub'),
      address: String(pub.address || '').trim(),
      nickname: String(pub.nickname || '').trim()
    }))

  if (appData.pubs.length === 0) {
    appData.pubs = makeDefaultPubs()
  }

  // Ensure all pubs have valid, unique nicknames
  const usedNicknames = new Set()
  appData.pubs.forEach(pub => {
    let nick = pub.nickname || generateNickname(pub.name)
    const base = nick
    let i = 2
    while (usedNicknames.has(nick)) { nick = `${base}_${i++}` }
    pub.nickname = nick
    usedNicknames.add(nick)
  })

  if (!appData.pubs.some(pub => pub.id === appData.activePubId)) {
    appData.activePubId = appData.pubs[0].id
  }
}

function ensureActiveFriendSelectionState() {
  const validFriendIds = new Set(appData.friends.map(friend => friend.id))
  const fallbackSelection = appData.friends.map(friend => friend.id)
  const nextSelections = {}

  appData.pubs.forEach(pub => {
    const rawSelection = Array.isArray(appData.activeFriendIdsByPub?.[pub.id])
      ? appData.activeFriendIdsByPub[pub.id]
      : fallbackSelection

    nextSelections[pub.id] = [...new Set(
      rawSelection
        .map(id => String(id))
        .filter(id => validFriendIds.has(id))
    )]
  })

  appData.activeFriendIdsByPub = nextSelections
}

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)) } catch (e) {}
}

function isBeerCountedAsAlcohol(beer, now = new Date()) {
  return _isBeerCountedAsAlcohol(beer, appData.startTime, now)
}

function computeStatsForBeers(beers) {
  return _computeStatsForBeers(beers, appData.friends, appData.startTime)
}

function loadData() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('beerAppDataV7') ||
      localStorage.getItem('beerAppDataV6') ||
      localStorage.getItem('beerAppDataV5')
    if (raw) {
      const parsed = JSON.parse(raw)
      appData.startTime = parsed.startTime || makeDefaultStart()
      appData.friends = parsed.friends || makeDefaultFriends()
      appData.pubs = parsed.pubs || makeDefaultPubs()
      appData.activePubId = parsed.activePubId || appData.pubs[0]?.id || 'pub-default'
      appData.beers = parsed.beers || []
      appData.catalog = Array.isArray(parsed.catalog) ? parsed.catalog : []
      appData.activeFriendIdsByPub = parsed.activeFriendIdsByPub || {}
    }
  } catch (e) {}

  appData.friends = appData.friends.map((friend, index) =>
    normalizeFriend(
      typeof friend === 'string' ? { name: friend, weight: 80, gender: 'm' } : friend,
      index
    )
  )
  if (!appData.startTime) appData.startTime = makeDefaultStart()
  ensurePubState()
  ensureActiveFriendSelectionState()

  appData.beers.forEach(beer => {
    if (!beer.counts) beer.counts = new Array(appData.friends.length).fill(0)
    while (beer.counts.length < appData.friends.length) beer.counts.push(0)
    if (beer.counts.length > appData.friends.length) beer.counts.length = appData.friends.length
    if (beer.likes === undefined) beer.likes = 0
    if (beer.dislikes === undefined) beer.dislikes = 0
    if (beer.price === undefined) beer.price = 0
    if (beer.vol === undefined) beer.vol = 0.5
    if (beer.abv === undefined) beer.abv = 5.0
    if (!beer.drinkTime) beer.drinkTime = appData.startTime || makeCurrentTime()
    if (!beer.pubId || !appData.pubs.some(pub => pub.id === beer.pubId)) beer.pubId = appData.activePubId
  })

  loadTheme()
  normalizeQuickSelection()
}

const stats = computed(() => {
  return computeStatsForBeers(appData.beers)
})

const activePub = computed(() =>
  appData.pubs.find(pub => pub.id === appData.activePubId) || appData.pubs[0] || null
)

const activeBeers = computed(() =>
  appData.beers.filter(beer => beer.pubId === appData.activePubId)
)

const activePubStats = computed(() =>
  computeStatsForBeers(activeBeers.value)
)

const activePubFriendIds = computed(() =>
  appData.activeFriendIdsByPub?.[appData.activePubId] || []
)

const activePubFriendEntries = computed(() => {
  const activeIds = new Set(activePubFriendIds.value)
  return appData.friends
    .map((friend, index) => ({ friend, index }))
    .filter(({ friend }) => activeIds.has(friend.id))
})

function incrementCount(beerId, friendIndex) {
  const beer = appData.beers.find(b => b.id === beerId)
  if (beer) { beer.counts[friendIndex]++; saveData() }
}

function decrementCount(beerId, friendIndex) {
  const beer = appData.beers.find(b => b.id === beerId)
  if (beer && beer.counts[friendIndex] > 0) { beer.counts[friendIndex]--; saveData() }
}

function saveBeerEdit(beerId, { name, style, price, vol, abv }) {
  const beer = appData.beers.find(b => b.id === beerId)
  if (beer) {
    beer.name = name || t('defaults.unknownBeer')
    beer.style = style
    beer.price = parseFloat(price) || 0
    beer.vol = parseFloat(vol) || 0.5
    beer.abv = parseFloat(abv) || 0
    saveData()
  }
}

function deleteBeer(beerId) {
  const idx = appData.beers.findIndex(b => b.id === beerId)
  if (idx !== -1) { appData.beers.splice(idx, 1); saveData() }
}

function applyQuickCountChange(beerId, delta) {
  const beer = appData.beers.find(b => b.id === beerId)
  if (!beer) return

  normalizeQuickSelection()
  if (uiState.quickSelection.length === 0) return

  let changed = false
  uiState.quickSelection.forEach(friendIndex => {
    const current = beer.counts[friendIndex] || 0
    const next = Math.max(0, current + delta)
    if (next !== current) {
      beer.counts[friendIndex] = next
      changed = true
    }
  })

  if (changed) saveData()
}

function adjustRating(beerId, field, delta) {
  const beer = appData.beers.find(b => b.id === beerId)
  if (beer) {
    beer[field] = Math.max(0, beer[field] + delta)
    saveData()
  }
}

function addToCatalog({ name, style, vol, abv }) {
  if (!name) return
  const exists = appData.catalog.some(c => c.name.toLowerCase() === name.toLowerCase())
  if (!exists) {
    appData.catalog.push({
      name,
      style: style || '',
      vol: parseFloat(vol) || 0.5,
      abv: !isNaN(parseFloat(abv)) ? parseFloat(abv) : 5.0
    })
  }
}

function addBeer({ name, style, price, vol, abv, pubId = appData.activePubId, drinkTime = makeCurrentTime() }) {
  addToCatalog({ name, style, vol, abv })
  appData.beers.unshift({
    id: makeId(),
    pubId,
    name, style,
    price: parseFloat(price) || 0,
    vol: parseFloat(vol) || 0.5,
    abv: !isNaN(parseFloat(abv)) ? parseFloat(abv) : 5.0,
    drinkTime: String(drinkTime || makeCurrentTime()),
    counts: new Array(appData.friends.length).fill(0),
    likes: 0, dislikes: 0
  })
  saveData()
}

function addOtherForFriend({ friendIndex, kind, price, pubId = appData.activePubId, drinkTime = makeCurrentTime() }) {
  if (!Number.isInteger(friendIndex) || friendIndex < 0 || friendIndex >= appData.friends.length) return

  const itemTemplates = {
    food: { name: t('otherModal.foodOption'), style: t('otherModal.foodOption'), vol: 0, abv: 0 },
    shot: { name: t('otherModal.shotOption'), style: t('otherModal.shotOption'), vol: 0.04, abv: 40 },
    bigShot: { name: t('otherModal.bigShotOption'), style: t('otherModal.bigShotOption'), vol: 0.08, abv: 40 }
  }

  const item = itemTemplates[kind]
  if (!item) return

  const parsedPrice = parseFloat(price) || 0
  const existing = appData.beers.find(b =>
    b.pubId === pubId &&
    b.name === item.name &&
    b.price === parsedPrice
  )

  if (existing) {
    existing.isOther = true
    existing.counts[friendIndex] = (existing.counts[friendIndex] || 0) + 1
  } else {
    const counts = new Array(appData.friends.length).fill(0)
    counts[friendIndex] = 1
    appData.beers.unshift({
      id: makeId(),
      pubId,
      name: item.name,
      style: item.style,
      price: parsedPrice,
      vol: item.vol,
      abv: item.abv,
      drinkTime: String(drinkTime || makeCurrentTime()),
      counts,
      likes: 0,
      dislikes: 0,
      isOther: true
    })
  }
  saveData()
}

function importBeers(text, pubId = appData.activePubId, drinkTime = makeCurrentTime()) {
  let count = 0
  text.split('\n').forEach((line, index) => {
    if (line.trim()) {
      const parts = line.split(' - ').map(p => p.trim())
      if (parts.length > 0) {
        const name = parts[0]
        const style = parts[1] || ''
        const vol = parseFloat(parts[3]) || 0.5
        const abv = !isNaN(parseFloat(parts[4])) ? parseFloat(parts[4]) : 5.0
        addToCatalog({ name, style, vol, abv })
        appData.beers.push({
          id: makeId(), pubId, name, style,
          price: parseFloat(parts[2]) || 0, vol, abv,
          drinkTime: String(drinkTime || makeCurrentTime()),
          counts: new Array(appData.friends.length).fill(0),
          likes: 0, dislikes: 0
        })
        count++
      }
    }
  })
  if (count > 0) saveData()
  return count
}

function updateBeerPrice(beerId, price) {
  const beer = appData.beers.find(b => b.id === beerId)
  if (beer) {
    beer.price = parseFloat(price) || 0
    saveData()
  }
}

function moveBeerInPub(beerId, direction) {
  const pubEntries = appData.beers
    .map((beer, index) => ({ beer, index }))
    .filter(({ beer }) => beer.pubId === appData.activePubId)

  const pos = pubEntries.findIndex(({ beer }) => beer.id === beerId)
  if (pos === -1) return

  const swapPos = direction === 'up' ? pos - 1 : pos + 1
  if (swapPos < 0 || swapPos >= pubEntries.length) return

  const indexA = pubEntries[pos].index
  const indexB = pubEntries[swapPos].index

  const beerA = appData.beers[indexA]
  const beerB = appData.beers[indexB]
  appData.beers.splice(indexA, 1, beerB)
  appData.beers.splice(indexB, 1, beerA)

  saveData()
}

function addFriend() {
  saveFriendCatalog([
    ...appData.friends,
    { id: makeId(), name: t('defaults.friend', { number: appData.friends.length + 1 }), weight: 80, gender: 'm' }
  ])
}

function setActivePub(pubId) {
  if (!appData.pubs.some(pub => pub.id === pubId)) return
  appData.activePubId = pubId
  saveData()
}

function addPub(name, address = '') {
  const trimmedName = String(name || '').trim()
  if (!trimmedName) return null
  const nickname = generateUniquePubNickname(trimmedName)
  const newPub = { id: makeId(), name: trimmedName, address: String(address || '').trim(), nickname }
  appData.pubs.push(newPub)
  appData.activeFriendIdsByPub = {
    ...appData.activeFriendIdsByPub,
    [newPub.id]: appData.friends.map(friend => friend.id)
  }
  appData.activePubId = newPub.id
  saveData()
  return newPub
}

function updatePub(pubId, { name, address }) {
  const pub = appData.pubs.find(item => item.id === pubId)
  if (!pub) return null

  pub.name = String(name || '').trim() || t('defaults.defaultPub')
  pub.address = String(address || '').trim()
  pub.nickname = generateUniquePubNickname(pub.name, pubId)
  saveData()
  return pub
}

function deletePub(pubId) {
  if (appData.pubs.length <= 1) return false
  const idx = appData.pubs.findIndex(p => p.id === pubId)
  if (idx === -1) return false

  const replacement = appData.pubs.find(p => p.id !== pubId)
  appData.beers.forEach(beer => {
    if (beer.pubId === pubId) beer.pubId = replacement.id
  })

  appData.pubs.splice(idx, 1)
  delete appData.activeFriendIdsByPub[pubId]

  if (appData.activePubId === pubId) {
    appData.activePubId = replacement.id
  }

  ensureActiveFriendSelectionState()
  saveData()
  return true
}

function updateFriend(index, field, value) {
  if (field === 'name' && !String(value).trim()) value = t('defaults.friend', { number: index + 1 })
  appData.friends[index][field] = value
  saveData()
}

function saveFriendCatalog(friends) {
  const currentFriends = appData.friends
  const normalizedFriends = (Array.isArray(friends) && friends.length ? friends : makeDefaultFriends())
    .map((friend, index) => normalizeFriend(friend, index))

  const currentIndexById = new Map(currentFriends.map((friend, index) => [friend.id, index]))
  const newFriendIds = normalizedFriends
    .filter(friend => !currentIndexById.has(friend.id))
    .map(friend => friend.id)
  const validFriendIds = new Set(normalizedFriends.map(friend => friend.id))

  appData.beers.forEach(beer => {
    const currentCounts = Array.isArray(beer.counts) ? beer.counts : []
    beer.counts = normalizedFriends.map(friend => {
      const currentIndex = currentIndexById.get(friend.id)
      return currentIndex === undefined ? 0 : (currentCounts[currentIndex] || 0)
    })
  })

  appData.friends = normalizedFriends
  appData.activeFriendIdsByPub = Object.fromEntries(
    appData.pubs.map(pub => {
      const currentSelection = Array.isArray(appData.activeFriendIdsByPub?.[pub.id])
        ? appData.activeFriendIdsByPub[pub.id]
        : []
      const filteredSelection = currentSelection.filter(id => validFriendIds.has(id))
      return [pub.id, [...new Set([...filteredSelection, ...newFriendIds])]]
    })
  )

  normalizeQuickSelection()
  saveData()
}

function deleteFriend(index) {
  saveFriendCatalog(appData.friends.filter((_, friendIndex) => friendIndex !== index))
}

function setFriendActiveForPub(friendId, isActive, pubId = appData.activePubId) {
  const normalizedFriendId = String(friendId)
  if (!appData.pubs.some(pub => pub.id === pubId)) return
  if (!appData.friends.some(friend => friend.id === normalizedFriendId)) return

  const currentSelection = appData.activeFriendIdsByPub?.[pubId] || []
  const hasFriend = currentSelection.includes(normalizedFriendId)
  if (isActive && !hasFriend) {
    appData.activeFriendIdsByPub = {
      ...appData.activeFriendIdsByPub,
      [pubId]: [...currentSelection, normalizedFriendId]
    }
    saveData()
    return
  }

  if (!isActive && hasFriend) {
    appData.activeFriendIdsByPub = {
      ...appData.activeFriendIdsByPub,
      [pubId]: currentSelection.filter(id => id !== normalizedFriendId)
    }
    saveData()
  }
}

function selectAllFriendsForPub(pubId = appData.activePubId) {
  if (!appData.pubs.some(pub => pub.id === pubId)) return
  appData.activeFriendIdsByPub = {
    ...appData.activeFriendIdsByPub,
    [pubId]: appData.friends.map(friend => friend.id)
  }
  saveData()
}

function clearActiveFriendsForPub(pubId = appData.activePubId) {
  if (!appData.pubs.some(pub => pub.id === pubId)) return
  appData.activeFriendIdsByPub = {
    ...appData.activeFriendIdsByPub,
    [pubId]: []
  }
  saveData()
}

function resetCounts() {
  appData.beers.forEach(b => { b.counts = new Array(appData.friends.length).fill(0) })
  appData.startTime = makeDefaultStart()
  saveData()
}

function clearActivePubDrinking() {
  let changed = false
  appData.beers.forEach(beer => {
    if (beer.pubId !== appData.activePubId) return
    beer.counts = new Array(appData.friends.length).fill(0)
    changed = true
  })
  if (changed) saveData()
}

function clearAll() {
  const defaultFriends = makeDefaultFriends()
  const defaultPubs = makeDefaultPubs()
  appData.startTime = makeDefaultStart()
  appData.friends = defaultFriends
  appData.pubs = defaultPubs
  appData.activePubId = appData.pubs[0].id
  appData.beers = []
  appData.catalog = []
  appData.activeFriendIdsByPub = makeDefaultActiveFriendIdsByPub(defaultFriends, defaultPubs)
  uiState.quickMode = 'single'
  uiState.quickSelection = [0]
  saveData()
}

function setTheme(theme) {
  if (theme !== 'dark' && theme !== 'light') return
  uiState.theme = theme
  syncTheme()
  saveTheme()
}

function toggleTheme() {
  setTheme(uiState.theme === 'dark' ? 'light' : 'dark')
}

function setQuickMode(mode) {
  if (mode !== 'single' && mode !== 'group') return
  uiState.quickMode = mode
  normalizeQuickSelection()
}

function toggleQuickFriend(index) {
  if (index < 0 || index >= appData.friends.length) return

  if (uiState.quickMode === 'single') {
    uiState.quickSelection = [index]
    return
  }

  if (uiState.quickSelection.includes(index)) {
    uiState.quickSelection = uiState.quickSelection.filter(selectedIndex => selectedIndex !== index)
  } else {
    uiState.quickSelection = [...uiState.quickSelection, index]
  }
  normalizeQuickSelection()
}

function quickSelectAll() {
  uiState.quickMode = 'group'
  uiState.quickSelection = appData.friends.map((_, index) => index)
  normalizeQuickSelection()
}

function quickClearSelection() {
  uiState.quickSelection = []
  normalizeQuickSelection()
}

function applyQuickIncrement(beerId) {
  applyQuickCountChange(beerId, 1)
}

function applyQuickDecrement(beerId) {
  applyQuickCountChange(beerId, -1)
}

function copyBeersFromPub(sourcePubId, targetPubId = appData.activePubId) {
  if (sourcePubId === targetPubId) return 0
  if (!appData.pubs.some(p => p.id === sourcePubId)) return 0
  if (!appData.pubs.some(p => p.id === targetPubId)) return 0

  const sourceBeers = appData.beers.filter(b => b.pubId === sourcePubId)
  const targetBeerNames = new Set(
    appData.beers
      .filter(b => b.pubId === targetPubId)
      .map(b => String(b.name || '').trim().toLowerCase())
  )

  let count = 0
  sourceBeers.forEach(beer => {
    const name = String(beer.name || '').trim()
    if (!name || targetBeerNames.has(name.toLowerCase())) return
    appData.beers.push({
      id: makeId(),
      pubId: targetPubId,
      name,
      style: beer.style,
      price: beer.price,
      vol: beer.vol,
      abv: beer.abv,
      drinkTime: beer.drinkTime,
      counts: new Array(appData.friends.length).fill(0),
      likes: 0,
      dislikes: 0
    })
    targetBeerNames.add(name.toLowerCase())
    count++
  })

  if (count > 0) saveData()
  return count
}

loadTheme()

export function useAppData() {
  return {
    appData, stats, uiState, activePub, activeBeers, activePubStats, activePubFriendIds, activePubFriendEntries,
    loadData, saveData,
    incrementCount, decrementCount,
    saveBeerEdit, deleteBeer, adjustRating,
    addBeer, addOtherForFriend, importBeers, updateBeerPrice, moveBeerInPub,
    setActivePub, addPub, updatePub, deletePub,
    addFriend, updateFriend, deleteFriend, saveFriendCatalog,
    setFriendActiveForPub, selectAllFriendsForPub, clearActiveFriendsForPub,
    resetCounts, clearActivePubDrinking, clearAll,
    setTheme, toggleTheme,
    setQuickMode, toggleQuickFriend, quickSelectAll, quickClearSelection,
    applyQuickIncrement, applyQuickDecrement,
    copyBeersFromPub,
    isBeerCountedAsAlcohol
  }
}
