export function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function normalizeTitle(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function formatRelativeTime(value: Date | string): string {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  if (absMs < 45_000) return 'just now';

  const direction = Math.sign(diffMs);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const minutes = Math.round(absMs / 60_000);
  if (minutes < 60) return rtf.format(direction * minutes, 'minute');
  const hours = Math.round(absMs / 3_600_000);
  if (hours < 24) return rtf.format(direction * hours, 'hour');
  const days = Math.round(absMs / 86_400_000);
  if (days < 30) return rtf.format(direction * days, 'day');
  return formatDate(date);
}
