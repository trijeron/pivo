<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import FriendsCatalogModal from './FriendsCatalogModal.vue'

const { appData, activeBeers, activePub, activePubStats, activePubFriendEntries, setActivePub, clearActivePubDrinking, isBeerCountedAsAlcohol } = useAppData()
const { t, translateBeerStyle } = useI18n()

const selectedUserId = ref(null)
const friendsModalOpen = ref(false)
const consumptionSection = ref(null)

const selectedUserEntry = computed(() => {
  if (selectedUserId.value === null) return null
  return activePubFriendEntries.value.find(entry => entry.friend.id === selectedUserId.value) || null
})

const selectedUserItems = computed(() => {
  if (!selectedUserEntry.value) return []

  return activeBeers.value
    .map(beer => {
      const count = beer.counts?.[selectedUserEntry.value.index] || 0
      const price = parseFloat(beer.price) || 0
      return {
        id: beer.id,
        name: beer.name,
        style: beer.style,
        count,
        price,
        total: count * price
      }
    })
    .filter(item => item.count > 0)
})

function calcAlcoholGrams(beer) {
  const vol = parseFloat(beer.vol) || 0
  const abv = parseFloat(beer.abv) || 0
  return Math.round(vol * 1000 * (abv / 100) * 0.789 * 10) / 10
}

const selectedUserAlcoholItems = computed(() => {
  if (!selectedUserEntry.value) return []

  return activeBeers.value
    .map(beer => {
      const count = beer.counts?.[selectedUserEntry.value.index] || 0
      const alcoholGrams = calcAlcoholGrams(beer)
      return {
        id: beer.id,
        name: beer.name,
        style: beer.style,
        count,
        alcoholGrams,
        totalAlcohol: Math.round(count * alcoholGrams * 10) / 10,
        countsAsAlcohol: isBeerCountedAsAlcohol(beer)
      }
    })
    .filter(item => item.count > 0 && item.countsAsAlcohol)
})

async function selectUser(friendId) {
  selectedUserId.value = friendId
  await nextTick()
  consumptionSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onClearActivePubDrinking() {
  if (confirm(t('people.clearPubConfirm', { pub: activePub.value?.name || t('defaults.defaultPub') }))) {
    clearActivePubDrinking()
  }
}

watch(activePubFriendEntries, (entries) => {
  if (entries.length === 0) {
    selectedUserId.value = null
    return
  }
  if (!entries.some(entry => entry.friend.id === selectedUserId.value)) {
    selectedUserId.value = entries[0].friend.id
  }
}, { immediate: true })
</script>

<template>
  <div class="tab-content">
    <div class="section people-toolbar">
      <label class="people-pub-select">
        <span>{{ t('people.pubLabel') }}</span>
        <select :value="appData.activePubId" @change="setActivePub($event.target.value)">
          <option v-for="pub in appData.pubs" :key="pub.id" :value="pub.id">{{ pub.name }}</option>
        </select>
      </label>
      <button type="button" class="btn-warning" @click="onClearActivePubDrinking">
        {{ t('people.clearPubDrinking') }}
      </button>
      <button type="button" class="btn-secondary" @click="friendsModalOpen = true">
        {{ t('people.manageFriends') }}
      </button>
    </div>

    <div class="users-grid users-rows">
      <div
        v-for="entry in activePubFriendEntries"
        :key="entry.friend.id"
        class="user-card"
        @click="selectUser(entry.friend.id)"
      >
        <div class="user-card-name">{{ entry.friend.name }}</div>
        <div class="user-card-spend">{{ activePubStats.friendTotals[entry.index] }} {{ t('currency') }}</div>
        <div class="user-card-bac">
          🍺 {{ activePubStats.friendBacs[entry.index].toFixed(2) }} ‰<br>
          <small style="color:#7f8c8d; font-weight:normal;">{{ t('people.soberIn', { hours: activePubStats.friendSobers[entry.index].toFixed(1) }) }}</small>
        </div>
      </div>
    </div>

    <div v-if="activePubFriendEntries.length === 0" class="section people-empty-state">
      {{ t('people.noActiveFriends') }}
    </div>

    <div v-if="selectedUserEntry" ref="consumptionSection" class="section" style="margin-top: 10px;">
      <h3 style="text-align: left; margin-bottom: 8px;">{{ t('people.hasWhat', { name: selectedUserEntry.friend.name }) }}</h3>

      <div v-if="selectedUserItems.length === 0" style="color:#7f8c8d;">
        {{ t('people.empty') }}
      </div>

      <div v-else class="selected-user-items">
        <div class="selected-user-items-head">{{ t('people.beer') }}</div>
        <div class="selected-user-items-head">{{ t('people.count') }}</div>
        <div class="selected-user-items-head">{{ t('people.pricePerUnit') }}</div>
        <div class="selected-user-items-head">{{ t('people.total') }}</div>

        <template v-for="item in selectedUserItems" :key="item.id">
          <div>
            <strong>{{ item.name }}</strong>
            <div v-if="item.style" style="font-size: 0.85em; color:#7f8c8d;">{{ translateBeerStyle(item.style) }}</div>
          </div>
          <div>{{ item.count }}x</div>
          <div>{{ item.price }} {{ t('currency') }}</div>
          <div><strong>{{ item.total }} {{ t('currency') }}</strong></div>
        </template>
      </div>

      <h3 style="text-align: left; margin: 18px 0 8px;">{{ t('people.alcoholCountList', { name: selectedUserEntry.friend.name }) }}</h3>
      <p class="selected-user-note">{{ t('people.alcoholCountNote') }}</p>

      <div v-if="selectedUserAlcoholItems.length === 0" style="color:#7f8c8d;">
        {{ t('people.alcoholCountEmpty') }}
      </div>

      <div v-else class="selected-user-items">
        <div class="selected-user-items-head">{{ t('people.beer') }}</div>
        <div class="selected-user-items-head">{{ t('people.count') }}</div>
        <div class="selected-user-items-head">{{ t('people.alcoholPerUnit') }}</div>
        <div class="selected-user-items-head">{{ t('people.totalAlcohol') }}</div>

        <template v-for="item in selectedUserAlcoholItems" :key="`alcohol-${item.id}`">
          <div>
            <strong>{{ item.name }}</strong>
            <div v-if="item.style" style="font-size: 0.85em; color:#7f8c8d;">{{ translateBeerStyle(item.style) }}</div>
          </div>
          <div>{{ item.count }}x</div>
          <div>{{ item.alcoholGrams }} g</div>
          <div><strong>{{ item.totalAlcohol }} g</strong></div>
        </template>
      </div>
    </div>

    <FriendsCatalogModal v-if="friendsModalOpen" @close="friendsModalOpen = false" />
  </div>
</template>
