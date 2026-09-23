const SHANGHAI = 'Asia/Shanghai';

export function shanghaiDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function orderDateWindow(now = new Date()): [string, string, string] {
  const today = shanghaiDate(now);
  return [today, addCalendarDays(today, 1), addCalendarDays(today, 2)];
}

export function isOrderDate(isoDate: string, now = new Date()): boolean {
  return orderDateWindow(now).includes(isoDate);
}

export function dateLabel(isoDate: string, now = new Date()): string {
  const [today, tomorrow, after] = orderDateWindow(now);
  if (isoDate === today) return '今天';
  if (isoDate === tomorrow) return '明天';
  if (isoDate === after) return '后天';
  return isoDate;
}

export function shanghaiDayStart(now = new Date()): Date {
  return new Date(`${shanghaiDate(now)}T00:00:00+08:00`);
}
