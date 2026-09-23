<script setup lang="ts">
import { apiUrl } from '@/api/client'
import type { MealRecord } from '@/api/types'
import { dateLabel } from '@/lib/dates'
import { SLOT_LABEL } from '@/lib/labels'

defineProps<{ record: MealRecord }>()
defineEmits<{ open: [] }>()
</script>

<template>
  <button class="row-card reveal-card" type="button" @click="$emit('open')">
    <span class="kicker">{{ dateLabel(record.mealDate) }} · {{ SLOT_LABEL[record.slot] }}</span>
    <img v-if="record.photos[0]" class="cover" :src="apiUrl(record.photos[0].path)" alt="" />
    <span class="dish-name">{{ record.dishes.map((dish) => dish.name).join('、') || '这一餐' }}</span>
    <span class="quiet">{{ record.body }}</span>
  </button>
</template>

<style scoped>
.row-card {
  display: grid;
  gap: 0.35rem;
  width: 100%;
  padding: 0.9rem 0;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  background: transparent;
  text-align: left;
}

.dish-name {
  font-family: var(--serif);
  font-size: 1.5rem;
}
</style>
