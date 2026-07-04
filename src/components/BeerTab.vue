<script setup>
import { useAppData } from '../composables/useAppData.js'
import BeerCard from './BeerCard.vue'

const { appData } = useAppData()
</script>

<template>
  <div class="tab-content">
    <div v-if="appData.beers.length === 0" style="text-align:center; color:#7f8c8d; padding: 30px;">
      Na stole zatím neleží žádné pivo.<br><br>
      Přidejte ho v záložce <strong>⚙️ Nabídka a Stůl</strong>!
    </div>
    <BeerCard v-else v-for="beer in appData.beers" :key="beer.id" :beer="beer" />
  </div>
</template>
