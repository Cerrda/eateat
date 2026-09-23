import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { RouteLocationRaw } from 'vue-router'
import { api, ApiError, setApiAuth } from '@/api/client'
import type { Profile, Role } from '@/api/types'

type SlotName = 'alpha' | 'beta'

function storageKey(slot: SlotName, name: string) {
  return `eateat-${slot}-${name}`
}

function readSlot(): SlotName {
  return localStorage.getItem('eateat-slot') === 'beta' ? 'beta' : 'alpha'
}

export const useSessionStore = defineStore('session', () => {
  const wechat = shallowRef(false)
  const token = shallowRef('')
  const profile = shallowRef<Profile | null>(null)
  const ready = shallowRef(false)
  const slot = shallowRef<SlotName>(readSlot())
  const error = shallowRef('')
  let booting: Promise<void> | null = null

  const membership = computed(() => profile.value?.membership ?? null)
  const bound = computed(() => membership.value?.kitchenStatus === 'BOUND')

  function syncAuth() {
    setApiAuth(token.value, wechat.value)
  }

  function landing(): RouteLocationRaw {
    const current = membership.value
    if (!current) return { name: 'start' }
    if (current.kitchenStatus !== 'BOUND') return { name: 'wait' }
    return current.role === 'COOKER' ? { name: 'todo' } : { name: 'menu' }
  }

  async function boot() {
    if (ready.value) return
    if (!booting) booting = load()
    await booting
  }

  async function load() {
    const realWechat = navigator.userAgent.includes('MicroMessenger')
    const simulated = import.meta.env.DEV && localStorage.getItem('eateat-wechat') === '1'
    wechat.value = realWechat || simulated
    slot.value = readSlot()
    token.value = localStorage.getItem(storageKey(slot.value, 'token')) ?? ''
    syncAuth()
    if (wechat.value) await openSession()
    ready.value = true
  }

  async function openSession() {
    let key = localStorage.getItem(storageKey(slot.value, 'key'))
    if (!key) {
      key = crypto.randomUUID().replace(/-/g, '')
      localStorage.setItem(storageKey(slot.value, 'key'), key)
    }
    syncAuth()
    if (!token.value) {
      const session = await api<{ token: string }>('/api/v1/auth/session', {
        method: 'POST',
        body: { clientKey: key },
        wechat: true,
      })
      token.value = session.token
      localStorage.setItem(storageKey(slot.value, 'token'), session.token)
      syncAuth()
    }
    try {
      profile.value = await api<Profile>('/api/v1/me')
      error.value = ''
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        token.value = ''
        localStorage.removeItem(storageKey(slot.value, 'token'))
        syncAuth()
        await openSession()
        return
      }
      throw reason
    }
  }

  async function refresh() {
    syncAuth()
    profile.value = await api<Profile>('/api/v1/me')
  }

  async function enableWechat() {
    localStorage.setItem('eateat-wechat', '1')
    wechat.value = true
    ready.value = false
    booting = null
    await boot()
  }

  async function switchSlot(next: SlotName) {
    localStorage.setItem('eateat-slot', next)
    slot.value = next
    token.value = ''
    profile.value = null
    ready.value = false
    booting = null
    await boot()
  }

  async function createKitchen(role: Role) {
    profile.value = await api<Profile>('/api/v1/kitchens', { method: 'POST', body: { role } })
  }

  async function refreshInvite() {
    await api('/api/v1/kitchens/invite/refresh', { method: 'POST', body: {} })
    await refresh()
  }

  async function join(code: string, abandon = false) {
    profile.value = await api<Profile>(`/api/v1/invites/${encodeURIComponent(code)}/join`, {
      method: 'POST',
      body: { abandon },
    })
  }

  async function rename(displayName: string) {
    profile.value = await api<Profile>('/api/v1/me/name', {
      method: 'PATCH',
      body: { displayName },
    })
  }

  async function seen(surface: 'orders' | 'records') {
    profile.value = await api<Profile>('/api/v1/me/seen', { method: 'POST', body: { surface } })
  }

  async function unbind() {
    await api('/api/v1/kitchens/unbind', { method: 'POST', body: {} })
    profile.value = await api<Profile>('/api/v1/me')
  }

  return {
    wechat,
    token,
    profile,
    ready,
    slot,
    error,
    membership,
    bound,
    landing,
    boot,
    refresh,
    enableWechat,
    switchSlot,
    createKitchen,
    refreshInvite,
    join,
    rename,
    seen,
    unbind,
  }
})
