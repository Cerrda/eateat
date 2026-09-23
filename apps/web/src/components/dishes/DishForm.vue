<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { DishPayload } from '@/api/types'

const props = defineProps<{
  initial: DishPayload & { steps: string[] }
  blockers: string[]
  saving: boolean
  previewing: boolean
}>()

const emit = defineEmits<{
  save: [payload: DishPayload, publish: boolean]
  preview: [payload: DishPayload]
}>()

const name = shallowRef(props.initial.name)
const summary = shallowRef(props.initial.summary ?? '')
const ingredients = shallowRef(props.initial.ingredients ?? '')
const stepsText = shallowRef(props.initial.steps.join('\n'))
const duration = shallowRef(props.initial.durationMinutes ? String(props.initial.durationMinutes) : '')
const servings = shallowRef(props.initial.servings ?? '')

watch(
  () => props.initial,
  (initial) => {
    name.value = initial.name
    summary.value = initial.summary ?? ''
    ingredients.value = initial.ingredients ?? ''
    stepsText.value = initial.steps.join('\n')
    duration.value = initial.durationMinutes ? String(initial.durationMinutes) : ''
    servings.value = initial.servings ?? ''
  },
)

const payload = computed<DishPayload>(() => ({
  name: name.value.trim(),
  summary: summary.value.trim(),
  ingredients: ingredients.value.trim(),
  steps: stepsText.value
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean),
  durationMinutes: duration.value ? Number(duration.value) : undefined,
  servings: servings.value.trim(),
  sourceUrl: props.initial.sourceUrl || undefined,
}))

const nameCount = computed(() => Array.from(name.value.trim()).length)
</script>

<template>
  <form class="stack" @submit.prevent="emit('save', payload, false)">
    <label class="field-label">
      菜名
      <input v-model="name" class="field" maxlength="20" required />
    </label>
    <p class="quiet">{{ nameCount }} / 20</p>
    <label class="field-label">
      简介
      <textarea v-model="summary" class="area" maxlength="80"></textarea>
    </label>
    <label class="field-label">
      食材，一条一行
      <textarea v-model="ingredients" class="area"></textarea>
    </label>
    <label class="field-label">
      步骤，一步一行
      <textarea v-model="stepsText" class="area"></textarea>
    </label>
    <label class="field-label">
      预计耗时（分钟）
      <input v-model="duration" class="field" inputmode="numeric" />
    </label>
    <label class="field-label">
      份量
      <input v-model="servings" class="field" maxlength="20" placeholder="2 人份" />
    </label>
    <p v-if="blockers.length" class="banner">上架还差：{{ blockers.join('，') }}</p>
    <button class="btn ghost" type="submit" data-press :disabled="saving || nameCount < 1">保存草稿</button>
    <button class="btn" type="button" data-press :disabled="saving" @click="emit('save', payload, true)">上架</button>
    <button class="btn ghost" type="button" data-press @click="emit('preview', payload)">
      {{ previewing ? '收回预览' : '预览上架后的样子' }}
    </button>
  </form>
</template>
