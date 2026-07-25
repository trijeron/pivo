<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const activeModal = ref(null) // 'about' | 'support' | null

const SUPPORT_EMAIL = 'support@pivolisetek.cz'
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

      <div style="margin-top: 20px; text-align: right;">
        <button type="button" class="btn-secondary" @click="activeModal = null">{{ t('beer.cancel') }}</button>
      </div>
    </div>
  </div>
</template>
