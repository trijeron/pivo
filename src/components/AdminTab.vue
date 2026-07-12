<script setup>
import { ref, computed } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import { beerCatalog, beerStyleGroups } from '../data/beerCatalog.js'

const { appData, activePub, addPub, addBeer, importBeers, resetCounts, clearAll, setActivePub } = useAppData()
const { t, translateBeerGroupLabel, translateBeerStyle } = useI18n()

const newPubName = ref('')
const newName  = ref('')
const newStyle = ref('')
const newPrice = ref('')
const newVol   = ref('0.5')
const newAbv   = ref('5.0')
const importText = ref('')
const simpleImport = ref(true)
const showAutocomplete = ref(false)
const selectedCatalogBeer = ref(null)

const acMatches = computed(() => {
  if (!newName.value) return []
  const val = newName.value.toLowerCase()
  return beerCatalog.filter(b => b.name.toLowerCase().includes(val)).slice(0, 15)
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
  if (updatePrice) newPrice.value = String(item.price)
}

function selectAc(item) {
  syncFromCatalogBeer(item)
  showAutocomplete.value = false
}

function findCatalogBeerByName(name) {
  const trimmedName = name.trim().toLowerCase()
  return beerCatalog.find(item => item.name.toLowerCase() === trimmedName) || null
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
    style: importedBeer?.style || newStyle.value.trim(),
    price: newPrice.value,
    vol: importedBeer?.vol ?? newVol.value,
    abv: importedBeer?.abv ?? newAbv.value
  })
  newName.value = ''; newStyle.value = ''; newPrice.value = ''; newVol.value = '0.5'; newAbv.value = '5.0'
  selectedCatalogBeer.value = null
  showAutocomplete.value = false
}

function doImport() {
  const text = importText.value.trim()
  if (!text) return
  const count = importBeers(text)
  if (count > 0) { alert(t('admin.importedBeers', { count })); importText.value = '' }
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
              <span class="ac-desc">{{ translateBeerStyle(item.style) }} • {{ item.price }} {{ t('currency') }} • {{ item.abv }}%</span>
            </div>
          </div>
        </div>
        <p v-if="simpleImport && selectedCatalogBeerDetails" class="catalog-hint">
          {{ selectedCatalogBeerDetails }}
        </p>
        <select v-if="!simpleImport" v-model="newStyle" class="new-beer-style">
          <option value="">{{ t('admin.beerStylePlaceholder') }}</option>
          <optgroup v-for="group in beerStyleGroups" :key="group.label" :label="translateBeerGroupLabel(group.label)">
            <option v-for="style in group.styles" :key="style" :value="style">{{ translateBeerStyle(style) }}</option>
          </optgroup>
        </select>
        <input v-model="newPrice" class="new-beer-price" type="number" :placeholder="t('admin.pricePlaceholder')" min="0" step="0.5">
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
