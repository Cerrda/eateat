<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import ScreenShell from '@/components/shell/ScreenShell.vue'
import { ROLE_LABEL } from '@/lib/labels'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const name = shallowRef(session.membership?.displayName ?? '')
const error = shallowRef('')
const confirming = shallowRef(false)
const count = computed(() => Array.from(name.value.trim()).length)
const partner = computed(() => session.membership?.partner)
const back = computed(() => session.landing())

async function save() {
  error.value = ''
  try {
    await session.rename(name.value)
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '称呼没保存'
  }
}

async function unbind() {
  error.value = ''
  try {
    await session.unbind()
    confirming.value = false
    await router.replace({ name: 'start' })
  } catch (reason) {
    error.value = reason instanceof ApiError ? reason.message : '还没解开'
  }
}
</script>

<template>
  <ScreenShell eyebrow="设置" title="称呼" :back="back">
    <p class="kicker">{{ session.membership?.displayName }}的厨房</p>
    <label class="field-label enter-item">
      称呼
      <input v-model="name" class="field" maxlength="8" />
    </label>
    <p class="quiet">{{ count }} / 8</p>
    <button class="btn enter-item" type="button" data-press @click="save">保存称呼</button>
    <section class="row-card enter-item">
      <p class="kicker">绑定对象</p>
      <p class="meal-name">
        <template v-if="partner">{{ partner.displayName }} · {{ ROLE_LABEL[partner.role] }}</template>
        <template v-else>还在等对方</template>
      </p>
    </section>
    <p class="quiet">解除后马上生效。旧菜、旧订单和旧记录都不再显示。</p>
    <p v-if="error" class="banner">{{ error }}</p>
    <button v-if="!confirming" class="btn danger" type="button" data-press @click="confirming = true">
      解除绑定
    </button>
    <button v-else class="btn danger" type="button" data-press @click="unbind">确认解除</button>
  </ScreenShell>
</template>
