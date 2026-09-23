import { computed, onMounted, readonly, shallowRef } from 'vue'

export type ProbeState = 'checking' | 'up' | 'down'

export function useApiHealth() {
  const live = shallowRef<ProbeState>('checking')
  const ready = shallowRef<ProbeState>('checking')

  const summary = computed(() => {
    if (live.value === 'checking' || ready.value === 'checking') {
      return '正在看服务是否醒着。'
    }
    if (live.value === 'up' && ready.value === 'up') {
      return '服务和数据库都醒着。'
    }
    if (live.value === 'down') {
      return '服务没连上。先确认接口已启动。'
    }
    return '服务醒着，数据库还没准备好。'
  })

  async function refresh(): Promise<void> {
    live.value = 'checking'
    ready.value = 'checking'
    const [nextLive, nextReady] = await Promise.all([
      probe('/api/health/live'),
      probe('/api/health/ready'),
    ])
    live.value = nextLive
    ready.value = nextReady
  }

  onMounted(() => {
    void refresh()
  })

  return {
    live: readonly(live),
    ready: readonly(ready),
    summary,
    refresh,
  }
}

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  return `${base}${path}`
}

async function probe(path: string): Promise<ProbeState> {
  try {
    const response = await fetch(apiUrl(path))
    return response.ok ? 'up' : 'down'
  } catch {
    return 'down'
  }
}
