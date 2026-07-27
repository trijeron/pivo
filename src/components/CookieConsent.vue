<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { loadGoogleAnalytics } from '../composables/useAnalytics.js'

const { t } = useI18n()

const CONSENT_KEY = 'beerAppCookieConsent'

const consentGiven = ref(null) // null = not decided, true = accepted, false = declined
const bannerVisible = ref(false)

onMounted(() => {
  const stored = localStorage.getItem(CONSENT_KEY)
  if (stored === 'accepted') {
    consentGiven.value = true
    loadGoogleAnalytics()
  } else if (stored === 'declined') {
    consentGiven.value = false
  } else {
    bannerVisible.value = true
  }
})

function accept() {
  localStorage.setItem(CONSENT_KEY, 'accepted')
  consentGiven.value = true
  bannerVisible.value = false
  loadGoogleAnalytics()
}

function decline() {
  localStorage.setItem(CONSENT_KEY, 'declined')
  consentGiven.value = false
  bannerVisible.value = false
}

function resetChoice() {
  localStorage.removeItem(CONSENT_KEY)
  consentGiven.value = null
  bannerVisible.value = true
}

defineExpose({ resetChoice })
</script>

<template>
  <div v-if="bannerVisible" class="cookie-banner">
    <p class="cookie-banner-text">{{ t('bottomBar.cookiesBanner') }}</p>
    <div class="cookie-banner-actions">
      <button type="button" class="btn-primary cookie-btn-accept" @click="accept">
        {{ t('bottomBar.cookiesAccept') }}
      </button>
      <button type="button" class="btn-secondary cookie-btn-decline" @click="decline">
        {{ t('bottomBar.cookiesDecline') }}
      </button>
    </div>
  </div>
</template>
