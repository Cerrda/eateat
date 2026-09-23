import { describe, expect, it } from 'vitest'
import { addCalendarDays, orderDates } from '../dates'
import { classifyRecipeUrl } from '../links'

describe('kitchen helpers', () => {
  it('classifies recipe links before any request', () => {
    expect(classifyRecipeUrl('https://xhslink.com/a/1')).toBe('xiaohongshu')
    expect(classifyRecipeUrl('https://v.douyin.com/abc')).toBe('douyin')
    expect(classifyRecipeUrl('https://example.com/a')).toBe('other')
  })

  it('offers today, tomorrow, and the day after', () => {
    const dates = orderDates(new Date('2026-09-23T04:00:00Z'))
    expect(dates.map((item) => item.label)).toEqual(['今天', '明天', '后天'])
    expect(dates[2]?.value).toBe(addCalendarDays('2026-09-23', 2))
  })
})
