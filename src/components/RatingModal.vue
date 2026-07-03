<script setup>
import { useAppData } from '../composables/useAppData.js'

const props = defineProps({
  beer: { type: Object, required: true }
})
const emit = defineEmits(['close'])

const { adjustRating } = useAppData()
</script>

<template>
  <div class="modal" @click.self="emit('close')">
    <div class="modal-content">
      <span class="close-modal" @click="emit('close')">&times;</span>
      <h3 style="margin-top: 0; color: #2c3e50; text-align: center;">{{ beer.name }}</h3>
      <div class="rating-modal-flex">
        <div class="rating-modal-group">
          <span class="icon">👍</span>
          <div class="rating-modal-controls">
            <button type="button" class="btn-modal-thumb" @click="adjustRating(beer.id, 'likes', -1)">-</button>
            <span class="like-count">{{ beer.likes }}</span>
            <button type="button" class="btn-modal-thumb" @click="adjustRating(beer.id, 'likes', 1)">+</button>
          </div>
        </div>
        <div class="rating-modal-group">
          <span class="icon">👎</span>
          <div class="rating-modal-controls">
            <button type="button" class="btn-modal-thumb" @click="adjustRating(beer.id, 'dislikes', -1)">-</button>
            <span class="dislike-count">{{ beer.dislikes }}</span>
            <button type="button" class="btn-modal-thumb" @click="adjustRating(beer.id, 'dislikes', 1)">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
