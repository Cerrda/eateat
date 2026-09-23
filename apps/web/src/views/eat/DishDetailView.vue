<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { api, apiUrl } from '@/api/client'
import type { MenuDish } from '@/api/types'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { useMealStore } from '@/stores/meal'

const route = useRoute()
const meal = useMealStore()
const dish = shallowRef<MenuDish | null>(null)
const openSteps = shallowRef(false)
const selected = computed(() => (dish.value ? meal.dishIds.includes(dish.value.id) : false))

onMounted(async () => {
  dish.value = await api<MenuDish>(`/api/v1/menu/${route.params.id}`)
})
</script>

<template>
  <ScreenShell v-if="dish" :title="dish.name" :back="{ name: 'menu' }">
    <img v-if="dish.coverPath" class="cover-lg enter-item" :src="apiUrl(dish.coverPath)" alt="" />
    <p class="quiet enter-item">
      <template v-if="dish.durationMinutes">{{ dish.durationMinutes }} 分钟</template>
      <template v-if="dish.servings"> · {{ dish.servings }}</template>
    </p>
    <p v-if="dish.summary" class="lede enter-item">{{ dish.summary }}</p>
    <p v-if="dish.ingredients" class="quiet enter-item">{{ dish.ingredients }}</p>
    <button v-if="dish.steps.length" class="btn ghost enter-item" type="button" data-press @click="openSteps = !openSteps">
      {{ openSteps ? '收起步骤' : '展开步骤' }}
    </button>
    <ol v-if="openSteps" class="steps">
      <li v-for="(step, index) in dish.steps" :key="step">
        <span>{{ index + 1 }}</span>
        <span>{{ step }}</span>
      </li>
    </ol>
    <button class="btn" type="button" data-press @click="meal.toggle(dish)">
      {{ selected ? '移出这一餐' : '加入这一餐' }}
    </button>
  </ScreenShell>
</template>
