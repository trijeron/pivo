<script setup>
import { useAppData } from '../composables/useAppData.js'
import UserModal from './UserModal.vue'
import { ref } from 'vue'

const { appData, stats, addFriend } = useAppData()

const activeUserIndex = ref(null)
</script>

<template>
  <div class="tab-content">
    <div class="users-grid">
      <div
        v-for="(friend, index) in appData.friends"
        :key="index"
        class="user-card"
        @click="activeUserIndex = index"
      >
        <div class="user-card-edit-icon">✏️</div>
        <div class="user-card-name">{{ friend.name }}</div>
        <div class="user-card-spend">{{ stats.friendTotals[index] }} Kč</div>
        <div class="user-card-bac">
          🍺 {{ stats.friendBacs[index].toFixed(2) }} ‰<br>
          <small style="color:#7f8c8d; font-weight:normal;">Čistý za ~{{ stats.friendSobers[index].toFixed(1) }} h</small>
        </div>
      </div>
    </div>
    <button type="button" class="btn-add-friend" @click="addFriend">+ Přidat pijáka</button>

    <UserModal
      v-if="activeUserIndex !== null"
      :friend="appData.friends[activeUserIndex]"
      :index="activeUserIndex"
      @close="activeUserIndex = null"
    />
  </div>
</template>
