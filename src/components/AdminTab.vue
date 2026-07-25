<script setup>
import { ref, computed, watch, useTemplateRef } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import { beerCatalog, beerStyleGroups, styleDefaultAbv } from '../data/beerCatalog.js'

const {
  appData,
  activePub,
  activeBeers,
  addPub,
  updatePub,
  deletePub,
  addBeer,
  resetCounts,
  clearAll,
  setActivePub,
  saveBeerEdit,
  deleteBeer,
  updateBeerPrice,
  moveBeerInPub
} = useAppData()
const { t, translateBeerGroupLabel, translateBeerStyle } = useI18n()

function makeCurrentTime() {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

const newPubName = ref('')
const newPubAddress = ref('')
const newName  = ref('')
const newStyle = ref('')
const newPrice = ref('')
const newVol   = ref('0.5')
const newAbv   = ref('5.0')
const newDrinkTime = ref(makeCurrentTime())
const editPubName = ref('')
const editPubAddress = ref('')
const editingBeerId = ref(null)
const editBeerName = ref('')
const editBeerStyle = ref('')
const editBeerPrice = ref('')
const editBeerVol = ref('')
const editBeerAbv = ref('')
const importText = ref('')
const simpleImport = ref(true)
const showAutocomplete = ref(false)
const selectedCatalogBeer = ref(null)
const pubManagementSection = useTemplateRef('pubManagementSection')
const showQuickCatalogModal = ref(false)
const quickCatalogSelection = ref({})
const quickCatalogPrices = ref({})

// Import confirmation dialog
const showImportDialog = ref(false)
const parsedImportBeers = ref([])

// Delete pub confirmation dialog
const showDeletePubModal = ref(false)
const pubToDelete = ref(null)

function makeBeerFingerprint(beer) {
  return [
    String(beer.name || '').trim().toLowerCase(),
    String(beer.style || '').trim().toLowerCase(),
    Number(beer.price) || 0,
    Number(beer.vol) || 0.5,
    Number(beer.abv) || 0
  ].join('|')
}

watch(activePub, (pub) => {
  editPubName.value = pub?.name || ''
  editPubAddress.value = pub?.address || ''
}, { immediate: true })

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

const quickCatalogItems = computed(() => {
  const activePubBeerKeys = new Set(activeBeers.value.map(makeBeerFingerprint))
  const byKey = new Map()
  const namesSeen = new Set()

  appData.beers.forEach(beer => {
    const key = makeBeerFingerprint(beer)
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        name: beer.name || '',
        style: beer.style || '',
        price: Number(beer.price) || 0,
        vol: Number(beer.vol) || 0.5,
        abv: Number(beer.abv) || 0,
        pubNames: new Set(),
        fromCatalogOnly: false
      })
    }
    namesSeen.add((beer.name || '').trim().toLowerCase())
    const pubName = appData.pubs.find(pub => pub.id === beer.pubId)?.name
    if (pubName) byKey.get(key).pubNames.add(pubName)
  })

  combinedCatalog.value.forEach(beer => {
    const lname = (beer.name || '').trim().toLowerCase()
    if (namesSeen.has(lname)) return
    namesSeen.add(lname)
    const entry = { ...beer, price: Number(beer.price) || 0 }
    const key = makeBeerFingerprint(entry)
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        name: beer.name || '',
        style: beer.style || '',
        price: Number(beer.price) || 0,
        vol: Number(beer.vol) || 0.5,
        abv: Number(beer.abv) || 0,
        pubNames: new Set(),
        fromCatalogOnly: true
      })
    }
  })

  return Array.from(byKey.values())
    .map(item => ({
      ...item,
      pubNames: Array.from(item.pubNames).sort((a, b) => a.localeCompare(b)),
      existsInActivePub: activePubBeerKeys.has(item.key)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

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

function openQuickCatalogModal() {
  quickCatalogSelection.value = {}
  quickCatalogPrices.value = {}
  showQuickCatalogModal.value = true
}

function closeQuickCatalogModal() {
  showQuickCatalogModal.value = false
}

function selectAllQuickCatalog() {
  const next = {}
  quickCatalogItems.value.forEach(item => {
    if (!item.existsInActivePub) next[item.key] = true
  })
  quickCatalogSelection.value = next
}

function clearQuickCatalogSelection() {
  quickCatalogSelection.value = {}
}

const selectedQuickCatalogCount = computed(() =>
  quickCatalogItems.value.reduce((count, item) => count + (quickCatalogSelection.value[item.key] ? 1 : 0), 0)
)

function addSelectedCatalogBeersToPub() {
  quickCatalogItems.value.forEach(item => {
    if (!quickCatalogSelection.value[item.key] || item.existsInActivePub) return
    const price = quickCatalogPrices.value[item.key] != null
      ? parseFloat(quickCatalogPrices.value[item.key]) || 0
      : item.price
    addBeer({
      name: item.name,
      style: item.style,
      price,
      vol: item.vol,
      abv: item.abv
    })
  })
  closeQuickCatalogModal()
}

function submitPub() {
  const createdPub = addPub(newPubName.value, newPubAddress.value)
  if (createdPub) {
    newPubName.value = ''
    newPubAddress.value = ''
  }
}

function submitPubEdit() {
  if (!activePub.value) return
  updatePub(activePub.value.id, {
    name: editPubName.value,
    address: editPubAddress.value
  })
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

function openBeerEdit(beer) {
  editingBeerId.value = beer.id
  editBeerName.value = beer.name
  editBeerStyle.value = beer.style
  editBeerPrice.value = String(beer.price)
  editBeerVol.value = String(beer.vol)
  editBeerAbv.value = String(beer.abv)
}

function cancelBeerEdit() {
  editingBeerId.value = null
}

function submitBeerEdit() {
  if (editingBeerId.value === null) return
  saveBeerEdit(editingBeerId.value, {
    name: editBeerName.value,
    style: editBeerStyle.value,
    price: editBeerPrice.value,
    vol: editBeerVol.value,
    abv: editBeerAbv.value
  })
  editingBeerId.value = null
}

function removeBeer(beerId) {
  if (confirm(t('beer.deleteConfirm'))) {
    deleteBeer(beerId)
    if (editingBeerId.value === beerId) editingBeerId.value = null
  }
}

function scrollToPubManagement() {
  pubManagementSection.value?.scrollIntoView({ behavior: 'smooth' })
}

function onStyleChange() {
  if (!simpleImport.value && newStyle.value) {
    const defaultAbv = styleDefaultAbv[newStyle.value]
    if (defaultAbv !== undefined) newAbv.value = String(defaultAbv)
  }
}

function onEditStyleChange() {
  if (editBeerStyle.value) {
    const defaultAbv = styleDefaultAbv[editBeerStyle.value]
    if (defaultAbv !== undefined) editBeerAbv.value = String(defaultAbv)
  }
}

function openDeletePubModal() {
  if (!activePub.value) return
  pubToDelete.value = activePub.value
  showDeletePubModal.value = true
}

function confirmDeletePub() {
  if (pubToDelete.value) deletePub(pubToDelete.value.id)
  showDeletePubModal.value = false
  pubToDelete.value = null
}

function cancelDeletePub() {
  showDeletePubModal.value = false
  pubToDelete.value = null
}
</script>

<template>
  <div class="tab-content">
    <div v-if="showQuickCatalogModal" class="modal" @click.self="closeQuickCatalogModal">
      <div class="modal-content quick-catalog-modal-content">
        <span class="close-modal" @click="closeQuickCatalogModal">&times;</span>
        <h3>{{ t('admin.catalogModalTitle') }}</h3>
        <p class="quick-catalog-subtitle">{{ t('admin.catalogModalSubtitle', { pub: activePub?.name || t('defaults.defaultPub') }) }}</p>
        <div v-if="quickCatalogItems.length === 0" class="price-list-empty">{{ t('admin.catalogEmpty') }}</div>
        <template v-else>
          <div class="quick-catalog-actions">
            <button type="button" class="btn-secondary" @click="selectAllQuickCatalog">{{ t('admin.catalogSelectAll') }}</button>
            <button type="button" class="btn-secondary" @click="clearQuickCatalogSelection">{{ t('admin.catalogClear') }}</button>
          </div>
          <div class="quick-catalog-list">
            <div class="quick-catalog-head">
              <span></span>
              <span>{{ t('admin.importColName') }}</span>
              <span class="qc-col-style">{{ t('admin.importColStyle') }}</span>
              <span>{{ t('admin.importColPrice') }}</span>
              <span class="qc-col-vol">{{ t('admin.importColVol') }}</span>
              <span class="qc-col-abv">{{ t('admin.importColAbv') }}</span>
              <span class="qc-col-pubs">{{ t('admin.catalogSourcePubs') }}</span>
            </div>
            <label v-for="item in quickCatalogItems" :key="item.key" class="quick-catalog-row">
              <input v-model="quickCatalogSelection[item.key]" type="checkbox" :disabled="item.existsInActivePub">
              <span>{{ item.name }}</span>
              <span class="qc-col-style">{{ translateBeerStyle(item.style) }}</span>
              <input
                v-if="!item.existsInActivePub"
                v-model="quickCatalogPrices[item.key]"
                class="qc-price-input"
                type="number"
                min="0"
                step="0.5"
                :placeholder="item.price || '0'"
                @click.prevent
              >
              <span v-else>{{ item.price }}</span>
              <span class="qc-col-vol">{{ item.vol }}</span>
              <span class="qc-col-abv">{{ item.abv }}</span>
              <span class="qc-col-pubs">
                {{ item.pubNames.join(', ') }}
                <em v-if="item.existsInActivePub"> · {{ t('admin.catalogAlreadyInPub') }}</em>
                <em v-else-if="item.fromCatalogOnly" style="color: var(--muted);">katalog</em>
              </span>
            </label>
          </div>
          <div class="import-dialog-actions">
            <button type="button" class="btn-add" :disabled="selectedQuickCatalogCount === 0" @click="addSelectedCatalogBeersToPub">
              {{ t('admin.catalogQuickAdd', { count: selectedQuickCatalogCount }) }}
            </button>
            <button type="button" class="btn-secondary" @click="closeQuickCatalogModal">{{ t('admin.importCancel') }}</button>
          </div>
        </template>
      </div>
    </div>

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

    <div v-if="activePub" class="active-pub-badge" @click="scrollToPubManagement">
      {{ activePub.name }}
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
        <button type="button" class="btn-secondary" @click="openQuickCatalogModal">{{ t('admin.openQuickCatalog') }}</button>
        <select v-model="newStyle" class="new-beer-style" @change="onStyleChange">
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
        <div v-for="(beer, i) in activeBeers" :key="beer.id" class="price-list-row">
          <div class="price-list-order">
            <button type="button" class="btn-order" :disabled="i === 0" :title="t('admin.moveUp')" @click="moveBeerInPub(beer.id, 'up')">▲</button>
            <button type="button" class="btn-order" :disabled="i === activeBeers.length - 1" :title="t('admin.moveDown')" @click="moveBeerInPub(beer.id, 'down')">▼</button>
          </div>
          <template v-if="editingBeerId === beer.id">
            <div class="price-list-editor">
              <input v-model="editBeerName" type="text" :placeholder="t('admin.beerNamePlaceholder')">
              <select v-model="editBeerStyle" @change="onEditStyleChange">
                <option value="">{{ t('admin.beerStylePlaceholder') }}</option>
                <optgroup v-for="group in beerStyleGroups" :key="group.label" :label="translateBeerGroupLabel(group.label)">
                  <option v-for="style in group.styles" :key="style" :value="style">{{ translateBeerStyle(style) }}</option>
                </optgroup>
              </select>
              <input v-model="editBeerPrice" type="number" min="0" step="0.5" :placeholder="t('admin.pricePlaceholder')" @focus="editBeerPrice = ''">
              <input v-model="editBeerVol" type="number" min="0.1" step="0.1" :placeholder="t('admin.volumePlaceholder')" @focus="editBeerVol = ''">
              <input v-model="editBeerAbv" type="number" min="0" step="0.1" :placeholder="t('admin.abvPlaceholder')" @focus="editBeerAbv = ''">
            </div>
            <div class="price-list-actions">
              <button type="button" class="btn-save-edit" @click="submitBeerEdit">{{ t('beer.save') }}</button>
              <button type="button" class="btn-cancel-edit" @click="cancelBeerEdit">{{ t('beer.cancel') }}</button>
              <button type="button" class="btn-danger price-list-delete" @click="removeBeer(beer.id)">{{ t('beer.delete') }}</button>
            </div>
          </template>
          <template v-else>
            <span class="price-list-name">{{ beer.name }}</span>
            <span class="price-list-meta">{{ beer.vol }}l · {{ beer.abv }}%</span>
            <input
              class="price-list-input"
              type="number"
              :value="beer.price"
              min="0"
              step="0.5"
              @focus="$event.target.select()"
              @change="updateBeerPrice(beer.id, $event.target.value)"
            >
            <span class="price-list-currency">{{ t('currency') }}</span>
            <button type="button" class="btn-edit" @click="openBeerEdit(beer)">✏️</button>
          </template>
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

    <div ref="pubManagementSection" class="section">
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
          <input v-model="newPubAddress" type="text" :placeholder="t('admin.pubAddressPlaceholder')">
          <button type="submit" class="btn-secondary">{{ t('admin.addPubButton') }}</button>
        </form>
      </div>
      <form v-if="activePub" class="pub-edit-form" @submit.prevent="submitPubEdit">
        <h3>{{ t('admin.editActivePub') }}</h3>
        <input v-model="editPubName" type="text" :placeholder="t('admin.pubPlaceholder')">
        <input v-model="editPubAddress" type="text" :placeholder="t('admin.pubAddressPlaceholder')">
        <div class="pub-edit-actions">
          <button type="submit" class="btn-secondary">{{ t('admin.savePubButton') }}</button>
          <button
            v-if="appData.pubs.length > 1"
            type="button"
            class="btn-danger"
            @click="openDeletePubModal"
          >{{ t('admin.deletePubButton') }}</button>
        </div>
      </form>
    </div>

    <!-- Delete pub confirmation modal -->
    <div v-if="showDeletePubModal" class="modal" @click.self="cancelDeletePub">
      <div class="modal-content">
        <span class="close-modal" @click="cancelDeletePub">&times;</span>
        <h3>{{ t('admin.deletePubConfirmTitle') }}</h3>
        <p>{{ t('admin.deletePubConfirmBody', { name: pubToDelete?.name || '' }) }}</p>
        <div class="import-dialog-actions">
          <button type="button" class="btn-danger" @click="confirmDeletePub">{{ t('admin.deletePubConfirm') }}</button>
          <button type="button" class="btn-secondary" @click="cancelDeletePub">{{ t('admin.deletePubCancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
