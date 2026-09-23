<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { api, apiUrl, ApiError } from '@/api/client'
import type { MealOrder } from '@/api/types'
import NoteSheet from '@/components/kitchen/NoteSheet.vue'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { dateLabel } from '@/lib/dates'
import { ORDER_LABEL, SLOT_LABEL } from '@/lib/labels'

const route = useRoute()
const order = shallowRef<MealOrder | null>(null)
const error = shallowRef('')
const cancelling = shallowRef(false)
const fresh = computed(() => route.query.fresh === '1')
const canCancel = computed(() => order.value?.status === 'PENDING' || order.value?.status === 'ACCEPTED')

onMounted(load)

async function load() {
  try {
    order.value = await api<MealOrder>(`/api/v1/orders/${route.params.id}`)
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没有这一餐'
  }
}

async function cancel(message: string) {
  try {
    order.value = await api<MealOrder>(`/api/v1/orders/${route.params.id}/cancel`, {
      method: 'POST',
      body: { message },
    })
    cancelling.value = false
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没取消，再试一次'
  }
}
</script>

<template>
  <ScreenShell
    v-if="order"
    :eyebrow="dateLabel(order.mealDate)"
    :title="SLOT_LABEL[order.slot]"
    :back="{ name: 'orders' }"
  >
    <p v-if="fresh" class="banner enter-item">对方打开 EatEat 后，会在待做里看到。</p>
    <p class="meta">{{ ORDER_LABEL[order.status] }}</p>
    <div class="covers">
      <img v-for="item in order.items" :key="item.id" class="cover" :src="apiUrl(item.coverPath || '')" alt="" />
    </div>
    <p class="lede">{{ order.items.map((item) => item.name).join('、') }}</p>
    <p v-if="order.note" class="quiet">备注：{{ order.note }}</p>
    <p v-if="order.message" class="banner">{{ order.message }}</p>
    <p v-if="error" class="banner">{{ error }}</p>
    <button v-if="canCancel" class="btn ghost" type="button" data-press @click="cancelling = true">
      取消并留一句话
    </button>
    <RouterLink v-if="order.status === 'REJECTED'" class="btn-link" :to="{ name: 'menu' }">重新点这一餐</RouterLink>
    <RouterLink
      v-if="order.recordId"
      class="btn-link ghost"
      :to="{ name: 'eat-record', params: { id: order.recordId } }"
    >
      看记下的这一餐
    </RouterLink>
    <NoteSheet :open="cancelling" title="取消这一餐" action="取消" @close="cancelling = false" @submit="cancel" />
  </ScreenShell>
  <p v-else class="lede">{{ error || '等一下' }}</p>
</template>
