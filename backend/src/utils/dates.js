// Pakistan has a fixed UTC+5 offset (no daylight saving), so date-range boundaries use +05:00.
export const STORE_TIMEZONE = 'Asia/Karachi';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: STORE_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "2026-09-30" for the given moment, as the calendar date in store time. */
export const dayKey = (date = new Date()) => dayFormatter.format(date);

/** The last `count` calendar days in store time, oldest first, ending today. */
export function lastDays(count) {
  const days = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    days.push(dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000)));
  }
  return days;
}

export const startOfDay = (ymd) => new Date(`${ymd}T00:00:00+05:00`);
export const endOfDay = (ymd) => new Date(`${ymd}T23:59:59.999+05:00`);