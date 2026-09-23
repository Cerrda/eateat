<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useEnter, usePress } from '@/lib/motion'

defineProps<{
  eyebrow?: string
  title: string
  lede?: string
  settings?: boolean
  back?: RouteLocationRaw
}>()

const root = useTemplateRef('root')
useEnter(root)
usePress(root)
</script>

<template>
  <section ref="root" class="screen">
    <header class="screen-head">
      <div>
        <p v-if="eyebrow" class="eyebrow enter-title">{{ eyebrow }}</p>
        <div class="spread">
          <RouterLink v-if="back" class="back enter-title" :to="back" aria-label="返回">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.6" />
            </svg>
          </RouterLink>
          <h1 class="screen-title enter-title">{{ title }}</h1>
        </div>
        <span class="scribble" aria-hidden="true"></span>
      </div>
      <RouterLink v-if="settings" class="gear" :to="{ name: 'settings' }" aria-label="设置" data-press>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6" />
          <path
            d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
          />
        </svg>
      </RouterLink>
    </header>
    <p v-if="lede" class="lede enter-item">{{ lede }}</p>
    <slot />
  </section>
</template>
