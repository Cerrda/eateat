<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <p class="mark">EatEat</p>
      <p class="hint">私人厨房</p>
    </header>
    <RouterView />
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  gap: 1.5rem;
  min-height: 100vh;
  padding: 1.5rem;
}

.topbar {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.mark,
.hint {
  margin: 0;
}

.mark {
  color: var(--color-heading);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
}

.hint {
  font-size: 0.85rem;
}
</style>
