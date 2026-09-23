<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, apiUrl, ApiError } from '@/api/client'
import type { MealRecord } from '@/api/types'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { dateLabel } from '@/lib/dates'
import { readImageFile } from '@/lib/images'
import { SLOT_LABEL } from '@/lib/labels'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const record = shallowRef<MealRecord | null>(null)
const body = shallowRef('')
const error = shallowRef('')
const extra = shallowRef<Array<{ dataBase64: string; mime: string }>>([])
const dropped = shallowRef<string[]>([])
const cooker = computed(() => session.membership?.role === 'COOKER')
const backName = computed(() => (cooker.value ? 'cook-records' : 'eat-records'))
const kept = computed(() => record.value?.photos.filter((photo) => !dropped.value.includes(photo.id)) ?? [])

onMounted(async () => {
  record.value = await api<MealRecord>(`/api/v1/records/${route.params.id}`)
  body.value = record.value.body
})

function drop(id: string) {
  dropped.value = dropped.value.includes(id)
    ? dropped.value.filter((item) => item !== id)
    : [...dropped.value, id]
}

async function addPhotos(event: Event) {
  const files = [...((event.target as HTMLInputElement).files ?? [])]
  const next = [...extra.value]
  for (const file of files) next.push(await readImageFile(file))
  extra.value = next
}

async function save() {
  if (!record.value) return
  error.value = ''
  try {
    record.value = await api<MealRecord>(`/api/v1/records/${record.value.id}`, {
      method: 'PATCH',
      body: {
        body: body.value,
        keepPhotoIds: kept.value.map((photo) => photo.id),
        addPhotos: extra.value,
      },
    })
    body.value = record.value.body
    extra.value = []
    dropped.value = []
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没改好，内容还在'
  }
}

async function remove() {
  if (!record.value) return
  await api(`/api/v1/records/${record.value.id}`, { method: 'DELETE' })
  await router.replace({ name: backName.value })
}
</script>

<template>
  <ScreenShell
    v-if="record"
    :eyebrow="dateLabel(record.mealDate)"
    :title="SLOT_LABEL[record.slot]"
    :back="{ name: backName }"
  >
    <p class="lede enter-item">{{ record.dishes.map((dish) => dish.name).join('、') }}</p>
    <div class="photo-grid enter-item">
      <img v-for="photo in kept" :key="photo.id" :src="apiUrl(photo.path)" alt="" @click="cooker && drop(photo.id)" />
    </div>
    <p v-if="cooker" class="quiet">点一下照片可以拿掉，再保存。</p>
    <textarea v-if="cooker" v-model="body" class="area" maxlength="300"></textarea>
    <p v-else class="lede">{{ record.body }}</p>
    <label v-if="cooker" class="btn ghost">
      再加照片
      <input class="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple @change="addPhotos" />
    </label>
    <p v-if="error" class="banner">{{ error }}</p>
    <button v-if="cooker" class="btn" type="button" data-press @click="save">保存修改</button>
    <button v-if="cooker" class="btn danger" type="button" data-press @click="remove">删除这餐记录</button>
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
