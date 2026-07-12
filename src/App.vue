<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppData } from './composables/useAppData.js'
import BeerTab   from './components/BeerTab.vue'
import AdminTab  from './components/AdminTab.vue'
import PeopleTab from './components/PeopleTab.vue'

const { appData, stats, uiState, loadData, toggleTheme } = useAppData()

const activeTab = ref('beers')

let ticker = null
onMounted(() => {
  loadData()
  // re-evaluate stats every minute (BAC changes over time)
  ticker = setInterval(() => { appData.startTime = appData.startTime }, 60000)
})
onUnmounted(() => clearInterval(ticker))
</script>

<template>
  <div class="app-topbar">
    <h1>🍻 Pivní lístek</h1>
    <button type="button" class="theme-toggle" @click="toggleTheme">
      {{ uiState.theme === 'dark' ? '☀️ Světlý režim' : '🌙 Tmavý režim' }}
    </button>
  </div>

  <div class="table-total-box">Útrata stolu: {{ stats.tableTotal }} Kč</div>


  <div class="tab-nav">
    <button class="tab-btn" :class="{ active: activeTab === 'beers' }"   @click="activeTab = 'beers'">🍺 Piva na stole</button>
    <button class="tab-btn" :class="{ active: activeTab === 'admin' }"   @click="activeTab = 'admin'">⚙️ Nabídka a Stůl</button>
    <button class="tab-btn" :class="{ active: activeTab === 'people' }"  @click="activeTab = 'people'">👥 Pijáci a Útrata</button>
  </div>

  <BeerTab   v-if="activeTab === 'beers'"  />
  <AdminTab  v-if="activeTab === 'admin'"  />
  <PeopleTab v-if="activeTab === 'people'" />

  <div class="alert-warning">
    <strong>⚠️ Upozornění:</strong> Promile je čistě orientační.
    Neslouží pro posouzení schopnosti řídit! (V ČR platí 0.0 ‰).
  </div>
</template>
