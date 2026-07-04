<script setup>
import { ref, computed } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { beerCatalog } from '../data/beerCatalog.js'

const { appData, addBeer, importBeers, resetCounts, clearAll } = useAppData()

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
  if (count > 0) { alert(`Naimportováno ${count} piv.`); importText.value = '' }
}

function doReset() {
  if (confirm('Vynulovat všem pijákům vypitá piva (vynuluje se útrata i promile)?')) resetCounts()
}

function doClear() {
  if (confirm('Smazat VŠECHNO a začít od nuly?')) clearAll()
}
</script>

<template>
  <div class="tab-content">
    <div class="section">
      <h2>Přidat pivo z nabídky</h2>
      <form class="add-beer-form" autocomplete="off" @submit.prevent="submitBeer">
        <div class="autocomplete-wrapper">
          <input
            v-model="newName"
            class="new-beer-name"
            type="text"
            placeholder="Začni psát název..."
            required
            @focus="showAutocomplete = true"
            @blur="setTimeout(() => { showAutocomplete = false }, 150)"
          >
          <div v-if="showAutocomplete && acMatches.length" class="autocomplete-items">
            <div v-for="item in acMatches" :key="item.name" @mousedown.prevent="selectAc(item)">
              <span class="ac-name">{{ item.name }}</span>
              <span class="ac-desc">{{ item.style }} • {{ item.price }} Kč • {{ item.abv }}%</span>
            </div>
          </div>
        </div>
        <input v-model="newStyle" class="new-beer-style" type="text" placeholder="Styl (např. 11°)">
        <input v-model="newPrice" class="new-beer-price" type="number" placeholder="Cena Kč" min="0" step="0.5">
        <input v-model="newVol"   class="new-beer-vol"   type="number" placeholder="Objem (l)" min="0.1" step="0.1">
        <input v-model="newAbv"   class="new-beer-abv"   type="number" placeholder="Alkohol %"  min="0"   step="0.1">
        <button type="submit" class="btn-add">+ Přidat pivo na stůl</button>
      </form>

      <details>
        <summary>Hromadný import piv ze seznamu</summary>
        <p style="font-size: 0.85em; color: #666; margin-bottom: 5px;">
          Formát: <strong>Název - Styl - Cena - Objem - Alk(%)</strong>
        </p>
        <textarea v-model="importText" class="import-area" rows="4" placeholder="Např:&#10;Pilsner Urquell - Ležák - 65 - 0.5 - 4.4"></textarea>
        <button type="button" class="btn-import" @click="doImport">Naimportovat</button>
      </details>
    </div>

    <div class="section">
      <h2>Čas a Platba</h2>
      <div class="time-setup">
        Začátek akce (první pivo):
        <input v-model="appData.startTime" type="time">
      </div>
      <div class="tools-flex">
        <button type="button" class="btn-warning" @click="doReset">🔄 Zaplaceno (Vynulovat čárky)</button>
        <button type="button" class="btn-danger"  @click="doClear">🗑️ Smazat úplně vše</button>
      </div>
    </div>
  </div>
</template>
