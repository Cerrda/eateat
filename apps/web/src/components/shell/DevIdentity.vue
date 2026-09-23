<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()

async function choose(slot: 'alpha' | 'beta') {
  await session.switchSlot(slot)
  await router.replace(session.landing())
}
</script>

<template>
  <div v-if="session.wechat" class="dev-dock">
    <button type="button" :disabled="session.slot === 'alpha'" @click="choose('alpha')">身份甲</button>
    <button type="button" :disabled="session.slot === 'beta'" @click="choose('beta')">身份乙</button>
  </div>
</template>
