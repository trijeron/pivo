import { reactive, computed } from 'vue'

const STORAGE_KEY = 'beerAppDataV6'

const defaultFriends = [
  { name: 'Jan', weight: 85, gender: 'm' },
  { name: 'Kámoš 2', weight: 75, gender: 'm' }
]

function makeDefaultStart() {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

// Module-level singleton so all components share the same state
const appData = reactive({
  startTime: makeDefaultStart(),
  friends: JSON.parse(JSON.stringify(defaultFriends)),
  beers: []
})

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)) } catch (e) {}
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('beerAppDataV5')
    if (raw) {
      const parsed = JSON.parse(raw)
      appData.startTime = parsed.startTime || makeDefaultStart()
      appData.friends = parsed.friends || JSON.parse(JSON.stringify(defaultFriends))
      appData.beers = parsed.beers || []
    }
  } catch (e) {}

  appData.friends = appData.friends.map(f =>
    typeof f === 'string' ? { name: f, weight: 80, gender: 'm' } : f
  )
  if (!appData.startTime) appData.startTime = makeDefaultStart()

  appData.beers.forEach(beer => {
    if (!beer.counts) beer.counts = new Array(appData.friends.length).fill(0)
    while (beer.counts.length < appData.friends.length) beer.counts.push(0)
    if (beer.counts.length > appData.friends.length) beer.counts.length = appData.friends.length
    if (beer.likes === undefined) beer.likes = 0
    if (beer.dislikes === undefined) beer.dislikes = 0
    if (beer.price === undefined) beer.price = 0
    if (beer.vol === undefined) beer.vol = 0.5
    if (beer.abv === undefined) beer.abv = 5.0
  })
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
    beer.name = name || 'Neznámé pivo'
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

function adjustRating(beerId, field, delta) {
  const beer = appData.beers.find(b => b.id === beerId)
  if (beer) {
    beer[field] = Math.max(0, beer[field] + delta)
    saveData()
  }
}

function addBeer({ name, style, price, vol, abv }) {
  appData.beers.unshift({
    id: Date.now(),
    name, style,
    price: parseFloat(price) || 0,
    vol: parseFloat(vol) || 0.5,
    abv: parseFloat(abv) || 5.0,
    counts: new Array(appData.friends.length).fill(0),
    likes: 0, dislikes: 0
  })
  saveData()
}

function importBeers(text) {
  let count = 0
  text.split('\n').forEach((line, index) => {
    if (line.trim()) {
      const parts = line.split(' - ').map(p => p.trim())
      if (parts.length > 0) {
        appData.beers.push({
          id: Date.now() + index, name: parts[0], style: parts[1] || '',
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
  appData.friends.push({ name: `Kámoš ${appData.friends.length + 1}`, weight: 80, gender: 'm' })
  appData.beers.forEach(b => b.counts.push(0))
  saveData()
}

function updateFriend(index, field, value) {
  if (field === 'name' && !String(value).trim()) value = `Kámoš ${index + 1}`
  appData.friends[index][field] = value
  saveData()
}

function deleteFriend(index) {
  appData.friends.splice(index, 1)
  appData.beers.forEach(b => b.counts.splice(index, 1))
  saveData()
}

function resetCounts() {
  appData.beers.forEach(b => { b.counts = new Array(appData.friends.length).fill(0) })
  appData.startTime = makeDefaultStart()
  saveData()
}

function clearAll() {
  appData.startTime = makeDefaultStart()
  appData.friends = JSON.parse(JSON.stringify(defaultFriends))
  appData.beers = []
  saveData()
}

export function useAppData() {
  return {
    appData, stats,
    loadData, saveData,
    incrementCount, decrementCount,
    saveBeerEdit, deleteBeer, adjustRating,
    addBeer, importBeers,
    addFriend, updateFriend, deleteFriend,
    resetCounts, clearAll
  }
}
