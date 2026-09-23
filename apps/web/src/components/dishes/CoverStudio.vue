<script setup lang="ts">
import { apiUrl } from '@/api/client'
import type { Dish } from '@/api/types'

defineProps<{
  dish: Pick<Dish, 'coverPath' | 'candidate' | 'coversRemaining'>
  generating: boolean
}>()

const emit = defineEmits<{
  generate: []
  adopt: []
  upload: [file: File]
}>()

function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) emit('upload', file)
}
</script>

<template>
  <section class="stack">
    <img v-if="dish.coverPath" class="cover-lg" :src="apiUrl(dish.coverPath)" alt="" />
    <p v-else class="quiet">还没有封面。生成一张，或自己上传。</p>
    <button class="btn" type="button" data-press :disabled="generating || dish.coversRemaining < 1" @click="emit('generate')">
      {{ generating ? '正在生成封面' : '生成封面' }}
    </button>
    <p class="quiet">今天还能生成 {{ dish.coversRemaining }} 次。次数用完仍可以上传。</p>
    <figure v-if="dish.candidate?.status === 'READY' && dish.candidate.imagePath" class="panel stack">
      <img class="cover-lg" :src="apiUrl(dish.candidate.imagePath)" alt="" />
      <button class="btn" type="button" data-press @click="emit('adopt')">用这张</button>
      <button class="btn ghost" type="button" data-press :disabled="generating" @click="emit('generate')">
        重新生成
      </button>
    </figure>
    <p v-else-if="dish.candidate?.status === 'FAILED'" class="banner">没生成成功，可以重试，或改为上传。草稿还在。</p>
    <label class="btn ghost">
      上传封面
      <input class="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" @change="onFile" />
    </label>
  </section>
</template>

<style scoped>
.file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.panel {
  padding: 0.7rem;
}
</style>
