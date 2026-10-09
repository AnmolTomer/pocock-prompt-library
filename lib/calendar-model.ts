export const FIRST_MONTH = '2026-10';
export const LAST_MONTH = '9999-12';

export function dayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function monthKey(value: string): string {
  return dayKey(value).slice(0, 7);
}

export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${month}-01T00:00:00Z`));
}

export function shiftMonth(month: string, amount: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  if (date.getUTCFullYear() > 9999) return LAST_MONTH;
  const next = date.toISOString().slice(0, 7);
  return next < FIRST_MONTH ? FIRST_MONTH : next;
}

export function monthDays(month: string): (string | null)[] {
  const start = new Date(`${month}-01T00:00:00Z`);
  const count = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const leading = (start.getUTCDay() + 6) % 7;
  return Array.from({ length: Math.ceil((leading + count) / 7) * 7 }, (_, index) => {
    const day = index - leading + 1;
    return day < 1 || day > count ? null : `${month}-${String(day).padStart(2, '0')}`;
  });
}

export function moveCalendarFocus(day: string, key: string): string | null {
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = (date.getUTCDay() + 6) % 7;
  const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
  if (!(key in offsets)) return null;
  date.setUTCDate(date.getUTCDate() + offsets[key]);
  if (date.getUTCFullYear() > 9999) return `${LAST_MONTH}-31`;
  const next = dayKey(date.toISOString());
  return next < `${FIRST_MONTH}-01` ? `${FIRST_MONTH}-01` : next;
}
