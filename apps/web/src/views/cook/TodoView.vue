<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiError } from '@/api/client'
import type { MealOrder } from '@/api/types'
import OrderCard from '@/components/orders/OrderCard.vue'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { useListReveal } from '@/lib/motion'
import { useTemplateRef } from 'vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const orders = shallowRef<MealOrder[]>([])
const error = shallowRef('')
const root = useTemplateRef('root')
useListReveal(root, '.reveal-card')

const active = () => orders.value.filter((order) => order.status === 'PENDING' || order.status === 'ACCEPTED')

onMounted(load)

async function load() {
  try {
    const data = await api<{ orders: MealOrder[] }>('/api/v1/orders')
    orders.value = data.orders
    await session.refresh()
    error.value = ''
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '待做没加载出来'
  }
}
</script>

<template>
  <div ref="root">
    <ScreenShell
      :eyebrow="`${session.membership?.displayName ?? ''}的厨房`"
      title="待做"
      lede="按用餐时间排。来不及就拒绝，留一句话。"
      settings
    >
      <p v-if="error" class="banner">{{ error }}</p>
      <p v-else-if="active().length === 0" class="empty-copy enter-item">现在没有要做的一餐。</p>
      <OrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        @open="router.push({ name: 'cook-order', params: { id: order.id } })"
      />
    </ScreenShell>
  </div>
</template>
