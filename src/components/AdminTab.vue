<script setup>
import { ref, computed } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import { beerStyleGroups } from '../data/beerCatalog.js'

const {
  appData,
  pubsState,
  activePub,
  selectPub,
  addPub,
  saveCatalogBeer,
  deleteCatalogBeer,
  addCatalogBeerToTable,
  importBeers,
  resetCounts,
  clearAll
} = useAppData()
const { t, translateBeerGroupLabel, translateBeerStyle } = useI18n()

const newPubName = ref('')
const newName = ref('')
const newStyle = ref('')
const newPrice = ref('')
const newVol = ref('0.5')
const newAbv = ref('5.0')
const importText = ref('')
const showAutocomplete = ref(false)
const editingCatalogBeerId = ref(null)

const catalogBeers = computed(() => activePub.value?.catalog || [])

const acMatches = computed(() => {
  if (!newName.value) return []
  const val = newName.value.toLowerCase()
  return catalogBeers.value.filter(b => b.name.toLowerCase().includes(val)).slice(0, 15)
})

function resetCatalogForm() {
  editingCatalogBeerId.value = null
  newName.value = ''
  newStyle.value = ''
  newPrice.value = ''
  newVol.value = '0.5'
  newAbv.value = '5.0'
  showAutocomplete.value = false
}

function selectAc(item) {
  newName.value = item.name
  newStyle.value = item.style
  newPrice.value = String(item.price)
  newVol.value = String(item.vol)
  newAbv.value = String(item.abv)
  showAutocomplete.value = false
}

function editCatalogBeer(item) {
  editingCatalogBeerId.value = item.id
  selectAc(item)
}

function submitBeer() {
  if (!activePub.value || !newName.value.trim()) return

  saveCatalogBeer(editingCatalogBeerId.value, {
    name: newName.value.trim(),
    style: newStyle.value.trim(),
    price: newPrice.value,
    vol: newVol.value,
    abv: newAbv.value
  })
  resetCatalogForm()
}

function createPub() {
  addPub(newPubName.value)
  newPubName.value = ''
}

function doImport() {
  const text = importText.value.trim()
  if (!text) return
  const count = importBeers(text)
  if (count > 0) {
    alert(t('admin.importedBeers', { count }))
    importText.value = ''
  }
}

function doDeleteCatalogBeer(item) {
  if (confirm(t('admin.deleteCatalogBeerConfirm', { name: item.name }))) {
    if (editingCatalogBeerId.value === item.id) resetCatalogForm()
    deleteCatalogBeer(item.id)
  }
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

      <div class="pub-admin-toolbar">
        <label class="pub-select-field">
          <span>{{ t('admin.selectPub') }}</span>
          <select :value="pubsState.activePubId" @change="selectPub($event.target.value)">
            <option v-for="pub in pubsState.pubs" :key="pub.id" :value="pub.id">
              {{ pub.name }}
            </option>
          </select>
        </label>

        <div class="pub-create-row">
          <input
            v-model="newPubName"
            type="text"
            class="new-pub-name"
            :placeholder="t('admin.pubNamePlaceholder')"
          >
          <button type="button" class="btn-secondary" @click="createPub">{{ t('admin.createPub') }}</button>
        </div>
      </div>

      <h3>{{ t('admin.catalogFor', { name: activePub?.name || '' }) }}</h3>
      <form class="add-beer-form" autocomplete="off" @submit.prevent="submitBeer">
        <div class="autocomplete-wrapper">
          <input
            v-model="newName"
            class="new-beer-name"
            type="text"
            :placeholder="t('admin.beerNamePlaceholder')"
            required
            @focus="showAutocomplete = true"
            @blur="setTimeout(() => { showAutocomplete = false }, 150)"
          >
          <div v-if="showAutocomplete && acMatches.length" class="autocomplete-items">
            <div v-for="item in acMatches" :key="item.id" @mousedown.prevent="selectAc(item)">
              <span class="ac-name">{{ item.name }}</span>
              <span class="ac-desc">{{ translateBeerStyle(item.style) }} • {{ item.price }} {{ t('currency') }} • {{ item.abv }}%</span>
            </div>
          </div>
        </div>
        <select v-model="newStyle" class="new-beer-style">
          <option value="">{{ t('admin.beerStylePlaceholder') }}</option>
          <optgroup v-for="group in beerStyleGroups" :key="group.label" :label="translateBeerGroupLabel(group.label)">
            <option v-for="style in group.styles" :key="style" :value="style">{{ translateBeerStyle(style) }}</option>
          </optgroup>
        </select>
        <input v-model="newPrice" class="new-beer-price" type="number" :placeholder="t('admin.pricePlaceholder')" min="0" step="0.5">
        <input v-model="newVol" class="new-beer-vol" type="number" :placeholder="t('admin.volumePlaceholder')" min="0.1" step="0.1">
        <input v-model="newAbv" class="new-beer-abv" type="number" :placeholder="t('admin.abvPlaceholder')" min="0" step="0.1">
        <button type="submit" class="btn-add">
          {{ editingCatalogBeerId ? t('admin.saveCatalogBeerChanges') : t('admin.addCatalogBeer') }}
        </button>
        <button v-if="editingCatalogBeerId" type="button" class="btn-secondary btn-form-cancel" @click="resetCatalogForm">
          {{ t('beer.cancel') }}
        </button>
      </form>

      <details>
        <summary>{{ t('admin.bulkImport') }}</summary>
        <p style="font-size: 0.85em; color: #666; margin-bottom: 5px;">
          {{ t('admin.importFormat') }} <strong>{{ t('admin.importFormatValue') }}</strong>
        </p>
        <textarea v-model="importText" class="import-area" rows="4" :placeholder="t('admin.importPlaceholder')"></textarea>
        <button type="button" class="btn-import" @click="doImport">{{ t('admin.importButton') }}</button>
      </details>

      <div v-if="catalogBeers.length" class="catalog-list">
        <div v-for="item in catalogBeers" :key="item.id" class="catalog-item">
          <div class="catalog-item-info">
            <strong>{{ item.name }}</strong>
            <span class="catalog-item-meta">
              {{ translateBeerStyle(item.style) }} • {{ item.price }} {{ t('currency') }} • {{ item.vol }}l • {{ item.abv }}%
            </span>
          </div>
          <div class="catalog-item-actions">
            <button type="button" class="btn-secondary" @click="addCatalogBeerToTable(item.id)">{{ t('admin.addBeerToTable') }}</button>
            <button type="button" class="btn-secondary" @click="editCatalogBeer(item)">{{ t('admin.editCatalogBeer') }}</button>
            <button type="button" class="btn-danger catalog-delete-btn" @click="doDeleteCatalogBeer(item)">{{ t('admin.deleteCatalogBeer') }}</button>
          </div>
        </div>
      </div>
      <p v-else class="catalog-empty">{{ t('admin.catalogEmpty') }}</p>
    </div>

    <div class="section">
      <h2>{{ t('admin.timeAndPayment') }}</h2>
      <div class="time-setup">
        {{ t('admin.eventStart') }}
        <input v-model="appData.startTime" type="time">
      </div>
      <div class="tools-flex">
        <button type="button" class="btn-warning" @click="doReset">{{ t('admin.resetPaid') }}</button>
        <button type="button" class="btn-danger" @click="doClear">{{ t('admin.clearAll') }}</button>
      </div>
    </div>
  </div>
</template>
