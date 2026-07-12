<script setup>
import { ref, computed } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import { beerCatalog, beerStyleGroups } from '../data/beerCatalog.js'

const { appData, addBeer, importBeers, resetCounts, clearAll } = useAppData()
const { t, translateBeerGroupLabel, translateBeerStyle } = useI18n()

const newName  = ref('')
const newStyle = ref('')
const newPrice = ref('')
const newVol   = ref('0.5')
const newAbv   = ref('5.0')
const importText = ref('')
const showAutocomplete = ref(false)

const acMatches = computed(() => {
  if (!newName.value) return []
  const val = newName.value.toLowerCase()
  return beerCatalog.filter(b => b.name.toLowerCase().includes(val)).slice(0, 15)
})

function selectAc(item) {
  newName.value  = item.name
  newStyle.value = item.style
  newPrice.value = String(item.price)
  newVol.value   = String(item.vol)
  newAbv.value   = String(item.abv)
  showAutocomplete.value = false
}

function submitBeer() {
  if (!newName.value.trim()) return
  addBeer({ name: newName.value.trim(), style: newStyle.value.trim(), price: newPrice.value, vol: newVol.value, abv: newAbv.value })
  newName.value = ''; newStyle.value = ''; newPrice.value = ''; newVol.value = '0.5'; newAbv.value = '5.0'
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
      <h2>{{ t('admin.addBeer') }}</h2>
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
            <div v-for="item in acMatches" :key="item.name" @mousedown.prevent="selectAc(item)">
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
        <input v-model="newVol"   class="new-beer-vol"   type="number" :placeholder="t('admin.volumePlaceholder')" min="0.1" step="0.1">
        <input v-model="newAbv"   class="new-beer-abv"   type="number" :placeholder="t('admin.abvPlaceholder')"  min="0"   step="0.1">
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
