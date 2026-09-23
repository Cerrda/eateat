import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { useApiHealth } from '../useApiHealth'

const Host = defineComponent({
  setup() {
    return useApiHealth()
  },
  template:
    '<p class="summary">{{ summary }}</p><p class="live">{{ live }}</p><p class="ready">{{ ready }}</p>',
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useApiHealth', () => {
  it('marks the service down when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (String(input).endsWith('/live')) {
          return new Response('{}', { status: 200 })
        }
        return new Response('{}', { status: 503 })
      }),
    )

    const wrapper = mount(Host)
    await flushPromises()

    expect(wrapper.get('.live').text()).toBe('up')
    expect(wrapper.get('.ready').text()).toBe('down')
    expect(wrapper.get('.summary').text()).toContain('数据库还没准备好')
  })
})
