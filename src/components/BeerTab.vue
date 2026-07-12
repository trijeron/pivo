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
    <div v-if="appData.friends.length" class="section quick-controls">
      <div class="quick-controls-head">
        <div>
          <h2 style="text-align: left; margin-bottom: 6px;">⚡ Rychlé čárky</h2>
          <div class="quick-selection-summary">{{ quickSelectionSummary }}</div>
        </div>
        <div class="quick-mode-switch">
          <button
            type="button"
            class="quick-mode-btn"
            :class="{ active: uiState.quickMode === 'single' }"
            @click="setQuickMode('single')"
          >
            1 piják
          </button>
          <button
            type="button"
            class="quick-mode-btn"
            :class="{ active: uiState.quickMode === 'group' }"
            @click="setQuickMode('group')"
          >
            Skupina
          </button>
        </div>
      </div>

      <div class="quick-users">
        <button
          v-for="(friend, index) in appData.friends"
          :key="index"
          type="button"
          class="quick-user-chip"
          :class="{ active: isQuickSelected(index) }"
          @click="toggleQuickFriend(index)"
        >
          {{ friend.name }}
        </button>
      </div>

      <div class="quick-action-row">
        <button type="button" class="btn-secondary" @click="quickSelectAll">Vybrat všechny</button>
        <button
          v-if="uiState.quickMode === 'group'"
          type="button"
          class="btn-secondary"
          @click="quickClearSelection"
        >
          Vymazat výběr
        </button>
      </div>
    </div>

    <div v-if="appData.beers.length === 0" style="text-align:center; color:#7f8c8d; padding: 30px;">
      Na stole zatím neleží žádné pivo.<br><br>
      Přidejte ho v záložce <strong>⚙️ Nabídka a Stůl</strong>!
    </div>
    <BeerCard v-else v-for="beer in appData.beers" :key="beer.id" :beer="beer" />
  </div>
</template>
