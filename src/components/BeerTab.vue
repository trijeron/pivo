<script setup>
import { computed } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import BeerCard from './BeerCard.vue'

const {
  appData,
  uiState,
  setQuickMode,
  toggleQuickFriend,
  quickSelectAll,
  quickClearSelection
} = useAppData()

const quickSelectionSummary = computed(() => {
  const count = uiState.quickSelection.length
  if (count === 0) return 'Nikdo není vybraný'
  if (uiState.quickMode === 'single') return `Vybraný piják: ${appData.friends[uiState.quickSelection[0]]?.name || ''}`
  return `Vybraná skupina: ${count} ${count === 1 ? 'piják' : count < 5 ? 'pijáci' : 'pijáků'}`
})

function isQuickSelected(index) {
  return uiState.quickSelection.includes(index)
}
</script>

<template>
  <div class="tab-content">

    <div v-if="appData.beers.length === 0" style="text-align:center; color:#7f8c8d; padding: 30px;">
      Na stole zatím neleží žádné pivo.<br><br>
      Přidejte ho v záložce <strong>⚙️ Nabídka a Stůl</strong>!
    </div>
    <BeerCard v-else v-for="beer in appData.beers" :key="beer.id" :beer="beer" />
  </div>
</template>
