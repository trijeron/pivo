<script setup>
import { ref, computed } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import { beerCatalog, beerStyleGroups } from '../data/beerCatalog.js'

const { appData, activePub, activeBeers, addPub, addBeer, resetCounts, clearAll, setActivePub, updateBeerPrice } = useAppData()
const { t, translateBeerGroupLabel, translateBeerStyle } = useI18n()

function makeCurrentTime() {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

const newPubName = ref('')
const newName  = ref('')
const newStyle = ref('')
const newPrice = ref('')
const newVol   = ref('0.5')
const newAbv   = ref('5.0')
const newDrinkTime = ref(makeCurrentTime())
const importText = ref('')
const simpleImport = ref(true)
const showAutocomplete = ref(false)
const selectedCatalogBeer = ref(null)

// Import confirmation dialog
const showImportDialog = ref(false)
const parsedImportBeers = ref([])

const combinedCatalog = computed(() => {
  const dynamicEntries = appData.catalog
    .filter(c => !beerCatalog.some(bc => bc.name.toLowerCase() === c.name.toLowerCase()))
  return [...beerCatalog, ...dynamicEntries]
})

const acMatches = computed(() => {
  if (!newName.value) return []
  const val = newName.value.toLowerCase()
  return combinedCatalog.value.filter(b => b.name.toLowerCase().includes(val)).slice(0, 15)
})

const selectedCatalogBeerDetails = computed(() =>
  selectedCatalogBeer.value
    ? `${translateBeerStyle(selectedCatalogBeer.value.style)} • ${selectedCatalogBeer.value.vol}l • ${selectedCatalogBeer.value.abv}%`
    : ''
)

function syncFromCatalogBeer(item, updatePrice = true) {
  selectedCatalogBeer.value = item
  newName.value = item.name
  newStyle.value = item.style
  newVol.value = String(item.vol)
  newAbv.value = String(item.abv)
  if (updatePrice && item.price != null) newPrice.value = String(item.price)
}

function selectAc(item) {
  syncFromCatalogBeer(item)
  showAutocomplete.value = false
}

function findCatalogBeerByName(name) {
  const trimmedName = name.trim().toLowerCase()
  return combinedCatalog.value.find(item => item.name.toLowerCase() === trimmedName) || null
}

function onNameInput() {
  selectedCatalogBeer.value = findCatalogBeerByName(newName.value)
  if (simpleImport.value && selectedCatalogBeer.value) {
    syncFromCatalogBeer(selectedCatalogBeer.value, false)
  }
}

function onSimpleImportChange() {
  if (simpleImport.value && selectedCatalogBeer.value) {
    syncFromCatalogBeer(selectedCatalogBeer.value, false)
  }
}

function submitPub() {
  const createdPub = addPub(newPubName.value)
  if (createdPub) newPubName.value = ''
}

function submitBeer() {
  if (!newName.value.trim()) return
  const importedBeer = simpleImport.value ? (selectedCatalogBeer.value || findCatalogBeerByName(newName.value)) : null
  addBeer({
    name: importedBeer?.name || newName.value.trim(),
    style: newStyle.value,
    price: newPrice.value,
    vol: importedBeer?.vol ?? newVol.value,
    abv: importedBeer?.abv ?? newAbv.value,
    drinkTime: newDrinkTime.value
  })
  newName.value = ''; newStyle.value = ''; newPrice.value = ''; newVol.value = '0.5'; newAbv.value = '5.0'
  newDrinkTime.value = makeCurrentTime()
  selectedCatalogBeer.value = null
  showAutocomplete.value = false
}

function parseImportText(text) {
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const parts = line.split(' - ').map(p => p.trim())
      return {
        name: parts[0] || '',
        style: parts[1] || '',
        price: parseFloat(parts[2]) || 0,
        vol: parseFloat(parts[3]) || 0.5,
        abv: parseFloat(parts[4]) || 5.0
      }
    })
    .filter(b => b.name)
}

function doImport() {
  const text = importText.value.trim()
  if (!text) return
  parsedImportBeers.value = parseImportText(text)
  if (parsedImportBeers.value.length > 0) showImportDialog.value = true
}

