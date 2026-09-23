<script setup lang="ts">
import { computed } from 'vue'
import type { ProbeState } from '@/composables/useApiHealth'

const props = defineProps<{
  live: ProbeState
  ready: ProbeState
  summary: string
}>()

const emit = defineEmits<{
  refresh: []
}>()

const rows = computed(() => [
  { key: 'live', label: '接口', state: props.live },
  { key: 'ready', label: '数据库', state: props.ready },
])

function tone(state: ProbeState): string {
  if (state === 'up') return 'tone-up'
  if (state === 'down') return 'tone-down'
  return 'tone-checking'
}

function caption(state: ProbeState): string {
  if (state === 'up') return '正常'
  if (state === 'down') return '不可用'
  return '检查中'
}
</script>

<template>
  <section class="panel">
    <h1 class="title">厨房这边</h1>
    <p class="summary">{{ summary }}</p>
    <ul class="rows">
      <li v-for="row in rows" :key="row.key" class="row">
        <span class="label">{{ row.label }}</span>
        <span class="state" :class="tone(row.state)">{{ caption(row.state) }}</span>
      </li>
    </ul>
    <button class="refresh" type="button" @click="emit('refresh')">再看一次</button>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 1rem;
  max-width: 28rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.title {
  margin: 0;
  color: var(--color-heading);
  font-size: 1.75rem;
  line-height: 1.2;
}

.summary {
  margin: 0;
}

.rows {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.tone-up {
  color: #2f6b4f;
}

.tone-down {
  color: #8a3d32;
}

.tone-checking {
  color: var(--color-text);
}

.refresh {
  justify-self: start;
  padding: 0.45rem 0.8rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-heading);
  cursor: pointer;
}
</style>
