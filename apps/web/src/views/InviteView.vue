<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { ROLE_LABEL } from '@/lib/labels'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const notice = shallowRef('')
const error = shallowRef('')

const invite = computed(() => session.membership?.invite)
const codeChars = computed(() => invite.value?.code.split('') ?? [])
const link = computed(() => (invite.value ? `${location.origin}/j/${invite.value.code}` : ''))
const eyebrow = computed(() => session.membership?.displayName ?? '')

async function copy(text: string, done: string) {
  await navigator.clipboard.writeText(text)
  notice.value = done
}

async function refresh() {
  error.value = ''
  try {
    await session.refreshInvite()
    notice.value = '旧码已经失效'
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没换成新码'
  }
}
</script>

<template>
  <ScreenShell :eyebrow="eyebrow" title="把这间厨房交给对方">
    <p v-if="error" class="banner">{{ error }}</p>
    <p v-if="notice" class="banner">{{ notice }}</p>
    <div class="code enter-item" aria-label="邀请码">
      <span v-for="(char, index) in codeChars" :key="`${char}-${index}`">{{ char }}</span>
    </div>
    <p class="quiet enter-item">6 位邀请码，48 小时内有效。刷新后旧码立刻失效。</p>
    <p class="link-line enter-item">{{ link }}</p>
    <div class="stack">
      <button class="btn" type="button" data-press @click="invite && copy(invite.code, '邀请码已经复制')">
        复制邀请码
      </button>
      <button class="btn ghost" type="button" data-press @click="copy(link, '链接已经复制')">复制链接</button>
      <button class="btn ghost" type="button" data-press @click="refresh">换一个邀请码</button>
      <button class="btn ghost" type="button" data-press @click="router.push({ name: 'wait' })">
        等对方来{{ session.membership?.role === 'COOKER' ? '点餐' : '做饭' }}
      </button>
    </div>
    <p class="quiet">你是{{ session.membership ? ROLE_LABEL[session.membership.role] : '' }}。</p>
  </ScreenShell>
</template>
