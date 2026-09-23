<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, ApiError } from '@/api/client'
import type { Dish, MealOrder, MealRecord, Slot } from '@/api/types'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { shanghaiDate } from '@/lib/dates'
import { readImageFile } from '@/lib/images'
import { SLOTS, SLOT_LABEL } from '@/lib/labels'

const route = useRoute()
const router = useRouter()
const mealDate = shallowRef(shanghaiDate())
const slot = shallowRef<Slot>('DINNER')
const body = shallowRef('')
const orderId = shallowRef(typeof route.query.orderId === 'string' ? route.query.orderId : '')
const dishes = shallowRef<Dish[]>([])
const picked = shallowRef<string[]>([])
const photos = shallowRef<Array<{ dataBase64: string; mime: string }>>([])
const error = shallowRef('')
const pending = shallowRef(false)

onMounted(async () => {
  const data = await api<{ dishes: Dish[] }>('/api/v1/dishes')
  dishes.value = data.dishes
  if (!orderId.value) return
  const order = await api<MealOrder>(`/api/v1/orders/${orderId.value}`)
  mealDate.value = order.mealDate
  slot.value = order.slot
  picked.value = order.items.map((item) => item.dishId).filter((id): id is string => Boolean(id))
})

function toggle(id: string) {
  picked.value = picked.value.includes(id) ? picked.value.filter((item) => item !== id) : [...picked.value, id]
}

async function addPhotos(event: Event) {
  const files = [...((event.target as HTMLInputElement).files ?? [])]
  const next = [...photos.value]
  for (const file of files) {
    if (next.length >= 9) break
    next.push(await readImageFile(file))
  }
  photos.value = next
}

async function publish() {
  pending.value = true
  error.value = ''
  try {
    const created = await api<MealRecord>('/api/v1/records', {
      method: 'POST',
      body: {
        mealDate: mealDate.value,
        slot: slot.value,
        body: body.value.trim(),
        orderId: orderId.value || undefined,
        dishIds: picked.value,
        photos: photos.value,
      },
    })
    await router.replace({ name: 'cook-record', params: { id: created.id } })
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没记下，内容还在'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ScreenShell title="记下这餐" :back="{ name: 'cook-records' }">
    <label class="field-label">
      日期
      <input v-model="mealDate" class="field" type="date" />
    </label>
    <div class="chips">
      <button
        v-for="item in SLOTS"
        :key="item"
        type="button"
        data-press
        :class="{ on: slot === item }"
        @click="slot = item"
      >
        {{ SLOT_LABEL[item] }}
      </button>
    </div>
    <div class="chips">
      <button
        v-for="dish in dishes"
        :key="dish.id"
        type="button"
        data-press
        :class="{ on: picked.includes(dish.id) }"
        @click="toggle(dish.id)"
      >
        {{ dish.name }}
      </button>
    </div>
    <label class="field-label">
      文字
      <textarea v-model="body" class="area" maxlength="300"></textarea>
    </label>
    <label class="btn ghost">
      加照片
      <input class="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple @change="addPhotos" />
    </label>
    <p class="quiet">已选 {{ photos.length }} / 9 张。照片和文字至少留一样。</p>
    <p v-if="error" class="banner">{{ error }}</p>
    <button class="btn" type="button" data-press :disabled="pending" @click="publish">记下</button>
  </ScreenShell>
</template>

<style scoped>
.file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
