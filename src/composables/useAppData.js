import { reactive, computed } from 'vue'
import { useI18n } from './useI18n.js'

const STORAGE_KEY = 'beerAppDataV7'
const THEME_STORAGE_KEY = 'beerAppThemeV1'

const { t } = useI18n()

function makeDefaultFriends() {
  return [
    { name: t('defaults.me'), weight: 80, gender: 'm' }
  ]
}

function makeDefaultStart() {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

function makePubId() {
  return `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function makeDefaultPubs() {
  return [
    { id: 'pub-default', name: t('defaults.defaultPub') }
  ]
}

// Module-level singleton so all components share the same state
const appData = reactive({
  startTime: makeDefaultStart(),
  friends: makeDefaultFriends(),
  pubs: makeDefaultPubs(),
  activePubId: 'pub-default',
  beers: []
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
      name: String(pub.name || t('defaults.defaultPub')).trim() || t('defaults.defaultPub')
    }))

  if (appData.pubs.length === 0) {
    appData.pubs = makeDefaultPubs()
  }

  if (!appData.pubs.some(pub => pub.id === appData.activePubId)) {
    appData.activePubId = appData.pubs[0].id
  }
}

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)) } catch (e) {}
}

function loadData() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('beerAppDataV6') ||
      localStorage.getItem('beerAppDataV5')
    if (raw) {
      const parsed = JSON.parse(raw)
      appData.startTime = parsed.startTime || makeDefaultStart()
      appData.friends = parsed.friends || makeDefaultFriends()
      appData.pubs = parsed.pubs || makeDefaultPubs()
      appData.activePubId = parsed.activePubId || appData.pubs[0]?.id || 'pub-default'
      appData.beers = parsed.beers || []
    }
  } catch (e) {}

  appData.friends = appData.friends.map(f =>
    typeof f === 'string' ? { name: f, weight: 80, gender: 'm' } : f
  )
  if (!appData.startTime) appData.startTime = makeDefaultStart()
  ensurePubState()

  appData.beers.forEach(beer => {
    if (!beer.counts) beer.counts = new Array(appData.friends.length).fill(0)
    while (beer.counts.length < appData.friends.length) beer.counts.push(0)
    if (beer.counts.length > appData.friends.length) beer.counts.length = appData.friends.length
    if (beer.likes === undefined) beer.likes = 0
    if (beer.dislikes === undefined) beer.dislikes = 0
    if (beer.price === undefined) beer.price = 0
    if (beer.vol === undefined) beer.vol = 0.5
    if (beer.abv === undefined) beer.abv = 5.0
    if (!beer.pubId || !appData.pubs.some(pub => pub.id === beer.pubId)) beer.pubId = appData.activePubId
  })

  loadTheme()
  normalizeQuickSelection()
}

const stats = computed(() => {
  let tableTotal = 0
  const friendTotals = new Array(appData.friends.length).fill(0)
  const friendAlcoholGrams = new Array(appData.friends.length).fill(0)

  appData.beers.forEach(beer => {
    const price = parseFloat(beer.price) || 0
    const gramsPerBeer = (parseFloat(beer.vol) || 0) * 1000 * ((parseFloat(beer.abv) || 0) / 100) * 0.8
    beer.counts.forEach((count, fi) => {
      friendTotals[fi] += count * price
      tableTotal += count * price
      friendAlcoholGrams[fi] += count * gramsPerBeer
    })
  })

  const now = new Date()
  const [startH, startM] = appData.startTime.split(':')
  const startObj = new Date()
  startObj.setHours(parseInt(startH), parseInt(startM), 0, 0)
  if (startObj > now) startObj.setDate(startObj.getDate() - 1)
  const hoursElapsed = Math.max(0, (now - startObj) / (1000 * 60 * 60))

  const friendBacs = []
  const friendSobers = []
  appData.friends.forEach((friend, i) => {
    const totalGrams = friendAlcoholGrams[i]
    if (totalGrams === 0) {
      friendBacs.push(0)
      friendSobers.push(0)
    } else {
      const theoreticalBac = totalGrams / ((parseFloat(friend.weight) || 80) * (friend.gender === 'f' ? 0.55 : 0.68))
      const currentBac = Math.max(0, theoreticalBac - hoursElapsed * 0.15)
      friendBacs.push(currentBac)
      friendSobers.push(currentBac / 0.15)
    }
  })

  return { tableTotal, friendTotals, friendBacs, friendSobers }
})

const activePub = computed(() =>
  appData.pubs.find(pub => pub.id === appData.activePubId) || appData.pubs[0] || null
)

const activeBeers = computed(() =>
  appData.beers.filter(beer => beer.pubId === appData.activePubId)
)

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

function addBeer({ name, style, price, vol, abv, pubId = appData.activePubId }) {
  appData.beers.unshift({
    id: Date.now(),
    pubId,
    name, style,
    price: parseFloat(price) || 0,
    vol: parseFloat(vol) || 0.5,
    abv: parseFloat(abv) || 5.0,
    counts: new Array(appData.friends.length).fill(0),
    likes: 0, dislikes: 0
  })
  saveData()
}

function importBeers(text, pubId = appData.activePubId) {
  let count = 0
  text.split('\n').forEach((line, index) => {
    if (line.trim()) {
      const parts = line.split(' - ').map(p => p.trim())
      if (parts.length > 0) {
        appData.beers.push({
          id: Date.now() + index, pubId, name: parts[0], style: parts[1] || '',
          price: parseFloat(parts[2]) || 0, vol: parseFloat(parts[3]) || 0.5,
          abv: parseFloat(parts[4]) || 5.0, counts: new Array(appData.friends.length).fill(0),
          likes: 0, dislikes: 0
        })
        count++
      }
    }
  })
  if (count > 0) saveData()
  return count
}

function addFriend() {
  appData.friends.push({ name: t('defaults.friend', { number: appData.friends.length + 1 }), weight: 80, gender: 'm' })
  appData.beers.forEach(b => b.counts.push(0))
  normalizeQuickSelection()
  saveData()
}

function setActivePub(pubId) {
  if (!appData.pubs.some(pub => pub.id === pubId)) return
  appData.activePubId = pubId
  saveData()
}

function addPub(name) {
  const trimmedName = String(name || '').trim()
  if (!trimmedName) return null
  const newPub = { id: makePubId(), name: trimmedName }
  appData.pubs.push(newPub)
  appData.activePubId = newPub.id
  saveData()
  return newPub
}

function updateFriend(index, field, value) {
  if (field === 'name' && !String(value).trim()) value = t('defaults.friend', { number: index + 1 })
  appData.friends[index][field] = value
  saveData()
}

function deleteFriend(index) {
  appData.friends.splice(index, 1)
  appData.beers.forEach(b => b.counts.splice(index, 1))
  uiState.quickSelection = uiState.quickSelection
    .filter(selectedIndex => selectedIndex !== index)
    .map(selectedIndex => selectedIndex > index ? selectedIndex - 1 : selectedIndex)
  normalizeQuickSelection()
  saveData()
}

function resetCounts() {
  appData.beers.forEach(b => { b.counts = new Array(appData.friends.length).fill(0) })
  appData.startTime = makeDefaultStart()
  saveData()
}

function clearAll() {
  appData.startTime = makeDefaultStart()
  appData.friends = makeDefaultFriends()
  appData.pubs = makeDefaultPubs()
  appData.activePubId = appData.pubs[0].id
  appData.beers = []
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

loadTheme()

export function useAppData() {
  return {
    appData, stats, uiState, activePub, activeBeers,
    loadData, saveData,
    incrementCount, decrementCount,
    saveBeerEdit, deleteBeer, adjustRating,
    addBeer, importBeers,
    setActivePub, addPub,
    addFriend, updateFriend, deleteFriend,
    resetCounts, clearAll,
    setTheme, toggleTheme,
    setQuickMode, toggleQuickFriend, quickSelectAll, quickClearSelection,
    applyQuickIncrement, applyQuickDecrement
  }
}
