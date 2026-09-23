<script setup lang="ts">
import type { MenuDish } from '@/api/types'

defineProps<{
  dish: Pick<MenuDish, 'name' | 'coverPath' | 'durationMinutes' | 'servings'>
  selected?: boolean
}>()

defineEmits<{
  open: []
  toggle: []
}>()
</script>

<template>
  <article class="row-card reveal-card">
    <button class="spread" type="button" @click="$emit('open')">
      <img v-if="dish.coverPath" class="cover" :src="dish.coverPath" alt="" />
      <span v-else class="cover"></span>
      <span>
        <strong class="dish-name">{{ dish.name }}</strong>
        <span class="quiet">
          <template v-if="dish.durationMinutes">{{ dish.durationMinutes }} 分钟</template>
          <template v-if="dish.servings"> · {{ dish.servings }}</template>
        </span>
      </span>
    </button>
    <button v-if="selected !== undefined" class="btn ghost" type="button" data-press @click="$emit('toggle')">
      {{ selected ? '移出这一餐' : '加入这一餐' }}
    </button>
  </article>
</template>

<style scoped>
.spread {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
}

.dish-name {
  display: block;
  font-family: var(--serif);
  font-size: 1.55rem;
  font-weight: 400;
}
</style>
