<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  action: string
}>()

const emit = defineEmits<{
  close: []
  submit: [message: string]
}>()

const message = shallowRef('')
const length = computed(() => Array.from(message.value.trim()).length)

watch(
  () => props.open,
  (open) => {
    if (open) message.value = ''
  },
)

function send() {
  emit('submit', message.value.trim())
}
</script>

<template>
  <form v-if="open" class="sheet stack enter-item" @submit.prevent="send">
    <h2>{{ title }}</h2>
    <label class="field-label">
      留一句话
      <textarea v-model="message" class="area" maxlength="40" required></textarea>
    </label>
    <p class="quiet">{{ length }} / 40</p>
    <button class="btn" type="submit" data-press :disabled="length < 1 || length > 40">
      {{ action }}
    </button>
    <button class="btn ghost" type="button" data-press @click="emit('close')">先不写</button>
  </form>
</template>
