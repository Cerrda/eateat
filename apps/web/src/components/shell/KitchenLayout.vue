<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import BottomNav from './BottomNav.vue'

const route = useRoute()
const session = useSessionStore()
const showNav = computed(() => Boolean(route.meta.nav) && session.bound)
</script>

<template>
  <div class="phone">
    <RouterView />
  </div>
  <BottomNav v-if="showNav" />
</template>
