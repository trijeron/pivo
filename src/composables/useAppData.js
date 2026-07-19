import { reactive, computed } from 'vue'
import { useI18n } from './useI18n.js'

const STORAGE_KEY = 'beerAppDataV8'
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

function makeCurrentTime() {
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
  beers: [],
  catalog: []
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

function parseTimeToDate(timeValue, fallbackTime) {
  const source = String(timeValue || fallbackTime || makeDefaultStart())
  const [hRaw, mRaw] = source.split(':')
  const hours = Number.parseInt(hRaw, 10)
  const minutes = Number.parseInt(mRaw, 10)
  const now = new Date()
  const parsed = new Date()
  parsed.setHours(Number.isNaN(hours) ? now.getHours() : hours, Number.isNaN(minutes) ? now.getMinutes() : minutes, 0, 0)
  if (parsed > now) parsed.setDate(parsed.getDate() - 1)
  return parsed
}

function computeStatsForBeers(beers) {
  let tableTotal = 0;
  const friendTotals = new Array(appData.friends.length).fill(0);
  
  // Místo průběžného počítání promile si uložíme celkové gramy alkoholu a čas prvního drinku
  const friendGramsAlcohol = new Array(appData.friends.length).fill(0);
  const friendFirstDrinkTimes = new Array(appData.friends.length).fill(null);
  
  const now = new Date();

  beers.forEach(beer => {
    const price = parseFloat(beer.price) || 0;
    const abv = parseFloat(beer.abv) || 0;
    const vol = parseFloat(beer.vol) || 0;
    
    // Zjistíme, zda jde o alkoholický nápoj (nealko piva mohou mít např. 0.5, Birell má 0)
    const isAlcoholic = abv > 0; 
    const gramsPerBeer = vol * 1000 * (abv / 100) * 0.8;
    const beerTime = parseTimeToDate(beer.drinkTime, appData.startTime);

    beer.counts.forEach((count, fi) => {
      if (!count) return;

      // 1. Útrata (počítáme vždy, i pro nealko)
      friendTotals[fi] += count * price;
      tableTotal += count * price;

      // 2. Alkohol (počítáme jen pokud to má nějaké volty)
      if (isAlcoholic) {
        friendGramsAlcohol[fi] += count * gramsPerBeer;

        // Uložíme si čas úplně prvního ALKOHOLICKÉHO drinku pro start metabolismu
        if (!friendFirstDrinkTimes[fi] || beerTime < friendFirstDrinkTimes[fi]) {
          friendFirstDrinkTimes[fi] = beerTime;
        }
      }
    });
  });

  // 3. Finální výpočet BAC (promile) pro každého kamaráda najednou
  const friendBacs = friendGramsAlcohol.map((totalGrams, fi) => {
    // Pokud vypil jen nealko (nebo nic), má rovnou 0
    if (totalGrams === 0) return 0; 

    const friend = appData.friends[fi] || {};
    const r = friend.gender === 'f' ? 0.55 : 0.68;
    const bodyWeight = (parseFloat(friend.weight) || 80) * r;

    // Teoretické promile, kdyby se nic neodbourávalo
    const theoreticalBac = totalGrams / bodyWeight;

    // Kolik hodin uběhlo od PRVNÍHO piva s alkoholem
    const hoursElapsed = Math.max(0, (now - friendFirstDrinkTimes[fi]) / (1000 * 60 * 60));

    // Játra pálí cca 0.15 promile za hodinu
    const currentBac = theoreticalBac - (hoursElapsed * 0.15);

    return Math.max(0, currentBac);
  });

  // 4. Výpočet hodin do vystřízlivění
  const friendSobers = friendBacs.map(v => (v > 0 ? v / 0.15 : 0));

  return { tableTotal, friendTotals, friendBacs, friendSobers };
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
    id: Date.now(),
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

  const counts = new Array(appData.friends.length).fill(0)
  counts[friendIndex] = 1

  appData.beers.unshift({
    id: Date.now(),
    pubId,
    name: item.name,
    style: item.style,
    price: parseFloat(price) || 0,
    vol: item.vol,
    abv: item.abv,
    drinkTime: String(drinkTime || makeCurrentTime()),
    counts,
    likes: 0,
    dislikes: 0
  })
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
          id: Date.now() + index, pubId, name, style,
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

  const temp = appData.beers[indexA]
  appData.beers[indexA] = appData.beers[indexB]
  appData.beers[indexB] = temp

  saveData()
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
  appData.startTime = makeDefaultStart()
  appData.friends = makeDefaultFriends()
  appData.pubs = makeDefaultPubs()
  appData.activePubId = appData.pubs[0].id
  appData.beers = []
  appData.catalog = []
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
    appData, stats, uiState, activePub, activeBeers, activePubStats,
    loadData, saveData,
    incrementCount, decrementCount,
    saveBeerEdit, deleteBeer, adjustRating,
    addBeer, addOtherForFriend, importBeers, updateBeerPrice, moveBeerInPub,
    setActivePub, addPub,
    addFriend, updateFriend, deleteFriend,
    resetCounts, clearActivePubDrinking, clearAll,
    setTheme, toggleTheme,
    setQuickMode, toggleQuickFriend, quickSelectAll, quickClearSelection,
    applyQuickIncrement, applyQuickDecrement
  }
}
