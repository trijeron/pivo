<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppData } from './composables/useAppData.js'
import { useI18n } from './composables/useI18n.js'
import BeerTab   from './components/BeerTab.vue'
import AdminTab  from './components/AdminTab.vue'
import PeopleTab from './components/PeopleTab.vue'

const { appData, stats, uiState, loadData, toggleTheme } = useAppData()
const { localeState, availableLocales, t, setLocale } = useI18n()

const activeTab = ref('beers')

function onLocaleChange(event) {
  setLocale(event.target.value)
}

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
    <h1>{{ t('app.title') }}</h1>
    <div class="app-topbar-actions">
      <label class="language-switch">
        <span>{{ t('language') }}</span>
        <select :value="localeState.locale" @change="onLocaleChange">
          <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
            {{ locale.label }}
          </option>
        </select>
      </label>
      <button type="button" class="theme-toggle" @click="toggleTheme">
        {{ uiState.theme === 'dark' ? t('theme.light') : t('theme.dark') }}
      </button>
    </div>
  </div>

  <div class="table-total-box">{{ t('app.tableTotal') }}: {{ stats.tableTotal }} {{ t('currency') }}</div>


  <div class="tab-nav">
    <button class="tab-btn" :class="{ active: activeTab === 'beers' }"   @click="activeTab = 'beers'">{{ t('tabs.beers') }}</button>
    <button class="tab-btn" :class="{ active: activeTab === 'admin' }"   @click="activeTab = 'admin'">{{ t('tabs.admin') }}</button>
    <button class="tab-btn" :class="{ active: activeTab === 'people' }"  @click="activeTab = 'people'">{{ t('tabs.people') }}</button>
  </div>

  <BeerTab   v-if="activeTab === 'beers'" @go-admin="activeTab = 'admin'" />
  <AdminTab  v-if="activeTab === 'admin'"  />
  <PeopleTab v-if="activeTab === 'people'" />

  <div class="alert-warning">
    <strong>{{ t('app.warningTitle') }}</strong> {{ t('app.warningBody') }}
  </div>
</template>
