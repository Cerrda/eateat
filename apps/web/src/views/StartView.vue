<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import type { Role } from '@/api/types'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const error = shallowRef('')
const pending = shallowRef(false)

async function choose(role: Role) {
  error.value = ''
  pending.value = true
  try {
    await session.createKitchen(role)
    await router.push({ name: 'invite' })
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没创建成功，再试一次'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ScreenShell eyebrow="一对人" title="谁来开这间厨房" lede="先打开的人选一边。另一个人加入后，自动成为另一边。">
    <p v-if="error" class="banner">{{ error }}</p>
    <article class="choice enter-item">
      <h2>我来做饭</h2>
      <p>我来上架菜、接下这一餐、记下做过的饭。</p>
      <button class="btn" type="button" data-press :disabled="pending" @click="choose('COOKER')">
        生成邀请，等对方来点餐
      </button>
    </article>
    <article class="choice enter-item">
      <h2>我来点餐</h2>
      <p>我来点早上、中午和晚上。</p>
      <button class="btn" type="button" data-press :disabled="pending" @click="choose('EATER')">
        生成邀请，等对方来做饭
      </button>
    </article>
    <button class="btn ghost enter-item" type="button" data-press @click="router.push({ name: 'join-entry' })">
      我有邀请码
    </button>
  </ScreenShell>
</template>
