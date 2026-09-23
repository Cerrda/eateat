<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { api, ApiError } from '@/api/client'
import type { Dish, DishStatus } from '@/api/types'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { classifyRecipeUrl } from '@/lib/links'
import { DISH_LABEL } from '@/lib/labels'
import { useListReveal } from '@/lib/motion'
import { useTemplateRef } from 'vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const dishes = shallowRef<Dish[]>([])
const tab = shallowRef<DishStatus>('DRAFT')
const link = shallowRef('')
const error = shallowRef('')
const root = useTemplateRef('root')
useListReveal(root, '.reveal-card')

const visible = computed(() => dishes.value.filter((dish) => dish.status === tab.value))

onMounted(load)

async function load() {
  const data = await api<{ dishes: Dish[] }>('/api/v1/dishes')
  dishes.value = data.dishes
}

async function importLink() {
  error.value = ''
  const kind = classifyRecipeUrl(link.value)
  if (kind === 'other' || kind === 'invalid') {
    error.value = '只能用小红书或抖音，可以改为自己写'
    return
  }
  try {
    const result = await api<{
      parsed: boolean
      message: string
      sourceUrl: string
      draft: Dish | null
    }>('/api/v1/dishes/import', { method: 'POST', body: { url: link.value.trim() } })
    if (result.draft) {
      await router.push({ name: 'dish-edit', params: { id: result.draft.id } })
      return
    }
    sessionStorage.setItem(
      'eateat-prefill',
      JSON.stringify({ sourceUrl: result.sourceUrl, message: result.message }),
    )
    await router.push({ name: 'dish-new' })
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '这条没解析出来，可以直接写'
  }
}

function writeInstead() {
  sessionStorage.setItem('eateat-prefill', JSON.stringify({ message: '改为自己写' }))
  void router.push({ name: 'dish-new' })
}
</script>

<template>
  <div ref="root">
    <ScreenShell
      :eyebrow="`${session.membership?.displayName ?? ''}的厨房`"
      title="菜品"
      lede="草稿和下架的菜，点餐的人看不见。"
      settings
    >
      <div class="stack enter-item">
        <label class="field-label">
          从链接添加
          <input v-model="link" class="field" placeholder="小红书或抖音链接" />
        </label>
        <button class="btn" type="button" data-press @click="importLink">解析成草稿</button>
        <button class="btn ghost" type="button" data-press @click="writeInstead">自己写</button>
        <p v-if="error" class="banner">{{ error }}</p>
      </div>
      <div class="tabs enter-item">
        <button
          v-for="status in ['DRAFT', 'PUBLISHED', 'UNPUBLISHED']"
          :key="status"
          type="button"
          :class="{ active: tab === status }"
          @click="tab = status as DishStatus"
        >
          {{ DISH_LABEL[status as DishStatus] }}
        </button>
      </div>
      <p v-if="visible.length === 0" class="empty-copy">这里还空着。</p>
      <button
        v-for="dish in visible"
        :key="dish.id"
        class="row-card reveal-card"
        type="button"
        @click="router.push({ name: 'dish-edit', params: { id: dish.id } })"
      >
        <span class="spread">
          <img v-if="dish.coverPath" class="cover" :src="dish.coverPath" alt="" />
          <span>
            <strong class="dish-name">{{ dish.name }}</strong>
            <span class="quiet">{{ DISH_LABEL[dish.status] }}</span>
          </span>
        </span>
      </button>
    </ScreenShell>
  </div>
</template>

<style scoped>
.row-card {
  width: 100%;
  background: transparent;
  text-align: left;
}

.dish-name {
  display: block;
  font-family: var(--serif);
  font-size: 1.45rem;
  font-weight: 400;
}
</style>
