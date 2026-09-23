<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiError } from '@/api/client'
import type { MealRecord } from '@/api/types'
import RecordCard from '@/components/records/RecordCard.vue'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { useListReveal } from '@/lib/motion'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const records = shallowRef<MealRecord[]>([])
const error = shallowRef('')
const root = useTemplateRef('root')
useListReveal(root, '.reveal-card')
const cooker = computed(() => session.membership?.role === 'COOKER')

onMounted(async () => {
  try {
    if (!cooker.value) await session.seen('records')
    const data = await api<{ records: MealRecord[] }>('/api/v1/records')
    records.value = data.records
    await session.refresh()
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '记录没打开'
  }
})

function open(id: string) {
  void router.push({
    name: cooker.value ? 'cook-record' : 'eat-record',
    params: { id },
  })
}
</script>

<template>
  <div ref="root">
    <ScreenShell
      :eyebrow="`${session.membership?.displayName ?? ''}的厨房`"
      title="记录"
      settings
    >
      <button
        v-if="cooker"
        class="btn enter-item"
        type="button"
        data-press
        @click="router.push({ name: 'record-new' })"
      >
        记下这餐
      </button>
      <p v-if="error" class="banner">{{ error }}</p>
      <p v-else-if="records.length === 0" class="empty-copy enter-item">还没有记下的一餐。</p>
      <RecordCard v-for="record in records" :key="record.id" :record="record" @open="open(record.id)" />
    </ScreenShell>
  </div>
</template>
