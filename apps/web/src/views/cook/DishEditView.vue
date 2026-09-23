<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, ApiError } from '@/api/client'
import type { Dish, DishPayload } from '@/api/types'
import CoverStudio from '@/components/dishes/CoverStudio.vue'
import DishCard from '@/components/dishes/DishCard.vue'
import DishForm from '@/components/dishes/DishForm.vue'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { readImageFile } from '@/lib/images'

const route = useRoute()
const router = useRouter()
const dish = shallowRef<Dish | null>(null)
const seed = shallowRef<DishPayload & { steps: string[] }>({ name: '', steps: [] })
const error = shallowRef('')
const saving = shallowRef(false)
const generating = shallowRef(false)
const previewing = shallowRef(false)
const preview = shallowRef<DishPayload | null>(null)
const dishId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))

onMounted(async () => {
  if (dishId.value) {
    await load(dishId.value)
    return
  }
  const raw = sessionStorage.getItem('eateat-prefill')
  if (!raw) return
  sessionStorage.removeItem('eateat-prefill')
  const prefill = JSON.parse(raw) as DishPayload & { message?: string }
  seed.value = {
    name: prefill.name ?? '',
    summary: prefill.summary,
    ingredients: prefill.ingredients,
    steps: prefill.steps ?? [],
    durationMinutes: prefill.durationMinutes,
    servings: prefill.servings,
    sourceUrl: prefill.sourceUrl,
  }
  if (prefill.message) error.value = prefill.message
})

async function load(id: string) {
  dish.value = await api<Dish>(`/api/v1/dishes/${id}`)
  seed.value = toSeed(dish.value)
}

function toSeed(value: Dish): DishPayload & { steps: string[] } {
  return {
    name: value.name,
    summary: value.summary,
    ingredients: value.ingredients,
    steps: value.steps,
    durationMinutes: value.durationMinutes ?? undefined,
    servings: value.servings,
    sourceUrl: value.sourceUrl ?? undefined,
  }
}

async function save(payload: DishPayload, publish: boolean) {
  saving.value = true
  error.value = ''
  try {
    const saved = dishId.value
      ? await api<Dish>(`/api/v1/dishes/${dishId.value}`, { method: 'PATCH', body: payload })
      : await api<Dish>('/api/v1/dishes', { method: 'POST', body: payload })
    dish.value = saved
    seed.value = toSeed(saved)
    if (!dishId.value) await router.replace({ name: 'dish-edit', params: { id: saved.id } })
    if (publish) {
      dish.value = await api<Dish>(`/api/v1/dishes/${saved.id}/publish`, { method: 'POST', body: {} })
      seed.value = toSeed(dish.value)
    }
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没保存，内容还在'
    if (dishId.value) dish.value = await api<Dish>(`/api/v1/dishes/${dishId.value}`)
  } finally {
    saving.value = false
  }
}

async function generate() {
  if (!dish.value) {
    error.value = '先保存菜名，再生成封面'
    return
  }
  generating.value = true
  error.value = ''
  try {
    await api(`/api/v1/dishes/${dish.value.id}/covers`, { method: 'POST', body: {} })
    dish.value = await api<Dish>(`/api/v1/dishes/${dish.value.id}`)
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没生成成功，可以重试，或改为上传'
    if (dish.value) dish.value = await api<Dish>(`/api/v1/dishes/${dish.value.id}`)
  } finally {
    generating.value = false
  }
}

async function adopt() {
  if (!dish.value?.candidate) return
  dish.value = await api<Dish>(`/api/v1/dishes/${dish.value.id}/covers/${dish.value.candidate.id}/adopt`, {
    method: 'POST',
    body: {},
  })
}

async function upload(file: File) {
  if (!dish.value) {
    error.value = '先保存菜名，再上传封面'
    return
  }
  try {
    const image = await readImageFile(file)
    dish.value = await api<Dish>(`/api/v1/dishes/${dish.value.id}/cover`, {
      method: 'POST',
      body: image,
    })
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '这张图没传上去，再试一次'
  }
}

async function unpublish() {
  if (!dish.value) return
  dish.value = await api<Dish>(`/api/v1/dishes/${dish.value.id}/unpublish`, { method: 'POST', body: {} })
}

async function remove() {
  if (!dish.value) return
  try {
    await api(`/api/v1/dishes/${dish.value.id}`, { method: 'DELETE' })
    await router.push({ name: 'dishes' })
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '这道菜还不能删'
  }
}
</script>

<template>
  <ScreenShell title="这道菜" :back="{ name: 'dishes' }" :lede="dish?.sourceUrl ? '来源链接只留在这里。' : undefined">
    <p v-if="dish?.sourceUrl" class="quiet">{{ dish.sourceUrl }}</p>
    <p v-if="error" class="banner">{{ error }}</p>
    <DishForm
      :initial="seed"
      :blockers="dish?.blockers ?? []"
      :saving="saving"
      :previewing="previewing"
      @save="save"
      @preview="
        (payload) => {
          previewing = !previewing
          preview = payload
        }
      "
    />
    <DishCard
      v-if="previewing && preview"
      :dish="{
        name: preview.name,
        coverPath: dish?.coverPath ?? null,
        durationMinutes: preview.durationMinutes ?? null,
        servings: preview.servings ?? '',
      }"
    />
    <CoverStudio
      v-if="dish"
      :dish="dish"
      :generating="generating"
      @generate="generate"
      @adopt="adopt"
      @upload="upload"
    />
    <button v-if="dish?.status === 'PUBLISHED'" class="btn ghost" type="button" data-press @click="unpublish">
      下架
    </button>
    <button v-if="dish" class="btn danger" type="button" data-press @click="remove">删除</button>
  </ScreenShell>
</template>
