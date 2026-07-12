<script setup>
import { useAppData } from '../composables/useAppData.js'
import { useI18n } from '../composables/useI18n.js'
import BeerCard from './BeerCard.vue'

const emit = defineEmits(['go-admin'])

const { appData, activeBeers, setActivePub } = useAppData()
const { t } = useI18n()
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
   </div>

   <div v-if="activeBeers.length === 0" style="text-align:center; color:#7f8c8d; padding: 30px;">
     {{ t('beerTab.empty') }}<br><br>
     <strong>{{ t('beerTab.emptyHint') }}</strong>
   </div>
   <BeerCard v-else v-for="beer in activeBeers" :key="beer.id" :beer="beer" />
 </div>
</template>