function confirmImport() {
  const beers = parsedImportBeers.value.filter(b => b.name.trim())
  beers.forEach(b => {
    addBeer({
      name: b.name.trim(),
      style: b.style,
      price: b.price,
      vol: b.vol,
      abv: b.abv,
      drinkTime: newDrinkTime.value
    })
  })
  if (beers.length > 0) importText.value = ''
  showImportDialog.value = false
}

function removeImportBeer(index) {
  parsedImportBeers.value.splice(index, 1)
  if (parsedImportBeers.value.length === 0) showImportDialog.value = false
}

function cancelImport() {
  showImportDialog.value = false
}

function doReset() {
  if (confirm(t('admin.resetConfirm'))) resetCounts()
}

function doClear() {
  if (confirm(t('admin.clearConfirm'))) clearAll()
}
</script>

<template>
  <div class="tab-content">
    <!-- Import confirmation dialog -->
    <div v-if="showImportDialog" class="modal" @click.self="cancelImport">
      <div class="modal-content import-modal-content">
        <span class="close-modal" @click="cancelImport">&times;</span>
        <h3>{{ t('admin.importConfirmTitle') }}</h3>
        <p style="color: var(--muted); font-size: 0.9em; margin-bottom: 10px;">
          {{ t('admin.importConfirmSubtitle', { count: parsedImportBeers.length }) }}
        </p>
        <div class="import-edit-header">
          <span>{{ t('admin.importColName') }}</span>
          <span>{{ t('admin.importColStyle') }}</span>
          <span>{{ t('admin.importColPrice') }}</span>
          <span>{{ t('admin.importColVol') }}</span>
          <span>{{ t('admin.importColAbv') }}</span>
          <span></span>
        </div>
        <div class="import-edit-list">
          <div v-for="(beer, i) in parsedImportBeers" :key="i" class="import-edit-row">
            <input v-model="beer.name" class="import-edit-name" type="text" :placeholder="t('admin.beerNamePlaceholder')">
            <select v-model="beer.style" class="import-edit-style">
              <option value="">{{ t('admin.beerStylePlaceholder') }}</option>
              <optgroup v-for="group in beerStyleGroups" :key="group.label" :label="translateBeerGroupLabel(group.label)">
                <option v-for="style in group.styles" :key="style" :value="style">{{ translateBeerStyle(style) }}</option>
              </optgroup>
            </select>
            <input v-model.number="beer.price" class="import-edit-num" type="number" min="0" step="0.5">
            <input v-model.number="beer.vol" class="import-edit-num" type="number" min="0.1" step="0.1">
            <input v-model.number="beer.abv" class="import-edit-num" type="number" min="0" step="0.1">
            <button type="button" class="import-edit-remove" :title="t('admin.importRemoveBeer')" @click="removeImportBeer(i)">✕</button>
          </div>
        </div>
        <div class="import-dialog-actions">
          <button type="button" class="btn-import" :disabled="parsedImportBeers.length === 0" @click="confirmImport">{{ t('admin.importConfirm') }}</button>
          <button type="button" class="btn-secondary" @click="cancelImport">{{ t('admin.importCancel') }}</button>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('admin.pubCatalog') }}</h2>
      <div class="pub-form-row">
        <label class="pub-select-group">
          <span>{{ t('admin.activePub') }}</span>
          <select :value="appData.activePubId" @change="setActivePub($event.target.value)">
            <option v-for="pub in appData.pubs" :key="pub.id" :value="pub.id">{{ pub.name }}</option>
          </select>
        </label>
        <form class="pub-add-form" @submit.prevent="submitPub">
          <input v-model="newPubName" type="text" :placeholder="t('admin.pubPlaceholder')">
          <button type="submit" class="btn-secondary">{{ t('admin.addPubButton') }}</button>
        </form>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('admin.addBeerForPub', { pub: activePub?.name || t('defaults.defaultPub') }) }}</h2>
      <form class="add-beer-form" autocomplete="off" @submit.prevent="submitBeer">
        <label class="simple-import-toggle">
          <input v-model="simpleImport" type="checkbox" @change="onSimpleImportChange">
          <span>{{ t('admin.simpleImport') }}</span>
        </label>
        <div class="autocomplete-wrapper">
          <input
            v-model="newName"
            class="new-beer-name"
            type="text"
            :placeholder="t('admin.beerNamePlaceholder')"
            required
            @focus="showAutocomplete = true"
            @blur="setTimeout(() => { showAutocomplete = false }, 150)"
            @input="onNameInput"
          >
          <div v-if="showAutocomplete && acMatches.length" class="autocomplete-items">
            <div v-for="item in acMatches" :key="item.name" @mousedown.prevent="selectAc(item)">
              <span class="ac-name">{{ item.name }}</span>
              <span class="ac-desc">{{ translateBeerStyle(item.style) }} · {{ item.price != null ? item.price + ' ' + t('currency') : '—' }} · {{ item.abv }}%</span>
            </div>
          </div>
        </div>
        <p v-if="simpleImport && selectedCatalogBeerDetails" class="catalog-hint">
          {{ selectedCatalogBeerDetails }}
        </p>
        <select v-model="newStyle" class="new-beer-style">
          <option value="">{{ t('admin.beerStylePlaceholder') }}</option>
          <optgroup v-for="group in beerStyleGroups" :key="group.label" :label="translateBeerGroupLabel(group.label)">
            <option v-for="style in group.styles" :key="style" :value="style">{{ translateBeerStyle(style) }}</option>
          </optgroup>
        </select>
        <input v-model="newPrice" class="new-beer-price" type="number" :placeholder="t('admin.pricePlaceholder')" min="0" step="0.5">
        <input v-model="newDrinkTime" class="new-beer-time" type="time" :title="t('admin.drinkTimeLabel')">
        <input v-if="!simpleImport" v-model="newVol" class="new-beer-vol" type="number" :placeholder="t('admin.volumePlaceholder')" min="0.1" step="0.1">
        <input v-if="!simpleImport" v-model="newAbv" class="new-beer-abv" type="number" :placeholder="t('admin.abvPlaceholder')"  min="0"   step="0.1">
        <button type="submit" class="btn-add">{{ t('admin.addBeerToTable') }}</button>
      </form>

      <details>
        <summary>{{ t('admin.bulkImport') }}</summary>
        <p style="font-size: 0.85em; color: #666; margin-bottom: 5px;">
          {{ t('admin.importFormat') }} <strong>{{ t('admin.importFormatValue') }}</strong>
        </p>
        <textarea v-model="importText" class="import-area" rows="4" :placeholder="t('admin.importPlaceholder')"></textarea>
        <button type="button" class="btn-import" @click="doImport">{{ t('admin.importButton') }}</button>
      </details>
    </div>

    <div class="section">
      <h2>{{ t('admin.pubPriceList', { pub: activePub?.name || t('defaults.defaultPub') }) }}</h2>
      <div v-if="activeBeers.length === 0" class="price-list-empty">{{ t('admin.noPubBeers') }}</div>
      <div v-else class="price-list">
        <div v-for="beer in activeBeers" :key="beer.id" class="price-list-row">
          <span class="price-list-name">{{ beer.name }}</span>
          <span class="price-list-meta">{{ beer.vol }}l · {{ beer.abv }}%</span>
          <input
            class="price-list-input"
            type="number"
            :value="beer.price"
            min="0"
            step="0.5"
            @change="updateBeerPrice(beer.id, $event.target.value)"
          >
          <span class="price-list-currency">{{ t('currency') }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>{{ t('admin.timeAndPayment') }}</h2>
      <div class="time-setup">
        {{ t('admin.eventStart') }}
        <input v-model="appData.startTime" type="time">
      </div>
      <div class="tools-flex">
        <button type="button" class="btn-warning" @click="doReset">{{ t('admin.resetPaid') }}</button>
        <button type="button" class="btn-danger"  @click="doClear">{{ t('admin.clearAll') }}</button>
      </div>
    </div>
  </div>
</template>
