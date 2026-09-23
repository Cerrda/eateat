<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const session = useSessionStore()

const items = computed(() => {
  if (session.membership?.role === 'EATER') {
    return [
      { name: 'menu', label: '菜单', badge: 0 },
      { name: 'orders', label: '订单', badge: session.profile?.badges.orders ?? 0 },
      { name: 'eat-records', label: '记录', badge: session.profile?.badges.records ?? 0 },
    ]
  }
  return [
    { name: 'todo', label: '待做', badge: session.profile?.badges.todo ?? 0 },
    { name: 'dishes', label: '菜品', badge: 0 },
    { name: 'cook-records', label: '记录', badge: session.profile?.badges.records ?? 0 },
  ]
})

function active(name: string) {
  return route.name === name
}
</script>

<template>
  <nav class="dock" aria-label="厨房">
    <RouterLink
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name }"
      :class="{ active: active(item.name) }"
      data-press
    >
      <span>{{ item.label }}</span>
      <span v-if="item.badge > 0" class="badge">{{ item.badge }}</span>
    </RouterLink>
  </nav>
</template>
