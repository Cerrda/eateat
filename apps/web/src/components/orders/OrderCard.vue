<script setup lang="ts">
import type { MealOrder } from '@/api/types'
import { dateLabel } from '@/lib/dates'
import { ORDER_LABEL, SLOT_LABEL } from '@/lib/labels'

defineProps<{ order: MealOrder }>()
defineEmits<{ open: [] }>()
</script>

<template>
  <button class="row-card reveal-card" type="button" @click="$emit('open')">
    <span class="kicker">{{ dateLabel(order.mealDate) }}</span>
    <span class="spread">
      <span class="meal-name">{{ SLOT_LABEL[order.slot] }}</span>
      <span class="meta">{{ ORDER_LABEL[order.status] }}</span>
    </span>
    <span class="covers">
      <img v-for="item in order.items" :key="item.id" class="cover" :src="item.coverPath || ''" alt="" />
    </span>
    <span class="quiet">{{ order.items.map((item) => item.name).join('、') }}</span>
  </button>
</template>

<style scoped>
.row-card {
  width: 100%;
  padding: 0.9rem 0;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  background: transparent;
  text-align: left;
}

.meal-name {
  font-family: var(--serif);
  font-size: 1.6rem;
}
</style>
