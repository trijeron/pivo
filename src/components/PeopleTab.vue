<script setup>
import { computed, ref } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import UserModal from './UserModal.vue'

const { appData, stats, addFriend } = useAppData()
const { t, translateBeerStyle } = useI18n()

const activeUserIndex = ref(null)
const selectedUserIndex = ref(null)

const selectedUser = computed(() => {
  if (selectedUserIndex.value === null) return null
  return appData.friends[selectedUserIndex.value] || null
})

const selectedUserItems = computed(() => {
  if (selectedUserIndex.value === null) return []

  return appData.beers
    .map(beer => {
      const count = beer.counts?.[selectedUserIndex.value] || 0
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
</script>

<template>
  <div class="tab-content">
    <div class="users-grid users-rows">
      <div
        v-for="(friend, index) in appData.friends"
        :key="index"
        class="user-card"
        @click="selectedUserIndex = index"
      >
        <button
          type="button"
          class="user-card-edit-icon"
          @click.stop="activeUserIndex = index"
          :title="t('people.editTitle')"
        >
          ✏️
        </button>

        <div class="user-card-name">{{ friend.name }}</div>
        <div class="user-card-spend">{{ stats.friendTotals[index] }} {{ t('currency') }}</div>
        <div class="user-card-bac">
          🍺 {{ stats.friendBacs[index].toFixed(2) }} ‰<br>
          <small style="color:#7f8c8d; font-weight:normal;">{{ t('people.soberIn', { hours: stats.friendSobers[index].toFixed(1) }) }}</small>
        </div>
      </div>
    </div>

    <div v-if="selectedUser" class="section" style="margin-top: 10px;">
      <h3 style="text-align: left; margin-bottom: 8px;">{{ t('people.hasWhat', { name: selectedUser.name }) }}</h3>

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
    </div>

    <button type="button" class="btn-add-friend" @click="addFriend">{{ t('people.add') }}</button>

    <UserModal
      v-if="activeUserIndex !== null"
      :friend="appData.friends[activeUserIndex]"
      :index="activeUserIndex"
      @close="activeUserIndex = null"
    />
  </div>
</template>
