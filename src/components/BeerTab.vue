<script setup>
import { ref, watch, computed } from 'vue'
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import BeerCard from './BeerCard.vue'

const emit = defineEmits(['go-admin'])

const { appData, activeBeers, setActivePub, addOtherForFriend } = useAppData()
const { t } = useI18n()

const displayBeers = computed(() => activeBeers.value.filter(b => !b.isOther))

const otherModalOpen = ref(false)
const otherFriendIndex = ref(0)
const otherKind = ref('food')
const otherPrice = ref('')

watch(() => appData.friends.length, (length) => {
  if (length === 0) {
    otherFriendIndex.value = 0
  } else if (otherFriendIndex.value >= length) {
    otherFriendIndex.value = 0
  }
})

function openOtherModal() {
  if (appData.friends.length === 0) return
  otherFriendIndex.value = 0
  otherKind.value = 'food'
  otherPrice.value = ''
  otherModalOpen.value = true
}

function submitOtherModal() {
  addOtherForFriend({
    friendIndex: Number.parseInt(otherFriendIndex.value, 10),
    kind: otherKind.value,
    price: otherPrice.value
  })
  otherModalOpen.value = false
}
</script>

<template>
  <div class="tab-content">
    <div class="tab-toolbar">
     <label class="toolbar-pub-select">
       <span>{{ t('beerTab.pubLabel') }}</span>
       <select :value="appData.activePubId" @change="setActivePub($event.target.value)">
         <option v-for="pub in appData.pubs" :key="pub.id" :value="pub.id">{{ pub.name }}</option>
       </select>
     </label>
     <button type="button" class="btn-secondary" @click="emit('go-admin')">{{ t('beerTab.manage') }}</button>
    <button type="button" class="btn-secondary" @click="openOtherModal">{{ t('beerTab.addOther') }}</button>
   </div>

   <div v-if="displayBeers.length === 0" style="text-align:center; color:#7f8c8d; padding: 30px;">
     {{ t('beerTab.empty') }}<br><br>
     <strong>{{ t('beerTab.emptyHint') }}</strong>
   </div>
   <BeerCard v-else v-for="beer in displayBeers" :key="beer.id" :beer="beer" />

   <div v-if="otherModalOpen" class="modal" @click.self="otherModalOpen = false">
     <div class="modal-content">
       <span class="close-modal" @click="otherModalOpen = false">&times;</span>
       <h3 style="margin-top: 0;">{{ t('otherModal.title') }}</h3>

       <div class="modal-field">
         <label>{{ t('otherModal.userLabel') }}</label>
         <select v-model.number="otherFriendIndex" class="modal-input">
           <option v-for="(friend, index) in appData.friends" :key="index" :value="index">{{ friend.name }}</option>
         </select>
       </div>

       <div class="modal-field">
         <label>{{ t('otherModal.typeLabel') }}</label>
         <select v-model="otherKind" class="modal-input">
           <option value="food">{{ t('otherModal.foodOption') }}</option>
           <option value="shot">{{ t('otherModal.shotOption') }}</option>
           <option value="bigShot">{{ t('otherModal.bigShotOption') }}</option>
         </select>
       </div>

       <div class="modal-field">
         <label>{{ t('otherModal.priceLabel') }}</label>
         <input v-model="otherPrice" class="modal-input" type="number" min="0" step="0.1">
       </div>

       <button type="button" class="btn-add" @click="submitOtherModal">{{ t('otherModal.addButton') }}</button>
     </div>
   </div>
 </div>
</template>
