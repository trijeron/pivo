<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppData } from './composables/useAppData.js'
import { useI18n } from './composables/useI18n.js'
import { useVersionCheck } from './composables/useVersionCheck.js'
import BeerTab   from './components/BeerTab.vue'
import AdminTab  from './components/AdminTab.vue'
import PeopleTab from './components/PeopleTab.vue'
import BottomBar from './components/BottomBar.vue'
import CookieConsent from './components/CookieConsent.vue'

const { appData, stats, uiState, activePub, loadData, setActivePub, toggleTheme } = useAppData()
const { localeState, availableLocales, t, setLocale } = useI18n()
const { newVersionAvailable } = useVersionCheck()

const activeTab = ref('beers')
const pendingPubNickname = ref(null)

function onLocaleChange(event) {
  setLocale(event.target.value)
}

let initialized = false

watch(() => appData.activePubId, () => {
  if (!initialized) return
  const pub = activePub.value
  if (pub?.nickname) {
    history.replaceState(null, '', '#' + pub.nickname)
  }
  // Clear pending notice when active pub changes
  if (pendingPubNickname.value) pendingPubNickname.value = null
})

let ticker = null
onMounted(() => {
  loadData()

  const hashNickname = window.location.hash.slice(1)
  if (hashNickname) {
    const matchedPub = appData.pubs.find(p => p.nickname === hashNickname)
    if (matchedPub) {
      setActivePub(matchedPub.id)
    } else {
      pendingPubNickname.value = hashNickname
      activeTab.value = 'admin'
    }
  }

  initialized = true
  // re-evaluate stats every minute (BAC changes over time)
  ticker = setInterval(() => { appData.startTime = appData.startTime }, 60000)
})
onUnmounted(() => clearInterval(ticker))
</script>

<template>
  <div v-if="newVersionAvailable" class="version-banner">
    <span>{{ t('app.newVersion') }}</span>
    <button type="button" class="version-banner-btn" @click="() => location.reload()">{{ t('app.newVersionReload') }}</button>
  </div>

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
  <AdminTab  v-if="activeTab === 'admin'" :pending-pub-nickname="pendingPubNickname" />
  <PeopleTab v-if="activeTab === 'people'" />

  <div class="alert-warning">
    <strong>{{ t('app.warningTitle') }}</strong> {{ t('app.warningBody') }}
  </div>

  <BottomBar />
  <CookieConsent />
</template>
