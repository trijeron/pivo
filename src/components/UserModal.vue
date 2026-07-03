<script setup>
import { ref, watch } from 'vue'
import { useAppData } from '../composables/useAppData.js'

const props = defineProps({
  friend: { type: Object, required: true },
  index:  { type: Number, required: true }
})
const emit = defineEmits(['close'])

const { updateFriend, deleteFriend } = useAppData()

const localName   = ref(props.friend.name)
const localWeight = ref(props.friend.weight)
const localGender = ref(props.friend.gender)

watch(() => props.friend, (f) => {
  localName.value   = f.name
  localWeight.value = f.weight
  localGender.value = f.gender
}, { deep: true })

function onInput() {
  updateFriend(props.index, 'name',   localName.value)
  updateFriend(props.index, 'weight', localWeight.value)
  updateFriend(props.index, 'gender', localGender.value)
}

function onDelete() {
  const { appData } = useAppData()
  if (appData.friends.length <= 1) { alert('Někdo to pít musí!'); return }
  if (confirm(`Opravdu smazat pijáka "${props.friend.name}" ze stolu?`)) {
    deleteFriend(props.index)
    emit('close')
  }
}
</script>

<template>
  <div class="modal" @click.self="emit('close')">
    <div class="modal-content">
      <span class="close-modal" @click="emit('close')">&times;</span>
      <h3 style="margin-top: 0;">⚙️ Nastavení pijáka</h3>

      <div class="modal-field">
        <label>Jméno:</label>
        <input v-model="localName" class="modal-input" type="text" @input="onInput">
      </div>
      <div style="display: flex; gap: 10px;">
        <div class="modal-field" style="flex: 1;">
          <label>Váha (kg):</label>
          <input v-model.number="localWeight" class="modal-input" type="number" min="30" max="200" @input="onInput">
        </div>
        <div class="modal-field" style="flex: 1;">
          <label>Pohlaví:</label>
          <select v-model="localGender" class="modal-input" @change="onInput">
            <option value="m">Muž</option>
            <option value="f">Žena</option>
          </select>
        </div>
      </div>
      <button type="button" class="btn-danger" style="width: 100%; margin-top: 15px; padding: 10px;" @click="onDelete">
        🗑️ Smazat pijáka
      </button>
    </div>
  </div>
</template>
