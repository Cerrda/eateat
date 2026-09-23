<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { api, apiUrl, ApiError } from '@/api/client'
import type { MealOrder, MenuDish } from '@/api/types'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { dateLabel } from '@/lib/dates'
import { SLOT_LABEL } from '@/lib/labels'
import { useMealStore } from '@/stores/meal'

const meal = useMealStore()
const router = useRouter()
const menu = shallowRef<MenuDish[]>([])
const error = shallowRef('')
const pending = shallowRef(false)
const chosen = computed(() => menu.value.filter((dish) => meal.dishIds.includes(dish.id)))

onMounted(async () => {
  if (!meal.slot || meal.dishIds.length === 0) {
    await router.replace({ name: 'menu' })
    return
  }
  const data = await api<{ dishes: MenuDish[] }>('/api/v1/menu')
  menu.value = data.dishes
})

async function submit() {
  if (!meal.slot) return
  pending.value = true
  error.value = ''
  try {
    const order = await api<MealOrder>('/api/v1/orders', {
      method: 'POST',
      body: {
        mealDate: meal.mealDate,
        slot: meal.slot,
        dishIds: meal.dishIds,
        note: meal.note.trim(),
      },
    })
    meal.clear()
    await router.replace({ name: 'eat-order', params: { id: order.id }, query: { fresh: '1' } })
  } catch (reason) {
    if (reason instanceof ApiError && reason.code === 'SLOT_TAKEN' && reason.orderId) {
      await router.replace({ name: 'eat-order', params: { id: reason.orderId } })
      return
    }
    error.value = reason instanceof ApiError ? reason.message : '没点上，内容还在'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ScreenShell
    v-if="meal.slot"
    :eyebrow="dateLabel(meal.mealDate)"
    :title="SLOT_LABEL[meal.slot]"
    :back="{ name: 'menu' }"
  >
    <article v-for="dish in chosen" :key="dish.id" class="spread enter-item">
      <img v-if="dish.coverPath" class="cover" :src="apiUrl(dish.coverPath)" alt="" />
      <span class="dish-name">{{ dish.name }}</span>
    </article>
    <label class="field-label enter-item">
      备注
      <textarea v-model="meal.note" class="area" maxlength="100"></textarea>
    </label>
    <p v-if="error" class="banner">{{ error }}</p>
    <button class="btn" type="button" data-press :disabled="pending || chosen.length === 0" @click="submit">
      点这餐
    </button>
  </ScreenShell>
</template>

<style scoped>
.dish-name {
  font-family: var(--serif);
  font-size: 1.45rem;
}
</style>
