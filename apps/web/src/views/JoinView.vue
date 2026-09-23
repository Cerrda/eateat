<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, ApiError } from '@/api/client'
import type { InvitePreview } from '@/api/types'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { ROLE_LABEL } from '@/lib/labels'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const typed = shallowRef(typeof route.params.code === 'string' ? route.params.code : '')
const preview = shallowRef<InvitePreview | null>(null)
const error = shallowRef('')
const pending = shallowRef(false)

const title = computed(() => {
  if (preview.value?.kind === 'invalid') return '这个码用不了'
  if (preview.value?.kind === 'already') return '你已经有厨房'
  if (preview.value?.partnerName && preview.value.partnerRole) {
    return `${preview.value.partnerName} · ${ROLE_LABEL[preview.value.partnerRole]}`
  }
  return '输入邀请码'
})

onMounted(() => {
  if (typed.value) void look()
})

async function look() {
  error.value = ''
  preview.value = null
  const code = typed.value.trim()
  if (!code) return
  try {
    const result = await api<InvitePreview>(`/api/v1/invites/${encodeURIComponent(code)}`)
    preview.value = result
    if (result.kind === 'self') await router.replace({ name: 'wait' })
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '没找到这间厨房'
  }
}

async function join(abandon = false) {
  if (!preview.value) return
  pending.value = true
  error.value = ''
  try {
    await session.join(preview.value.code, abandon)
    await router.replace(session.landing())
  } catch (reason) {
    if (reason instanceof ApiError && reason.code === 'ABANDON_REQUIRED') {
      preview.value = { ...preview.value, kind: 'abandon' }
    } else if (reason instanceof ApiError && reason.code === 'ALREADY_BOUND') {
      preview.value = { kind: 'already', code: preview.value.code }
    } else if (reason instanceof ApiError && reason.code === 'INVITE_INVALID') {
      preview.value = { kind: 'invalid', code: preview.value.code }
    } else {
      error.value = reason instanceof ApiError ? reason.message : '没加入成功'
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <ScreenShell eyebrow="对方的称呼" :title="title">
    <form v-if="!preview" class="stack" @submit.prevent="look">
      <label class="field-label">
        邀请码
        <input
        v-model="typed"
        class="field code-input"
        maxlength="6"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
      </label>
      <button class="btn" type="submit" data-press>查看这间厨房</button>
    </form>
    <div v-else-if="preview.kind === 'invalid'" class="stack">
      <p class="lede">过期了，或写错了。请对方重新发。这里不会创建一间空厨房。</p>
      <p class="link-line">{{ preview.code }}</p>
      <button class="btn" type="button" data-press @click="preview = null">再试一次</button>
    </div>
    <div v-else-if="preview.kind === 'already'" class="stack">
      <p class="lede">一个微信只能待在一间厨房里。这条邀请不会切换，也不会覆盖现在这间。</p>
      <button class="btn" type="button" data-press @click="router.push(session.landing())">回到我的厨房</button>
    </div>
    <div v-else class="stack">
      <p class="lede">
        你会成为{{ preview.yourRole ? ROLE_LABEL[preview.yourRole] : '另一边' }}。角色自动取互补，不能改选。绑定后这一版也不对调。
      </p>
      <p v-if="preview.kind === 'abandon'" class="banner">接受后，这间空厨房会被放弃。</p>
      <p class="kicker">你的位置</p>
      <p class="screen-title">{{ preview.yourRole ? ROLE_LABEL[preview.yourRole] : '' }}</p>
      <p v-if="error" class="banner">{{ error }}</p>
      <button class="btn" type="button" data-press :disabled="pending" @click="join(preview.kind === 'abandon')">
        {{ preview.kind === 'abandon' ? '确认加入' : '加入这间厨房' }}
      </button>
      <button class="btn ghost" type="button" data-press @click="router.push({ name: 'start' })">不是这间厨房</button>
    </div>
  </ScreenShell>
</template>
