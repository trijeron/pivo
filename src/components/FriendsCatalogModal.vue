<script setup>
import { ref } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'

const emit = defineEmits(['close'])

const { appData, saveFriendCatalog } = useAppData()
const { t } = useI18n()

function makeLocalFriend(friend = null, number = 1) {
  return {
    id: friend?.id || `local-${crypto.randomUUID()}`,
    name: friend?.name || t('defaults.friend', { number }),
    weight: friend?.weight ?? 80,
    gender: friend?.gender === 'f' ? 'f' : 'm'
  }
}

const localFriends = ref(appData.friends.map((friend, index) => makeLocalFriend(friend, index + 1)))

function addLocalFriend() {
  localFriends.value.push(makeLocalFriend(null, localFriends.value.length + 1))
}

function removeLocalFriend(index) {
  if (localFriends.value.length <= 1) {
    alert(t('friendsModal.mustHaveOne'))
    return
  }
  localFriends.value.splice(index, 1)
}

function saveChanges() {
  saveFriendCatalog(localFriends.value)
  emit('close')
}
</script>

<template>
  <div class="modal" @click.self="emit('close')">
    <div class="modal-content friends-modal-content">
      <span class="close-modal" @click="emit('close')">&times;</span>
      <h3>{{ t('friendsModal.title') }}</h3>
      <p class="friends-modal-note">{{ t('friendsModal.note') }}</p>

      <div class="friends-modal-list">
        <div class="friends-modal-head">
          <span>{{ t('friendsModal.name') }}</span>
          <span>{{ t('friendsModal.weight') }}</span>
          <span>{{ t('friendsModal.gender') }}</span>
          <span></span>
        </div>

        <div v-for="(friend, index) in localFriends" :key="friend.id" class="friends-modal-row">
          <input v-model="friend.name" class="modal-input" type="text" :placeholder="t('friendsModal.namePlaceholder')">
          <input v-model.number="friend.weight" class="modal-input" type="number" min="30" max="200">
          <select v-model="friend.gender" class="modal-input">
            <option value="m">{{ t('userModal.male') }}</option>
            <option value="f">{{ t('userModal.female') }}</option>
          </select>
          <button type="button" class="friends-modal-delete" :title="t('friendsModal.delete')" @click="removeLocalFriend(index)">✕</button>
        </div>
      </div>

      <div class="friends-modal-actions">
        <button type="button" class="btn-secondary" @click="addLocalFriend">{{ t('friendsModal.add') }}</button>
      </div>

      <div class="import-dialog-actions">
        <button type="button" class="btn-add" @click="saveChanges">{{ t('friendsModal.save') }}</button>
        <button type="button" class="btn-secondary" @click="emit('close')">{{ t('beer.cancel') }}</button>
      </div>
    </div>
  </div>
</template>
