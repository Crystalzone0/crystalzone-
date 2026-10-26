const TIME_ZONE = 'Asia/Karachi';

/** formatMoney(2650) -> "Rs 2,650" */
export function formatMoney(amount, currency = 'PKR') {
  const value = Math.round(Number(amount) || 0);
  const symbol = currency === 'PKR' ? 'Rs' : currency;
  return `${symbol} ${value.toLocaleString('en-US')}`;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: TIME_ZONE,
});

export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '');
export const formatDateTime = (value) => (value ? dateTimeFormat.format(new Date(value)) : '');