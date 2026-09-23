import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ApiStatus from '../ApiStatus.vue'

describe('ApiStatus', () => {
  it('shows both checks and emits refresh', async () => {
    const wrapper = mount(ApiStatus, {
      props: {
        live: 'up',
        ready: 'down',
        summary: '服务醒着，数据库还没准备好。',
      },
    })

    expect(wrapper.text()).toContain('服务醒着，数据库还没准备好。')
    expect(wrapper.text()).toContain('正常')
    expect(wrapper.text()).toContain('不可用')

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })
})
