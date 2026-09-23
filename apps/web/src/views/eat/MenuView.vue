<script setup lang="ts">
import { onMounted, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateRef } from 'vue'
import { api, ApiError } from '@/api/client'
import type { MealOrder, MenuDish } from '@/api/types'
import DishCard from '@/components/dishes/DishCard.vue'
import MealBar from '@/components/orders/MealBar.vue'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { useListReveal } from '@/lib/motion'
import { useMealStore } from '@/stores/meal'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const meal = useMealStore()
const router = useRouter()
const dishes = shallowRef<MenuDish[]>([])
const active = shallowRef<MealOrder | null>(null)
const error = shallowRef('')
const root = useTemplateRef('root')
useListReveal(root, '.reveal-card')

onMounted(async () => {
  try {
    const data = await api<{ dishes: MenuDish[] }>('/api/v1/menu')
    dishes.value = data.dishes
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '菜单没打开'
  }
})

watch(
  [() => meal.mealDate, () => meal.slot],
  async () => {
    if (!meal.slot) {
      active.value = null
      return
    }
    const data = await api<{ order: MealOrder | null }>(
      `/api/v1/orders/active?mealDate=${meal.mealDate}&slot=${meal.slot}`,
    )
    active.value = data.order
  },
  { immediate: true },
)
</script>

<template>
  <div ref="root">
    <ScreenShell
      :eyebrow="`${session.membership?.displayName ?? ''}的厨房`"
      title="菜单"
      settings
    >
      <MealBar />
      <p v-if="error" class="banner">{{ error }}</p>
      <p v-if="dishes.length === 0" class="empty-copy enter-item">还没有上架的菜。</p>
      <DishCard
        v-for="dish in dishes"
        :key="dish.id"
        :dish="dish"
        :selected="meal.dishIds.includes(dish.id)"
        @open="router.push({ name: 'menu-dish', params: { id: dish.id } })"
        @toggle="meal.toggle(dish)"
      />
      <RouterLink
        v-if="active"
        class="btn-link enter-item"
        :to="{ name: 'eat-order', params: { id: active.id } }"
      >
        查看已点的这一餐
      </RouterLink>
      <button
        v-else
        class="btn enter-item"
        type="button"
        data-press
        :disabled="!meal.ready"
        @click="router.push({ name: 'confirm' })"
      >
        确认这一餐
      </button>
    </ScreenShell>
  </div>
</template>
