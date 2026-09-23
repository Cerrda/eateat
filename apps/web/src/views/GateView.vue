<script setup lang="ts">
import { useRouter } from 'vue-router'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const isDev = import.meta.env.DEV

async function enter() {
  await session.enableWechat()
  await router.replace(session.landing())
}
</script>

<template>
  <ScreenShell
    eyebrow="一对人"
    title="用微信打开"
    lede="这间厨房只在微信里。从聊天里点开，或用微信扫一扫。这里不会创建厨房。"
  >
    <p class="brand enter-item">EatEat</p>
    <button v-if="isDev" class="btn ghost enter-item" type="button" data-press @click="enter">
      开发时当作微信打开
    </button>
  </ScreenShell>
</template>

<style scoped>
.brand {
  margin: 1.5rem 0 0;
  font-family: var(--serif);
  font-size: 1.4rem;
  font-style: italic;
}
</style>
