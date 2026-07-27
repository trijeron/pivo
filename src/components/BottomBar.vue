<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const activeModal = ref(null) // 'about' | 'support' | 'cookies' | null

const SUPPORT_EMAIL = 'napivo@ithonza.cz'
const CONSENT_KEY = 'beerAppCookieConsent'

function currentChoice() {
  const stored = localStorage.getItem(CONSENT_KEY)
  if (stored === 'accepted') return t('bottomBar.cookiesChoiceAccepted')
  if (stored === 'declined') return t('bottomBar.cookiesChoiceDeclined')
  return '—'
}

function resetChoice() {
  localStorage.removeItem(CONSENT_KEY)
  activeModal.value = null
  window.location.reload()
}
</script>

<template>
  <div class="app-bottombar">
    <button type="button" class="bottombar-btn" @click="activeModal = 'about'">
      {{ t('bottomBar.about') }}
    </button>
    <span class="bottombar-sep">·</span>
    <button type="button" class="bottombar-btn" @click="activeModal = 'support'">
      {{ t('bottomBar.support') }}
    </button>
    <span class="bottombar-sep">·</span>
    <button type="button" class="bottombar-btn" @click="activeModal = 'cookies'">
      {{ t('bottomBar.cookies') }}
    </button>
  </div>

  <div v-if="activeModal" class="modal" @click.self="activeModal = null">
    <div class="modal-content bottombar-modal-content">
      <span class="close-modal" @click="activeModal = null">&times;</span>

      <template v-if="activeModal === 'about'">
        <h3>{{ t('bottomBar.aboutTitle') }}</h3>
        <p class="bottombar-modal-body">{{ t('bottomBar.aboutBody') }}</p>
      </template>

      <template v-else-if="activeModal === 'support'">
        <h3>{{ t('bottomBar.supportTitle') }}</h3>
        <p class="bottombar-modal-body">{{ t('bottomBar.supportBody') }}</p>
        <a :href="`mailto:${SUPPORT_EMAIL}`" class="bottombar-email-link">{{ SUPPORT_EMAIL }}</a>
      </template>

      <template v-else-if="activeModal === 'cookies'">
        <h3>{{ t('bottomBar.cookiesTitle') }}</h3>
        <p class="bottombar-modal-body">{{ t('bottomBar.cookiesBody') }}</p>
        <p class="bottombar-modal-body">
          {{ t('bottomBar.cookiesCurrentChoice', { choice: currentChoice() }) }}
        </p>
        <div style="margin-top: 12px;">
          <button type="button" class="btn-secondary" @click="resetChoice">
            {{ t('bottomBar.cookiesUpdateChoice') }}
          </button>
        </div>
      </template>

      <div style="margin-top: 20px; text-align: right;">
        <button type="button" class="btn-secondary" @click="activeModal = null">{{ t('beer.cancel') }}</button>
      </div>
    </div>
  </div>
</template>
