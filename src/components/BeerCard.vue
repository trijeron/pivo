<script setup>
import { ref } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import RatingModal from './RatingModal.vue'
import { beerStyleGroups } from '../data/beerCatalog.js'

const props = defineProps({
  beer: { type: Object, required: true }
})

const { appData, incrementCount, decrementCount, saveBeerEdit, deleteBeer } = useAppData()

const editing = ref(false)
const ratingOpen = ref(false)

const editName  = ref('')
const editStyle = ref('')
const editPrice = ref(0)
const editVol   = ref(0)
const editAbv   = ref(0)

function openEdit() {
  editName.value  = props.beer.name
  editStyle.value = props.beer.style
  editPrice.value = props.beer.price
  editVol.value   = props.beer.vol
  editAbv.value   = props.beer.abv
  editing.value   = true
}

function saveEdit() {
  saveBeerEdit(props.beer.id, {
    name:  editName.value,
    style: editStyle.value,
    price: editPrice.value,
    vol:   editVol.value,
    abv:   editAbv.value
  })
  editing.value = false
}

function onDelete() {
  if (confirm('Opravdu trvale smazat toto pivo z lístku?')) {
    deleteBeer(props.beer.id)
  }
}

function ratingIcon(beer) {
  if (beer.likes > beer.dislikes) return '👍'
  if (beer.dislikes > beer.likes) return '👎'
  if (beer.likes > 0) return '⚖️'
  return ''
}
</script>

<template>
  <div class="beer-card">
    <!-- View mode -->
    <div v-if="!editing">
      <div class="beer-header">
        <div style="flex-grow: 1;">
          <span class="gbc-name">{{ beer.name }} <span class="summary-icon">{{ ratingIcon(beer) }}</span></span>
          <span class="gbc-desc">
            {{ beer.style }} • {{ beer.price > 0 ? beer.price + ' Kč • ' : '' }}{{ beer.vol }}l • {{ beer.abv }}%
          </span>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-rate-modal-open" @click="ratingOpen = true">⭐</button>
          <button type="button" class="btn-edit" @click="openEdit">✏️</button>
        </div>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else class="beer-edit-form">
      <div class="beer-edit-inputs">
        <input v-model="editName"  type="text"   placeholder="Název"  style="flex-grow: 2; min-width: 120px;">
        <select v-model="editStyle" style="flex-grow: 1; min-width: 80px;">
          <option value="">Styl piva...</option>
          <optgroup v-for="group in beerStyleGroups" :key="group.label" :label="group.label">
            <option v-for="style in group.styles" :key="style" :value="style">{{ style }}</option>
          </optgroup>
        </select>
        <input v-model="editPrice" type="number" placeholder="Kč"     style="width: 55px;">
        <input v-model="editVol"   type="number" step="0.1"           style="width: 55px;">
        <input v-model="editAbv"   type="number" step="0.1"           style="width: 55px;">
      </div>
      <div style="display: flex; gap: 10px; justify-content: space-between;">
        <div>
          <button type="button" class="btn-save-edit"   @click="saveEdit">Uložit</button>
          <button type="button" class="btn-cancel-edit" @click="editing = false">Zrušit</button>
        </div>
        <button type="button" class="btn-danger" style="padding: 6px 10px;" @click="onDelete">🗑️ Smazat pivo</button>
      </div>
    </div>

    <!-- Friend tally buttons -->
    <div class="beer-friends-list">
      <div v-for="(friend, fi) in appData.friends" :key="fi" class="friend-pill-wrapper">
        <button type="button" class="friend-pill" @click="incrementCount(beer.id, fi)">
          {{ friend.name }}
          <span class="pill-count" :class="{ 'has-tasted': beer.counts[fi] > 0 }">{{ beer.counts[fi] || 0 }}</span>
        </button>
        <button type="button" class="friend-pill-minus" @click="decrementCount(beer.id, fi)">-</button>
      </div>
    </div>

    <!-- Rating modal -->
    <RatingModal v-if="ratingOpen" :beer="beer" @close="ratingOpen = false" />
  </div>
</template>
