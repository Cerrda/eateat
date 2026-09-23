export function shanghaiDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const utc = new Date(Date.UTC(year ?? 2026, (month ?? 1) - 1, day ?? 1))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

export function orderDates(now = new Date()): Array<{ value: string; label: string }> {
  const today = shanghaiDate(now)
  return [
    { value: today, label: '今天' },
    { value: addCalendarDays(today, 1), label: '明天' },
    { value: addCalendarDays(today, 2), label: '后天' },
  ]
}

export function dateLabel(isoDate: string, now = new Date()): string {
  const match = orderDates(now).find((item) => item.value === isoDate)
  return match?.label ?? isoDate
}
