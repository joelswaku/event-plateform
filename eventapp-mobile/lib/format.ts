import { format, formatDistanceToNow, isPast } from 'date-fns';

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'EEE, MMM d yyyy');
  } catch {
    return '—';
  }
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'EEE, MMM d · h:mm a');
  } catch {
    return '—';
  }
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '—';
  }
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'h:mm a');
  } catch {
    return '—';
  }
}

export function fmtCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isEventPast(iso: string | null | undefined): boolean {
  if (!iso) return false;
  try { return isPast(new Date(iso)); } catch { return false; }
}
