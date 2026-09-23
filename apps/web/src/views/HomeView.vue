<script setup lang="ts">
import ApiStatus from '@/components/home/ApiStatus.vue'
import { useApiHealth } from '@/composables/useApiHealth'

const { live, ready, summary, refresh } = useApiHealth()
</script>

<template>
  <main class="home">
    <ApiStatus :live="live" :ready="ready" :summary="summary" @refresh="refresh" />
  </main>
</template>

<style scoped>
.home {
  display: grid;
}
</style>
