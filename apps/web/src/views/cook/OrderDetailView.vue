<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, ApiError } from '@/api/client'
import type { MealOrder } from '@/api/types'
import NoteSheet from '@/components/kitchen/NoteSheet.vue'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { dateLabel } from '@/lib/dates'
import { ORDER_LABEL, SLOT_LABEL } from '@/lib/labels'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const order = shallowRef<MealOrder | null>(null)
const error = shallowRef('')
const sheet = shallowRef<'reject' | 'cancel' | ''>('')
const donePrompt = shallowRef(false)

onMounted(load)

async function load() {
  try {
    order.value = await api<MealOrder>(`/api/v1/orders/${route.params.id}`)
    await session.refresh()
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没有这一餐'
  }
}

async function act(path: string, body?: Record<string, string>) {
  error.value = ''
  try {
    order.value = await api<MealOrder>(`/api/v1/orders/${route.params.id}/${path}`, {
      method: 'POST',
      body: body ?? {},
    })
    sheet.value = ''
    donePrompt.value = path === 'complete'
    await session.refresh()
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没处理成功，再试一次'
  }
}
</script>

<template>
  <ScreenShell
    v-if="order"
    :eyebrow="dateLabel(order.mealDate)"
    :title="SLOT_LABEL[order.slot]"
    :back="{ name: 'todo' }"
  >
    <p class="meta enter-item">{{ ORDER_LABEL[order.status] }}</p>
    <div class="covers enter-item">
      <img v-for="item in order.items" :key="item.id" class="cover" :src="item.coverPath || ''" alt="" />
    </div>
    <p class="lede">{{ order.items.map((item) => item.name).join('、') }}</p>
    <p v-if="order.note" class="quiet">备注：{{ order.note }}</p>
    <p v-if="order.message" class="banner">{{ order.message }}</p>
    <p v-if="error" class="banner">{{ error }}</p>
    <div v-if="order.status === 'PENDING'" class="stack">
      <button class="btn" type="button" data-press @click="act('accept')">接单</button>
      <button class="btn ghost" type="button" data-press @click="sheet = 'reject'">拒绝</button>
    </div>
    <div v-else-if="order.status === 'ACCEPTED'" class="stack">
      <button class="btn" type="button" data-press @click="act('complete')">做完了</button>
      <button class="btn ghost" type="button" data-press @click="sheet = 'cancel'">取消这一餐</button>
    </div>
    <div v-if="donePrompt" class="panel stack enter-item">
      <p>记下这餐？也可以先跳过，之后再补。</p>
      <button
        class="btn"
        type="button"
        data-press
        @click="router.push({ name: 'record-new', query: { orderId: order.id } })"
      >
        记下这餐
      </button>
      <button class="btn ghost" type="button" data-press @click="donePrompt = false">先跳过</button>
    </div>
    <button
      v-if="order.status === 'COMPLETED' && !order.recordId"
      class="btn enter-item"
      type="button"
      data-press
      @click="router.push({ name: 'record-new', query: { orderId: order.id } })"
    >
      记下这餐
    </button>
    <RouterLink
      v-if="order.recordId"
      class="btn-link ghost enter-item"
      :to="{ name: 'cook-record', params: { id: order.recordId } }"
    >
      看记下的这一餐
    </RouterLink>
    <NoteSheet
      :open="sheet === 'reject'"
      title="拒绝这一餐"
      action="拒绝"
      @close="sheet = ''"
      @submit="act('reject', { message: $event })"
    />
    <NoteSheet
      :open="sheet === 'cancel'"
      title="取消这一餐"
      action="取消"
      @close="sheet = ''"
      @submit="act('cancel', { message: $event })"
    />
  </ScreenShell>
  <p v-else class="lede">{{ error || '等一下' }}</p>
</template>
