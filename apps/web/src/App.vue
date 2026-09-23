<script setup lang="ts">
import { RouterView } from 'vue-router'
import DevIdentity from '@/components/shell/DevIdentity.vue'

const isDev = import.meta.env.DEV
</script>

<template>
  <RouterView />
  <DevIdentity v-if="isDev" />
</template>
