<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
let timer = 0

const title = computed(() =>
  session.membership?.role === 'COOKER' ? '等对方来点餐' : '等对方来做饭',
)

onMounted(() => {
  timer = window.setInterval(async () => {
    await session.refresh()
    if (session.bound) await router.replace(session.landing())
  }, 3000)
})

onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <ScreenShell
    :eyebrow="session.membership?.displayName"
    :title="title"
    lede="厨房还空着。对方加入之前，这里没有菜，对方也看不到任何东西。"
  >
    <p class="kicker enter-item">邀请码</p>
    <p class="screen-title enter-item">{{ session.membership?.invite?.code }}</p>
    <p class="quiet enter-item">自己打开这条邀请，会回到这一页。</p>
    <button class="btn enter-item" type="button" data-press @click="router.push({ name: 'invite' })">
      再复制一次链接
    </button>
  </ScreenShell>
</template>
