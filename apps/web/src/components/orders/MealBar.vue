<script setup lang="ts">
import { orderDates } from '@/lib/dates'
import { SLOTS, SLOT_LABEL } from '@/lib/labels'
import type { Slot } from '@/api/types'
import { useMealStore } from '@/stores/meal'

defineProps<{ activeLabel?: string }>()

const meal = useMealStore()
const dates = orderDates()

function chooseSlot(slot: Slot) {
  meal.slot = slot
}
</script>

<template>
  <section class="meal-bar">
    <p class="kicker">这一餐</p>
    <div class="chips">
      <button
        v-for="item in dates"
        :key="item.value"
        type="button"
        data-press
        :class="{ on: meal.mealDate === item.value }"
        @click="meal.mealDate = item.value"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="chips">
      <button
        v-for="slot in SLOTS"
        :key="slot"
        type="button"
        class="slot"
        data-press
        :class="{ on: meal.slot === slot }"
        @click="chooseSlot(slot)"
      >
        {{ SLOT_LABEL[slot] }}
      </button>
    </div>
    <p v-if="activeLabel" class="quiet">{{ activeLabel }}</p>
  </section>
</template>
