<script setup lang="ts">
import { onMounted, shallowRef, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiError } from '@/api/client'
import type { MealOrder } from '@/api/types'
import OrderCard from '@/components/orders/OrderCard.vue'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { useListReveal } from '@/lib/motion'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const orders = shallowRef<MealOrder[]>([])
const error = shallowRef('')
const root = useTemplateRef('root')
useListReveal(root, '.reveal-card')

onMounted(async () => {
  try {
    await session.seen('orders')
    const data = await api<{ orders: MealOrder[] }>('/api/v1/orders')
    orders.value = data.orders
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '订单没打开'
  }
})
</script>

<template>
  <div ref="root">
    <ScreenShell
      :eyebrow="`${session.membership?.displayName ?? ''}的厨房`"
      title="订单"
      settings
    >
      <p v-if="error" class="banner">{{ error }}</p>
      <p v-else-if="orders.length === 0" class="empty-copy enter-item">还没有点过的一餐。</p>
      <OrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        @open="router.push({ name: 'eat-order', params: { id: order.id } })"
      />
    </ScreenShell>
  </div>
</template>
